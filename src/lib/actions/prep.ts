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

async function refreshTrackProgress(trackId: string, userId: string) {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("preparation_items")
    .select("status")
    .eq("track_id", trackId)
    .eq("user_id", userId);

  const total = items?.length || 0;
  const done = (items || []).filter((i) => i.status === "done").length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  await supabase
    .from("preparation_tracks")
    .update({ completion_percent: pct, status: pct === 100 ? "completed" : "active" })
    .eq("id", trackId)
    .eq("user_id", userId);
}

export async function createPrepTrackAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error || "Unauthorized" };

  const title = String(formData.get("title") || "").trim();
  const trackType = String(formData.get("track_type") || "graduate_admissions");
  const description = String(formData.get("description") || "");
  if (!title) return { error: "Title is required." };

  const { data: track, error } = await ctx.supabase
    .from("preparation_tracks")
    .insert({
      user_id: ctx.user.id,
      title,
      track_type: trackType,
      description,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Seed a practical starter set for morning use
  const seeds = [
    "Write a 60-second introduction",
    "Prepare 3-minute research story (Retail Checkout V-3)",
    "List 5 questions to ask a professor",
    "Practice one behavioral STAR story",
    "Review IELTS speaking fluency for 15 minutes",
  ];

  if (track) {
    await ctx.supabase.from("preparation_items").insert(
      seeds.map((itemTitle, index) => ({
        user_id: ctx.user!.id,
        track_id: track.id,
        title: itemTitle,
        day_number: index + 1,
        estimated_minutes: 20,
        sort_order: index,
      })),
    );
    await refreshTrackProgress(track.id, ctx.user.id);
  }

  revalidatePath("/interview-prep");
  return { success: "Prep track created with starter items." };
}

export async function addPrepItemAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error || "Unauthorized" };

  const trackId = String(formData.get("track_id") || "");
  const title = String(formData.get("title") || "").trim();
  if (!trackId || !title) return { error: "Track and title are required." };

  const { error } = await ctx.supabase.from("preparation_items").insert({
    user_id: ctx.user.id,
    track_id: trackId,
    title,
    description: String(formData.get("description") || ""),
    estimated_minutes: Number(formData.get("estimated_minutes") || 20),
    day_number: Number(formData.get("day_number") || 0) || null,
  });

  if (error) return { error: error.message };
  await refreshTrackProgress(trackId, ctx.user.id);
  revalidatePath("/interview-prep");
  revalidatePath(`/interview-prep/${trackId}`);
  return { success: "Item added." };
}

export async function togglePrepItemDoneAction(itemId: string, trackId: string, done: boolean) {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return;

  await ctx.supabase
    .from("preparation_items")
    .update({
      status: done ? "done" : "todo",
      completion_percent: done ? 100 : 0,
      completed_at: done ? new Date().toISOString() : null,
      last_reviewed_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .eq("user_id", ctx.user.id);

  await refreshTrackProgress(trackId, ctx.user.id);
  revalidatePath("/interview-prep");
  revalidatePath(`/interview-prep/${trackId}`);
  revalidatePath("/dashboard");
}

export async function addQuestionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error || "Unauthorized" };

  const question = String(formData.get("question") || "").trim();
  if (!question) return { error: "Question is required." };

  const { error } = await ctx.supabase.from("question_bank").insert({
    user_id: ctx.user.id,
    track_id: String(formData.get("track_id") || "") || null,
    question,
    category: String(formData.get("category") || "general"),
    difficulty: String(formData.get("difficulty") || "medium"),
    expected_answer: String(formData.get("expected_answer") || ""),
  });

  if (error) return { error: error.message };
  revalidatePath("/interview-prep");
  return { success: "Question saved." };
}

export async function saveQuestionAttemptAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error || "Unauthorized" };

  const questionId = String(formData.get("question_id") || "");
  if (!questionId) return { error: "Question required." };

  const { error } = await ctx.supabase.from("question_attempts").insert({
    user_id: ctx.user.id,
    question_id: questionId,
    user_answer: String(formData.get("user_answer") || ""),
    confidence: Number(formData.get("confidence") || 3),
    score: Number(formData.get("score") || 0) || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/interview-prep");
  return { success: "Attempt logged." };
}
