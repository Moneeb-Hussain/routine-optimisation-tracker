"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import {
  getOpenAIModel,
  isOpenAIConfigured,
  isSupabaseConfigured,
} from "@/lib/env";
import { getCoachContext, getOrBuildMorningBrief } from "@/lib/data/coach-context";

export type ActionState = { error?: string; success?: string; reply?: string };

const coachResponseSchema = z.object({
  summary: z.string(),
  current_state: z.string(),
  priority_action: z.object({
    title: z.string(),
    reason: z.string(),
    estimated_minutes: z.number(),
  }),
  recommended_actions: z.array(
    z.object({
      title: z.string(),
      reason: z.string(),
      priority: z.enum(["critical", "high", "medium", "low"]),
      estimated_minutes: z.number(),
    }),
  ),
  postpone_or_remove: z.array(
    z.object({
      title: z.string(),
      reason: z.string(),
    }),
  ),
  risks: z.array(
    z.object({
      risk: z.string(),
      severity: z.enum(["high", "medium", "low"]),
      mitigation: z.string(),
    }),
  ),
  motivation: z.string(),
  confidence: z.number(),
  data_used: z.array(z.string()),
  missing_information: z.array(z.string()),
});

export async function refreshMorningBriefAction(): Promise<ActionState> {
  if (!isSupabaseConfigured()) return { error: "Supabase is not configured." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in required." };

  const ctx = await getCoachContext();
  if (!ctx) return { error: "Could not load context." };

  // Force regenerate by deleting today's brief then rebuilding
  await supabase
    .from("morning_briefs")
    .delete()
    .eq("user_id", user.id)
    .eq("brief_date", ctx.today);

  const built = await getOrBuildMorningBrief();
  if (!built) return { error: "Could not build morning brief." };

  // Optional AI polish
  if (isOpenAIConfigured()) {
    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const model = getOpenAIModel();
      const response = await client.responses.create({
        model,
        input: [
          {
            role: "system",
            content:
              "You polish a morning brief for graduate-admissions execution. Keep sleep-aware advice. Never shame. Never invent deadlines or professors. Return JSON with keys: motivation, sleep_aware_workload, avoid_today, deep_work_block.",
          },
          {
            role: "user",
            content: JSON.stringify({ context: ctx, brief: built.brief }),
          },
        ],
        text: { format: { type: "json_object" } },
      });
      const polished = JSON.parse(response.output_text || "{}") as Record<string, string>;
      const next = {
        ...built.brief,
        motivation: polished.motivation || built.brief.motivation,
        sleepAwareWorkload:
          polished.sleep_aware_workload || built.brief.sleepAwareWorkload,
        avoidToday: polished.avoid_today || built.brief.avoidToday,
        deepWorkBlock: polished.deep_work_block || built.brief.deepWorkBlock,
        source: "hybrid" as const,
      };
      await supabase
        .from("morning_briefs")
        .update({
          motivation: next.motivation,
          sleep_aware_workload: next.sleepAwareWorkload,
          avoid_today: next.avoidToday,
          deep_work_block: next.deepWorkBlock,
          source: "hybrid",
          raw_ai: polished,
        })
        .eq("user_id", user.id)
        .eq("brief_date", ctx.today);
    } catch {
      // Keep rule brief if AI polish fails
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/today");
  return { success: "Morning brief refreshed." };
}

export async function askCoachAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured()) return { error: "Supabase is not configured." };
  const question = String(formData.get("question") || "").trim();
  if (!question) return { error: "Ask a specific question." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in required." };

  const ctx = await getCoachContext(question);
  if (!ctx) return { error: "Could not load your data." };

  await supabase.from("coach_messages").insert({
    user_id: user.id,
    role: "user",
    content: question,
    data_used: ["coach_context"],
  });

  // Rule-based fallback reply (always works)
  const incompleteMust = ctx.mustDos.filter((t) => t.status !== "done");
  const ruleReply = [
    `Current state: ${ctx.primaryGoal || "No primary goal set for today."}`,
    incompleteMust[0]
      ? `Priority action (${incompleteMust[0].minutes || 25}m): ${incompleteMust[0].title}`
      : "Priority action: Set a primary goal and one must-do on Today.",
    ctx.followUps[0]
      ? `Follow-up due: ${ctx.followUps[0].professor} (${ctx.followUps[0].due_on}).`
      : "No professor follow-up is due.",
    ctx.sleep.hours != null && ctx.sleep.hours < ctx.sleep.target - 1
      ? `Sleep was ${ctx.sleep.hours}h — keep the plan lean.`
      : "Sleep readiness looks okay for a focused block.",
    ctx.blocker ? `Blocker logged: ${ctx.blocker}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  let finalReply = ruleReply;
  let dataUsed = ["goals", "tasks", "sleep", "followups", "interview", "documents"];

  if (isOpenAIConfigured()) {
    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const model = getOpenAIModel();
      const response = await client.responses.create({
        model,
        input: [
          {
            role: "system",
            content: `You are Mission USA AI Coach for Moneeb's graduate-admissions OS.
Answer with actionable, specific advice. Firm and motivating, never insulting.
When sleep is poor, reduce workload. Never invent professors, papers, or deadlines.
Use only the provided context JSON.
Return JSON matching the coach schema.`,
          },
          {
            role: "user",
            content: JSON.stringify({ question, context: ctx }),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "coach_response",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                summary: { type: "string" },
                current_state: { type: "string" },
                priority_action: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    title: { type: "string" },
                    reason: { type: "string" },
                    estimated_minutes: { type: "number" },
                  },
                  required: ["title", "reason", "estimated_minutes"],
                },
                recommended_actions: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      title: { type: "string" },
                      reason: { type: "string" },
                      priority: {
                        type: "string",
                        enum: ["critical", "high", "medium", "low"],
                      },
                      estimated_minutes: { type: "number" },
                    },
                    required: ["title", "reason", "priority", "estimated_minutes"],
                  },
                },
                postpone_or_remove: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      title: { type: "string" },
                      reason: { type: "string" },
                    },
                    required: ["title", "reason"],
                  },
                },
                risks: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      risk: { type: "string" },
                      severity: { type: "string", enum: ["high", "medium", "low"] },
                      mitigation: { type: "string" },
                    },
                    required: ["risk", "severity", "mitigation"],
                  },
                },
                motivation: { type: "string" },
                confidence: { type: "number" },
                data_used: { type: "array", items: { type: "string" } },
                missing_information: { type: "array", items: { type: "string" } },
              },
              required: [
                "summary",
                "current_state",
                "priority_action",
                "recommended_actions",
                "postpone_or_remove",
                "risks",
                "motivation",
                "confidence",
                "data_used",
                "missing_information",
              ],
            },
          },
        },
      });

      const parsed = coachResponseSchema.safeParse(
        JSON.parse(response.output_text || "{}"),
      );
      if (parsed.success) {
        const r = parsed.data;
        finalReply = [
          r.summary,
          `Current state: ${r.current_state}`,
          `Priority (${r.priority_action.estimated_minutes}m): ${r.priority_action.title} — ${r.priority_action.reason}`,
          ...r.recommended_actions
            .slice(0, 3)
            .map(
              (a) =>
                `• [${a.priority}] ${a.title} (${a.estimated_minutes}m) — ${a.reason}`,
            ),
          ...r.postpone_or_remove.map((p) => `Postpone/remove: ${p.title} — ${p.reason}`),
          r.motivation,
        ].join("\n");
        dataUsed = r.data_used.length ? r.data_used : dataUsed;

        await supabase.from("ai_runs").insert({
          user_id: user.id,
          feature: "coach",
          request_type: "ask",
          model,
          prompt_version: "coach_v1",
          output: parsed.data,
          referenced_entities: [{ type: "question", id: question.slice(0, 80) }],
        });
      }
    } catch {
      // keep rule reply
    }
  }

  await supabase.from("coach_messages").insert({
    user_id: user.id,
    role: "assistant",
    content: finalReply,
    data_used: dataUsed,
  });

  revalidatePath("/coach");
  return { success: "Coach replied.", reply: finalReply };
}

export async function saveEveningReviewAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured()) return { error: "Supabase is not configured." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in required." };

  const ctx = await getCoachContext();
  if (!ctx) return { error: "Could not load context." };

  const payload = {
    user_id: user.id,
    review_date: ctx.today,
    completed_summary: String(formData.get("completed_summary") || ""),
    incomplete_summary: String(formData.get("incomplete_summary") || ""),
    delay_cause: String(formData.get("delay_cause") || ""),
    focus_rating: Number(formData.get("focus_rating") || 3),
    learned: String(formData.get("learned") || ""),
    biggest_win: String(formData.get("biggest_win") || ""),
    notes: String(formData.get("notes") || ""),
  };

  const { error } = await supabase
    .from("daily_reviews")
    .upsert(payload, { onConflict: "user_id,review_date" });

  if (error) return { error: error.message };
  revalidatePath("/today");
  revalidatePath("/dashboard");
  return { success: "Evening review saved." };
}
