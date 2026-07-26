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

async function refreshPlanProgress(planId: string, userId: string) {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("learning_items")
    .select("status")
    .eq("plan_id", planId)
    .eq("user_id", userId);

  const total = items?.length || 0;
  const done = (items || []).filter((i) => i.status === "done").length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  await supabase
    .from("learning_plans")
    .update({ completion_percent: pct, status: pct === 100 ? "completed" : "active" })
    .eq("id", planId)
    .eq("user_id", userId);
}

export async function createLearningPlanAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error || "Unauthorized" };

  const title = String(formData.get("title") || "").trim();
  if (!title) return { error: "Title is required." };

  const { data: plan, error } = await ctx.supabase
    .from("learning_plans")
    .insert({
      user_id: ctx.user.id,
      title,
      area: String(formData.get("area") || "general"),
      goal: String(formData.get("goal") || ""),
      daily_minutes: Number(formData.get("daily_minutes") || 45),
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (plan) {
    const seeds = [
      "Read one strong paper abstract in your target lab area",
      "Rewrite one CV bullet with quantified impact",
      "Practice explaining your project in 90 seconds",
    ];
    await ctx.supabase.from("learning_items").insert(
      seeds.map((itemTitle, index) => ({
        user_id: ctx.user!.id,
        plan_id: plan.id,
        title: itemTitle,
        day_number: index + 1,
        estimated_minutes: 20,
        sort_order: index,
      })),
    );
    await refreshPlanProgress(plan.id, ctx.user.id);
  }

  revalidatePath("/learning");
  return { success: "Learning plan created." };
}

export async function addLearningItemAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error || "Unauthorized" };

  const planId = String(formData.get("plan_id") || "");
  const title = String(formData.get("title") || "").trim();
  if (!planId || !title) return { error: "Plan and title are required." };

  const { error } = await ctx.supabase.from("learning_items").insert({
    user_id: ctx.user.id,
    plan_id: planId,
    title,
    estimated_minutes: Number(formData.get("estimated_minutes") || 20),
  });

  if (error) return { error: error.message };
  await refreshPlanProgress(planId, ctx.user.id);
  revalidatePath("/learning");
  return { success: "Item added." };
}

export async function toggleLearningItemDoneAction(
  itemId: string,
  planId: string,
  done: boolean,
) {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return;

  await ctx.supabase
    .from("learning_items")
    .update({
      status: done ? "done" : "todo",
      completed_at: done ? new Date().toISOString() : null,
    })
    .eq("id", itemId)
    .eq("user_id", ctx.user.id);

  await refreshPlanProgress(planId, ctx.user.id);
  revalidatePath("/learning");
  revalidatePath("/dashboard");
}
