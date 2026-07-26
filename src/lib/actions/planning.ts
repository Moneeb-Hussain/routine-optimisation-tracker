"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import {
  dailyPlanInputSchema,
  goalInputSchema,
  sleepLogInputSchema,
  taskInputSchema,
} from "@/lib/types";
import { hoursBetween } from "@/lib/domain/execution-score";

export type ActionState = { error?: string; success?: string };

async function requireUser() {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured." as const, supabase: null, user: null };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in." as const, supabase: null, user: null };
  }
  return { error: null, supabase, user };
}

export async function createTaskAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error || "Unauthorized" };

  const parsed = taskInputSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || "",
    category: formData.get("category") || "personal",
    priority: formData.get("priority") || "medium",
    is_must_do: formData.get("is_must_do") === "on",
    estimated_minutes: formData.get("estimated_minutes") || null,
    scheduled_date: formData.get("scheduled_date") || null,
    due_date: formData.get("due_date") || null,
    goal_id: formData.get("goal_id") || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid task." };
  }

  const { error } = await ctx.supabase.from("tasks").insert({
    user_id: ctx.user.id,
    ...parsed.data,
    description: parsed.data.description || "",
  });

  if (error) return { error: error.message };
  revalidatePath("/tasks");
  revalidatePath("/today");
  revalidatePath("/dashboard");
  return { success: "Task created." };
}

export async function toggleTaskDoneAction(taskId: string, done: boolean) {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return;

  await ctx.supabase
    .from("tasks")
    .update({
      status: done ? "done" : "todo",
      completed_at: done ? new Date().toISOString() : null,
    })
    .eq("id", taskId)
    .eq("user_id", ctx.user.id);

  revalidatePath("/tasks");
  revalidatePath("/today");
  revalidatePath("/dashboard");
}

export async function createGoalAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error || "Unauthorized" };

  const parsed = goalInputSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || "",
    horizon: formData.get("horizon") || "long_term",
    category: formData.get("category") || "admissions",
    target_date: formData.get("target_date") || null,
    parent_id: formData.get("parent_id") || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid goal." };
  }

  const { error } = await ctx.supabase.from("goals").insert({
    user_id: ctx.user.id,
    ...parsed.data,
    description: parsed.data.description || "",
  });

  if (error) return { error: error.message };
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return { success: "Goal created." };
}

export async function upsertDailyPlanAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error || "Unauthorized" };

  const parsed = dailyPlanInputSchema.safeParse({
    plan_date: formData.get("plan_date"),
    primary_goal: formData.get("primary_goal"),
    why_it_matters: formData.get("why_it_matters") || "",
    available_hours: formData.get("available_hours") || null,
    estimated_energy: formData.get("estimated_energy") || null,
    important_deadline: formData.get("important_deadline") || "",
    current_blocker: formData.get("current_blocker") || "",
    notes: formData.get("notes") || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid plan." };
  }

  const { error } = await ctx.supabase.from("daily_plans").upsert(
    {
      user_id: ctx.user.id,
      ...parsed.data,
    },
    { onConflict: "user_id,plan_date" },
  );

  if (error) return { error: error.message };
  revalidatePath("/today");
  revalidatePath("/dashboard");
  return { success: "Daily plan saved." };
}

export async function upsertSleepLogAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error || "Unauthorized" };

  const sleepStart = String(formData.get("sleep_start") || "") || null;
  const wakeTime = String(formData.get("wake_time") || "") || null;

  let duration = formData.get("duration_hours")
    ? Number(formData.get("duration_hours"))
    : null;

  if ((duration == null || Number.isNaN(duration)) && sleepStart && wakeTime) {
    duration = hoursBetween(new Date(sleepStart), new Date(wakeTime));
  }

  const parsed = sleepLogInputSchema.safeParse({
    log_date: formData.get("log_date"),
    sleep_start: sleepStart,
    wake_time: wakeTime,
    duration_hours: duration,
    quality: formData.get("quality") || null,
    awakenings: formData.get("awakenings") || 0,
    energy_level: formData.get("energy_level") || null,
    stress_level: formData.get("stress_level") || null,
    caffeine_note: formData.get("caffeine_note") || "",
    exercised: formData.get("exercised") === "on",
    notes: formData.get("notes") || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid sleep log." };
  }

  const { error } = await ctx.supabase.from("sleep_logs").upsert(
    {
      user_id: ctx.user.id,
      ...parsed.data,
    },
    { onConflict: "user_id,log_date" },
  );

  if (error) return { error: error.message };
  revalidatePath("/sleep");
  revalidatePath("/dashboard");
  return { success: "Sleep log saved." };
}

export async function startFocusSessionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error || "Unauthorized" };

  const planned = Number(formData.get("planned_minutes") || 25);
  const taskId = String(formData.get("task_id") || "") || null;

  const { error } = await ctx.supabase.from("focus_sessions").insert({
    user_id: ctx.user.id,
    task_id: taskId,
    planned_minutes: planned,
    status: "running",
  });

  if (error) return { error: error.message };
  revalidatePath("/focus");
  revalidatePath("/dashboard");
  return { success: "Focus session started." };
}

export async function completeFocusSessionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error || "Unauthorized" };

  const sessionId = String(formData.get("session_id") || "");
  const actual = Number(formData.get("actual_minutes") || 0);
  const quality = Number(formData.get("focus_quality") || 3);
  const notes = String(formData.get("completion_notes") || "");

  const { error } = await ctx.supabase
    .from("focus_sessions")
    .update({
      status: "completed",
      ended_at: new Date().toISOString(),
      actual_minutes: actual,
      focus_quality: quality,
      completion_notes: notes,
    })
    .eq("id", sessionId)
    .eq("user_id", ctx.user.id);

  if (error) return { error: error.message };
  revalidatePath("/focus");
  revalidatePath("/dashboard");
  return { success: "Focus session saved." };
}
