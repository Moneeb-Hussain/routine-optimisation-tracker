"use server";

import { revalidatePath } from "next/cache";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import {
  getOpenAIModel,
  isOpenAIConfigured,
  isSupabaseConfigured,
} from "@/lib/env";
import {
  parseStudyPlanHeuristic,
  studyPlanParseSchema,
} from "@/lib/domain/study-plan";

export type ActionState = { error?: string; success?: string; planId?: string };

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
      daily_minutes: Number(formData.get("daily_minutes") || 60),
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
  return { success: "Study plan created.", planId: plan?.id };
}

export async function importStudyPlanFromDocumentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error || "Unauthorized" };

  const documentId = String(formData.get("document_id") || "");
  const area = String(formData.get("area") || "robotics").trim() || "robotics";
  const dailyMinutes = Number(formData.get("daily_minutes") || 60) || 60;
  if (!documentId) return { error: "Select a document with a day-wise plan." };

  const { data: doc } = await ctx.supabase
    .from("documents")
    .select("id, title, active_version")
    .eq("id", documentId)
    .eq("user_id", ctx.user.id)
    .maybeSingle();
  if (!doc) return { error: "Document not found." };

  const { data: version } = await ctx.supabase
    .from("document_versions")
    .select("extracted_text")
    .eq("document_id", documentId)
    .eq("version", doc.active_version)
    .eq("user_id", ctx.user.id)
    .maybeSingle();

  const text = (version?.extracted_text || "").trim();
  if (!text) {
    return {
      error:
        "Document has no extracted text. Open it in Documents and paste/save text first.",
    };
  }

  let parsed = parseStudyPlanHeuristic(text, area, dailyMinutes);

  if (isOpenAIConfigured()) {
    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const model = getOpenAIModel();
      const response = await client.responses.create({
        model,
        input: [
          {
            role: "system",
            content: `You convert a day-wise study plan document into structured JSON for Mission USA AI.
Return JSON: { title, area, daily_minutes, days: [{ day_number, title, description, estimated_minutes }] }.
Prefer ~${dailyMinutes} minutes per day. Keep day titles actionable. Do not invent days that are not in the source.
Area hint: ${area}.`,
          },
          {
            role: "user",
            content: text.slice(0, 80_000),
          },
        ],
        text: { format: { type: "json_object" } },
      });
      const candidate = studyPlanParseSchema.safeParse(
        JSON.parse(response.output_text || "{}"),
      );
      if (candidate.success && candidate.data.days.length > 0) {
        parsed = {
          ...candidate.data,
          area: candidate.data.area || area,
          daily_minutes: candidate.data.daily_minutes || dailyMinutes,
        };
      }
    } catch {
      // keep heuristic
    }
  }

  const { data: plan, error } = await ctx.supabase
    .from("learning_plans")
    .insert({
      user_id: ctx.user.id,
      title: parsed.title || `${area} study plan`,
      area: parsed.area || area,
      goal: `Day-wise ${parsed.area || area} plan (~${parsed.daily_minutes}m/day)`,
      daily_minutes: parsed.daily_minutes || dailyMinutes,
      source_document_id: documentId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  if (!plan) return { error: "Could not create plan." };

  await ctx.supabase.from("learning_items").insert(
    parsed.days.map((d, index) => ({
      user_id: ctx.user!.id,
      plan_id: plan.id,
      title: d.title,
      description: d.description || "",
      day_number: d.day_number || index + 1,
      estimated_minutes: d.estimated_minutes || dailyMinutes,
      sort_order: index,
    })),
  );
  await refreshPlanProgress(plan.id, ctx.user.id);

  revalidatePath("/learning");
  revalidatePath(`/learning/${plan.id}`);
  return {
    success: `Imported ${parsed.days.length} days into study plan.`,
    planId: plan.id,
  };
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
    description: String(formData.get("description") || ""),
    day_number: Number(formData.get("day_number") || 0) || null,
    estimated_minutes: Number(formData.get("estimated_minutes") || 60),
  });

  if (error) return { error: error.message };
  await refreshPlanProgress(planId, ctx.user.id);
  revalidatePath("/learning");
  revalidatePath(`/learning/${planId}`);
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
  revalidatePath(`/learning/${planId}`);
  revalidatePath("/dashboard");
}
