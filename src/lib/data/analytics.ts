import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import {
  weekEndFromStart,
  weekStartFromDate,
} from "@/lib/domain/weekly-review";

function todayInTimeZone(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export type AnalyticsData = {
  mode: "live" | "demo";
  timezone: string;
  weekStart: string;
  weekEnd: string;
  kpis: {
    tasksDone: number;
    mustDoRate: number;
    deepWorkHours: number;
    sleepAvg: number;
    outreachCount: number;
    prepPct: number;
  };
  dailyExecution: Array<{ day: string; done: number; total: number; deepWork: number }>;
  sleepSeries: Array<{ day: string; hours: number }>;
  pipeline: Array<{ stage: string; count: number }>;
  weeklyReview: Record<string, unknown> | null;
};

const demo: AnalyticsData = {
  mode: "demo",
  timezone: "Asia/Karachi",
  weekStart: "2026-07-20",
  weekEnd: "2026-07-26",
  kpis: {
    tasksDone: 12,
    mustDoRate: 70,
    deepWorkHours: 6.5,
    sleepAvg: 7.2,
    outreachCount: 4,
    prepPct: 35,
  },
  dailyExecution: [
    { day: "Mon", done: 2, total: 3, deepWork: 60 },
    { day: "Tue", done: 1, total: 2, deepWork: 45 },
    { day: "Wed", done: 3, total: 3, deepWork: 90 },
    { day: "Thu", done: 2, total: 4, deepWork: 30 },
    { day: "Fri", done: 2, total: 2, deepWork: 75 },
    { day: "Sat", done: 1, total: 2, deepWork: 40 },
    { day: "Sun", done: 1, total: 1, deepWork: 50 },
  ],
  sleepSeries: [
    { day: "Mon", hours: 7 },
    { day: "Tue", hours: 6.5 },
    { day: "Wed", hours: 7.5 },
    { day: "Thu", hours: 8 },
    { day: "Fri", hours: 7 },
    { day: "Sat", hours: 7.2 },
    { day: "Sun", hours: 6.8 },
  ],
  pipeline: [
    { stage: "Discovered", count: 3 },
    { stage: "Researched", count: 2 },
    { stage: "Drafted", count: 1 },
    { stage: "Sent", count: 2 },
  ],
  weeklyReview: null,
};

export async function getAnalyticsData(): Promise<AnalyticsData> {
  if (!isSupabaseConfigured()) return { ...demo, mode: "demo" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ...demo, mode: "demo" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .maybeSingle();
  const timezone = profile?.timezone || "Asia/Karachi";
  const today = todayInTimeZone(timezone);
  const weekStart = weekStartFromDate(today);
  const weekEnd = weekEndFromStart(weekStart);

  const [tasks, focus, sleep, outreach, professors, tracks, review] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("scheduled_date, status, is_must_do")
        .eq("user_id", user.id)
        .gte("scheduled_date", weekStart)
        .lte("scheduled_date", weekEnd),
      supabase
        .from("focus_sessions")
        .select("started_at, actual_minutes, planned_minutes")
        .eq("user_id", user.id)
        .gte("started_at", `${weekStart}T00:00:00`)
        .lte("started_at", `${weekEnd}T23:59:59`),
      supabase
        .from("sleep_logs")
        .select("log_date, duration_hours")
        .eq("user_id", user.id)
        .gte("log_date", weekStart)
        .lte("log_date", weekEnd),
      supabase
        .from("outreach_records")
        .select("id")
        .eq("user_id", user.id)
        .gte("created_at", `${weekStart}T00:00:00`),
      supabase.from("professors").select("outreach_stage").eq("user_id", user.id),
      supabase
        .from("preparation_tracks")
        .select("completion_percent")
        .eq("user_id", user.id),
      supabase
        .from("weekly_reviews")
        .select("*")
        .eq("user_id", user.id)
        .eq("week_start", weekStart)
        .maybeSingle(),
    ]);

  const dayFmt = new Intl.DateTimeFormat("en-US", { weekday: "short" });
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(`${weekStart}T12:00:00`);
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }

  const dailyExecution = days.map((date) => {
    const dayTasks = (tasks.data || []).filter((t) => t.scheduled_date === date);
    const deepWork = (focus.data || [])
      .filter((f) => (f.started_at || "").startsWith(date))
      .reduce((s, f) => s + (f.actual_minutes ?? f.planned_minutes ?? 0), 0);
    return {
      day: dayFmt.format(new Date(`${date}T12:00:00`)),
      done: dayTasks.filter((t) => t.status === "done").length,
      total: dayTasks.length,
      deepWork,
    };
  });

  const sleepSeries = days.map((date) => {
    const log = (sleep.data || []).find((s) => s.log_date === date);
    return {
      day: dayFmt.format(new Date(`${date}T12:00:00`)),
      hours: Number(log?.duration_hours ?? 0),
    };
  });

  const scheduled = tasks.data || [];
  const must = scheduled.filter((t) => t.is_must_do);
  const focusMinutes = (focus.data || []).reduce(
    (s, f) => s + (f.actual_minutes ?? f.planned_minutes ?? 0),
    0,
  );
  const sleepVals = (sleep.data || [])
    .map((s) => Number(s.duration_hours))
    .filter((n) => !Number.isNaN(n) && n > 0);
  const tracksData = tracks.data || [];

  const pipelineMap: Record<string, number> = {};
  for (const p of professors.data || []) {
    const stage = p.outreach_stage || "Discovered";
    pipelineMap[stage] = (pipelineMap[stage] || 0) + 1;
  }

  return {
    mode: "live",
    timezone,
    weekStart,
    weekEnd,
    kpis: {
      tasksDone: scheduled.filter((t) => t.status === "done").length,
      mustDoRate:
        must.length === 0
          ? 0
          : Math.round(
              (must.filter((t) => t.status === "done").length / must.length) * 100,
            ),
      deepWorkHours: Math.round((focusMinutes / 60) * 10) / 10,
      sleepAvg:
        sleepVals.length === 0
          ? 0
          : Math.round(
              (sleepVals.reduce((a, b) => a + b, 0) / sleepVals.length) * 10,
            ) / 10,
      outreachCount: outreach.data?.length || 0,
      prepPct:
        tracksData.length === 0
          ? 0
          : Math.round(
              tracksData.reduce((s, t) => s + (t.completion_percent || 0), 0) /
                tracksData.length,
            ),
    },
    dailyExecution,
    sleepSeries,
    pipeline: Object.entries(pipelineMap).map(([stage, count]) => ({
      stage,
      count,
    })),
    weeklyReview: review.data || null,
  };
}
