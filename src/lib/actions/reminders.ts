"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export type ActionState = { error?: string; success?: string };

async function requireUser() {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured." as const, supabase: null, user: null };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in required." as const, supabase: null, user: null };
  return { error: null, supabase, user };
}

export async function createReminderAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error || "Unauthorized" };

  const title = String(formData.get("title") || "").trim();
  const dueLocal = String(formData.get("due_at") || "");
  if (!title || !dueLocal) return { error: "Title and due time are required." };

  const { error } = await ctx.supabase.from("reminders").insert({
    user_id: ctx.user.id,
    title,
    body: String(formData.get("body") || ""),
    reminder_type: String(formData.get("reminder_type") || "general"),
    due_at: new Date(dueLocal).toISOString(),
    channel: String(formData.get("channel") || "in_app"),
  });

  if (error) return { error: error.message };
  revalidatePath("/reminders");
  revalidatePath("/dashboard");
  return { success: "Reminder created." };
}

export async function completeReminderAction(id: string) {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return;

  await ctx.supabase
    .from("reminders")
    .update({ status: "done", completed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", ctx.user.id);

  revalidatePath("/reminders");
  revalidatePath("/dashboard");
}

export async function dismissReminderAction(id: string) {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return;

  await ctx.supabase
    .from("reminders")
    .update({ status: "dismissed" })
    .eq("id", id)
    .eq("user_id", ctx.user.id);

  revalidatePath("/reminders");
}

export async function snoozeReminderAction(id: string, hours = 4) {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return;

  const until = new Date();
  until.setHours(until.getHours() + hours);

  await ctx.supabase
    .from("reminders")
    .update({
      status: "snoozed",
      snoozed_until: until.toISOString(),
      due_at: until.toISOString(),
    })
    .eq("id", id)
    .eq("user_id", ctx.user.id);

  revalidatePath("/reminders");
}

export async function updateNotificationPrefsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error || "Unauthorized" };

  const { error } = await ctx.supabase.from("notification_preferences").upsert(
    {
      user_id: ctx.user.id,
      email_enabled: formData.get("email_enabled") === "on",
      in_app_enabled: formData.get("in_app_enabled") === "on",
      quiet_hours_start: String(formData.get("quiet_hours_start") || "22:00"),
      quiet_hours_end: String(formData.get("quiet_hours_end") || "07:00"),
      max_emails_per_day: Number(formData.get("max_emails_per_day") || 5),
    },
    { onConflict: "user_id" },
  );

  if (error) return { error: error.message };
  revalidatePath("/reminders");
  return { success: "Notification preferences saved." };
}
