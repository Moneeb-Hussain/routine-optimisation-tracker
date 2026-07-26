"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import {
  buildWeeklyReviewStats,
  weekEndFromStart,
  weekStartFromDate,
} from "@/lib/domain/weekly-review";

export type ActionState = { error?: string; success?: string };

function todayInTimeZone(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function generateWeeklyReviewAction(): Promise<ActionState> {
  if (!isSupabaseConfigured()) return { error: "Supabase is not configured." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in required." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .maybeSingle();
  const timezone = profile?.timezone || "Asia/Karachi";
  const today = todayInTimeZone(timezone);
  const weekStart = weekStartFromDate(today);
  const weekEnd = weekEndFromStart(weekStart);

  const [tasks, focus, sleep, outreach, followUps, prepItems, plans] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("scheduled_date, status, is_must_do")
        .eq("user_id", user.id)
        .gte("scheduled_date", weekStart)
        .lte("scheduled_date", weekEnd),
      supabase
        .from("focus_sessions")
        .select("actual_minutes, planned_minutes, status")
        .eq("user_id", user.id)
        .gte("started_at", `${weekStart}T00:00:00`)
        .lte("started_at", `${weekEnd}T23:59:59`),
      supabase
        .from("sleep_logs")
        .select("duration_hours")
        .eq("user_id", user.id)
        .gte("log_date", weekStart)
        .lte("log_date", weekEnd),
      supabase
        .from("outreach_records")
        .select("id")
        .eq("user_id", user.id)
        .gte("created_at", `${weekStart}T00:00:00`),
      supabase
        .from("outreach_followups")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "pending"),
      supabase
        .from("preparation_items")
        .select("status")
        .eq("user_id", user.id),
      supabase
        .from("daily_plans")
        .select("current_blocker")
        .eq("user_id", user.id)
        .gte("plan_date", weekStart)
        .lte("plan_date", weekEnd),
    ]);

  const focusMinutes = (focus.data || []).reduce((sum, s) => {
    const mins = s.actual_minutes ?? s.planned_minutes ?? 0;
    return sum + (s.status === "completed" || s.actual_minutes ? mins : 0);
  }, 0);

  const prep = prepItems.data || [];
  const stats = buildWeeklyReviewStats({
    weekStart,
    weekEnd,
    tasks: tasks.data || [],
    focusMinutes,
    sleepHours: (sleep.data || [])
      .map((s) => Number(s.duration_hours))
      .filter((n) => !Number.isNaN(n)),
    outreachSent: outreach.data?.length || 0,
    followUpsPending: followUps.data?.length || 0,
    prepDone: prep.filter((p) => p.status === "done").length,
    prepTotal: prep.length,
    blockers: (plans.data || []).map((p) => p.current_blocker || ""),
  });

  const { error } = await supabase.from("weekly_reviews").upsert(
    {
      user_id: user.id,
      week_start: weekStart,
      completion_percent: stats.completionPercent,
      must_do_rate: stats.mustDoRate,
      deep_work_hours: stats.deepWorkHours,
      sleep_average: stats.sleepAverage,
      outreach_summary: stats.outreachSummary,
      interview_summary: stats.interviewSummary,
      best_day: stats.bestDay,
      weakest_day: stats.weakestDay,
      common_blocker: stats.commonBlocker,
      top_achievement: stats.suggestedAchievement,
      next_week_priorities: stats.suggestedPriorities,
      report: stats,
    },
    { onConflict: "user_id,week_start" },
  );

  if (error) return { error: error.message };
  revalidatePath("/analytics");
  revalidatePath("/today");
  revalidatePath("/dashboard");
  return { success: "Weekly review generated." };
}

export async function updateWeeklyReviewNotesAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured()) return { error: "Supabase is not configured." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in required." };

  const weekStart = String(formData.get("week_start") || "");
  if (!weekStart) return { error: "Week start required." };

  const { error } = await supabase
    .from("weekly_reviews")
    .update({
      top_achievement: String(formData.get("top_achievement") || ""),
      next_week_priorities: String(formData.get("next_week_priorities") || ""),
      common_blocker: String(formData.get("common_blocker") || ""),
    })
    .eq("user_id", user.id)
    .eq("week_start", weekStart);

  if (error) return { error: error.message };
  revalidatePath("/analytics");
  return { success: "Weekly notes saved." };
}
