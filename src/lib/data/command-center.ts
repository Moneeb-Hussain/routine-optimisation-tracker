import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { calculateExecutionScore } from "@/lib/domain/execution-score";
import { summarizeStage } from "@/lib/domain/outreach-stages";
import { commandCenterDemo } from "@/lib/fixtures/command-center";
import type { DailyPlan, Goal, Profile, SleepLog, Task } from "@/lib/types";
import type { ScoreBreakdownItem } from "@/lib/domain/execution-score";
import type { Tone } from "@/lib/fixtures/command-center";

export type CommandCenterData = {
  mode: "live" | "demo";
  setupRequired: boolean;
  userFirstName: string;
  timezone: string;
  primaryGoal: string;
  daysToDeadline: number;
  deadlineLabel: string;
  executionScore: number;
  weeklyProgress: number;
  streakDays: number;
  sleepHours: number;
  sleepTarget: number;
  energyLevel: number;
  deepWorkMinutes: number;
  deepWorkTarget: number;
  interviewPrepPct: number;
  applicationReadinessPct: number;
  nextBestAction: { title: string; reason: string; minutes: number };
  risk: { label: string; detail: string };
  motivation: string;
  mustDos: Array<{
    id: string;
    title: string;
    minutes: number;
    category: string;
    done: boolean;
  }>;
  recentWins: string[];
  pipeline: Array<{ stage: string; count: number }>;
  followUps: Array<{
    professor: string;
    university: string;
    due: string;
    tone: Tone;
  }>;
  scoreBreakdown: ScoreBreakdownItem[];
  weeklyExecution: Array<{ day: string; score: number; deepWork: number }>;
  categoryMix: Array<{ name: string; value: number; fill: string }>;
};

function todayInTimeZone(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function dateOffsetInTimeZone(timeZone: string, daysAgo: number) {
  const now = new Date();
  now.setDate(now.getDate() - daysAgo);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export async function getCommandCenterData(): Promise<CommandCenterData> {
  if (!isSupabaseConfigured()) {
    return {
      ...commandCenterDemo,
      weeklyExecution: [...commandCenterDemo.weeklyExecution],
      categoryMix: [...commandCenterDemo.categoryMix],
      mustDos: [...commandCenterDemo.mustDos],
      recentWins: [...commandCenterDemo.recentWins],
      pipeline: [...commandCenterDemo.pipeline],
      followUps: [...commandCenterDemo.followUps],
      scoreBreakdown: [...commandCenterDemo.scoreBreakdown],
      mode: "demo",
      setupRequired: true,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ...commandCenterDemo,
      weeklyExecution: [...commandCenterDemo.weeklyExecution],
      categoryMix: [...commandCenterDemo.categoryMix],
      mustDos: [...commandCenterDemo.mustDos],
      recentWins: [...commandCenterDemo.recentWins],
      pipeline: [...commandCenterDemo.pipeline],
      followUps: [...commandCenterDemo.followUps],
      scoreBreakdown: [...commandCenterDemo.scoreBreakdown],
      mode: "demo",
      setupRequired: false,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const typedProfile = profile as Profile | null;
  const timezone = typedProfile?.timezone || "Asia/Karachi";
  const today = todayInTimeZone(timezone);
  const weekStart = dateOffsetInTimeZone(timezone, 6);

  const [
    prefsRes,
    planRes,
    tasksRes,
    sleepRes,
    focusRes,
    goalsRes,
    weekTasksRes,
    weekFocusRes,
    professorsRes,
    followUpsRes,
    prepTracksRes,
  ] = await Promise.all([
    supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("daily_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("plan_date", today)
      .maybeSingle(),
    supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("scheduled_date", today)
      .order("is_must_do", { ascending: false }),
    supabase
      .from("sleep_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("log_date", dateOffsetInTimeZone(timezone, 1))
      .maybeSingle(),
    supabase
      .from("focus_sessions")
      .select("actual_minutes, planned_minutes, status, started_at")
      .eq("user_id", user.id)
      .gte("started_at", `${today}T00:00:00`),
    supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("sort_order"),
    supabase
      .from("tasks")
      .select("scheduled_date, status, is_must_do, priority")
      .eq("user_id", user.id)
      .gte("scheduled_date", weekStart)
      .lte("scheduled_date", today),
    supabase
      .from("focus_sessions")
      .select("started_at, actual_minutes, planned_minutes, status")
      .eq("user_id", user.id)
      .gte("started_at", `${weekStart}T00:00:00`),
    supabase.from("professors").select("id, full_name, outreach_stage, universities(name)").eq("user_id", user.id),
    supabase
      .from("outreach_followups")
      .select("id, due_on, status, professors(full_name)")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .lte("due_on", today)
      .order("due_on")
      .limit(5),
    supabase
      .from("preparation_tracks")
      .select("completion_percent, status")
      .eq("user_id", user.id)
      .eq("status", "active"),
  ]);

  const plan = planRes.data as DailyPlan | null;
  const tasks = (tasksRes.data || []) as Task[];
  const sleep = sleepRes.data as SleepLog | null;
  const goals = (goalsRes.data || []) as Goal[];
  const sleepTarget = Number(prefsRes.data?.sleep_target_hours ?? 7.5);
  const deepWorkTarget = Number(prefsRes.data?.deep_work_target_minutes ?? 120);

  const mustDos = tasks.filter((t) => t.is_must_do);
  const mustDone = mustDos.filter((t) => t.status === "done").length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const weightedTaskCompletion =
    tasks.length === 0 ? 100 : Math.round((doneTasks / tasks.length) * 100);

  const deepWorkMinutes = (focusRes.data || []).reduce((sum, session) => {
    if (session.status !== "completed") return sum;
    return sum + Number(session.actual_minutes ?? session.planned_minutes ?? 0);
  }, 0);

  const score = calculateExecutionScore({
    mustDoTotal: mustDos.length,
    mustDoCompleted: mustDone,
    weightedTaskCompletion,
    deepWorkMinutes,
    deepWorkTargetMinutes: deepWorkTarget,
    primaryGoalProgress: plan?.primary_goal ? (doneTasks > 0 ? 60 : 20) : 0,
    scheduleAdherence: tasks.length === 0 ? 50 : weightedTaskCompletion,
    reviewCompleted: false,
    sleepHours: sleep?.duration_hours ?? null,
    sleepTargetHours: sleepTarget,
  });

  // Weekly series
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyExecution = Array.from({ length: 7 }, (_, i) => {
    const date = dateOffsetInTimeZone(timezone, 6 - i);
    const dayTasks = (weekTasksRes.data || []).filter((t) => t.scheduled_date === date);
    const completed = dayTasks.filter((t) => t.status === "done").length;
    const dayScore =
      dayTasks.length === 0 ? 0 : Math.round((completed / dayTasks.length) * 100);
    const deepWork = (weekFocusRes.data || [])
      .filter((s) => String(s.started_at).startsWith(date) && s.status === "completed")
      .reduce(
        (sum, s) => sum + Number(s.actual_minutes ?? s.planned_minutes ?? 0),
        0,
      );
    const weekday = dayNames[new Date(`${date}T12:00:00`).getDay()];
    return { day: weekday, score: dayScore, deepWork };
  });

  const firstName =
    typedProfile?.full_name?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "there";

  const avgGoalProgress =
    goals.length === 0
      ? 0
      : Math.round(
          goals.reduce((sum, g) => sum + (g.progress_percent || 0), 0) / goals.length,
        );

  const prepTracks = prepTracksRes.data || [];
  const interviewPrepPct =
    prepTracks.length === 0
      ? 0
      : Math.round(
          prepTracks.reduce((s, t) => s + (t.completion_percent || 0), 0) /
            prepTracks.length,
        );

  return {
    ...commandCenterDemo,
    mode: "live",
    setupRequired: false,
    userFirstName: firstName,
    timezone,
    primaryGoal:
      plan?.primary_goal ||
      "Set today’s primary goal in Today to drive your execution score.",
    executionScore: score.total,
    scoreBreakdown: score.breakdown,
    weeklyProgress: Math.round(
      weeklyExecution.reduce((s, d) => s + d.score, 0) / 7,
    ),
    sleepHours: Number(sleep?.duration_hours ?? 0),
    sleepTarget,
    energyLevel: Number(sleep?.energy_level ?? 3),
    deepWorkMinutes,
    deepWorkTarget,
    interviewPrepPct,
    applicationReadinessPct: avgGoalProgress,
    weeklyExecution,
    mustDos: mustDos.slice(0, 6).map((t) => ({
      id: t.id,
      title: t.title,
      minutes: t.estimated_minutes || 25,
      category: t.category,
      done: t.status === "done",
    })),
    nextBestAction: (() => {
      const due = (followUpsRes.data || [])[0] as
        | {
            professors?: { full_name?: string } | Array<{ full_name?: string }> | null;
          }
        | undefined;
      const dueProf = due
        ? Array.isArray(due.professors)
          ? due.professors[0]?.full_name
          : due.professors?.full_name
        : null;
      return {
        title: dueProf
          ? `Follow up: ${dueProf}`
          : mustDos.find((t) => t.status !== "done")?.title ||
            tasks.find((t) => t.status !== "done")?.title ||
            "Add a university and your first professor",
        reason: dueProf
          ? "A professor follow-up is due — one strong follow-up beats new generic drafts."
          : plan?.current_blocker
            ? `Current blocker: ${plan.current_blocker}`
            : "Highest-impact incomplete item for today’s admissions progress.",
        minutes:
          mustDos.find((t) => t.status !== "done")?.estimated_minutes ||
          tasks.find((t) => t.status !== "done")?.estimated_minutes ||
          25,
      };
    })(),
    risk: {
      label: plan?.current_blocker ? "Active blocker" : "No blocker logged",
      detail:
        plan?.current_blocker ||
        "Add a blocker on Today if something is slowing admissions progress.",
    },
    motivation:
      sleep && sleep.duration_hours != null && sleep.duration_hours < sleepTarget - 1
        ? "Sleep was short. Protect one high-impact task and keep the workload realistic."
        : "One verified next action beats a crowded list. Finish the must-do that moves the US goal.",
    pipeline: professorsRes.error
      ? [...commandCenterDemo.pipeline]
      : buildPipeline(professorsRes.data || []),
    followUps: followUpsRes.error
      ? [...commandCenterDemo.followUps]
      : buildFollowUps(followUpsRes.data || [], today),
    categoryMix: [...commandCenterDemo.categoryMix],
    recentWins:
      tasks.filter((t) => t.status === "done").slice(0, 3).map((t) => t.title)
        .length > 0
        ? tasks
            .filter((t) => t.status === "done")
            .slice(0, 3)
            .map((t) => t.title)
        : [...commandCenterDemo.recentWins],
  };
}

function buildPipeline(
  professors: Array<{ outreach_stage?: string | null }>,
): Array<{ stage: string; count: number }> {
  if (!professors.length) {
    return [
      { stage: "Discovered", count: 0 },
      { stage: "Researching", count: 0 },
      { stage: "Strong Fit", count: 0 },
      { stage: "Draft Ready", count: 0 },
      { stage: "Sent", count: 0 },
      { stage: "Follow-up Due", count: 0 },
      { stage: "Replied", count: 0 },
    ];
  }

  const counts = new Map<string, number>();
  for (const p of professors) {
    const bucket = summarizeStage(p.outreach_stage || "Discovered");
    counts.set(bucket, (counts.get(bucket) || 0) + 1);
  }

  const order = [
    "Discovered",
    "Researching",
    "Strong Fit",
    "Draft Ready",
    "Sent",
    "Follow-up Due",
    "Replied",
  ];

  return order.map((stage) => ({ stage, count: counts.get(stage) || 0 }));
}

function buildFollowUps(
  rows: Array<{
    due_on?: string | null;
    professors?: { full_name?: string } | Array<{ full_name?: string }> | null;
  }>,
  today: string,
): Array<{ professor: string; university: string; due: string; tone: Tone }> {
  if (!rows.length) return [];

  return rows.map((row) => {
    const prof = Array.isArray(row.professors) ? row.professors[0] : row.professors;
    const dueOn = row.due_on || today;
    return {
      professor: prof?.full_name || "Professor",
      university: "—",
      due: dueOn <= today ? "Today" : dueOn,
      tone: (dueOn <= today ? "critical" : "watch") as Tone,
    };
  });
}

export async function getCurrentProfile() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return data as Profile | null;
}

export async function getTodayContext() {
  if (!isSupabaseConfigured()) {
    return { configured: false as const, plan: null, tasks: [], timezone: "Asia/Karachi", today: "" };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { configured: true as const, plan: null, tasks: [], timezone: "Asia/Karachi", today: "" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .maybeSingle();
  const timezone = profile?.timezone || "Asia/Karachi";
  const today = todayInTimeZone(timezone);

  const [planRes, tasksRes] = await Promise.all([
    supabase
      .from("daily_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("plan_date", today)
      .maybeSingle(),
    supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("scheduled_date", today)
      .order("is_must_do", { ascending: false }),
  ]);

  return {
    configured: true as const,
    plan: planRes.data as DailyPlan | null,
    tasks: (tasksRes.data || []) as Task[],
    timezone,
    today,
  };
}
