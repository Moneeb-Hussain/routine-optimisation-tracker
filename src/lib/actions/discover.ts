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

export type ActionState = { error?: string; success?: string; runId?: string };

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

const discoverySchema = z.object({
  summary: z.string(),
  universities: z.array(
    z.object({
      name: z.string(),
      country: z.enum(["US", "CA"]),
      department_or_lab: z.string().default(""),
      why_fit: z.string(),
      evidence_urls: z.array(z.string()).default([]),
      confidence: z.enum(["high", "medium", "low"]).default("medium"),
    }),
  ),
  professors: z.array(
    z.object({
      name: z.string(),
      university_name: z.string(),
      country: z.enum(["US", "CA"]),
      department_or_lab: z.string().default(""),
      why_fit: z.string(),
      evidence_urls: z.array(z.string()).default([]),
      confidence: z.enum(["high", "medium", "low"]).default("medium"),
    }),
  ),
});

export async function runDiscoveryAction(): Promise<ActionState> {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error || "Unauthorized" };
  if (!isOpenAIConfigured()) {
    return { error: "OPENAI_API_KEY is required for AI Discover (includes web search)." };
  }

  const { data: profile } = await ctx.supabase
    .from("profiles")
    .select("*")
    .eq("id", ctx.user.id)
    .maybeSingle();
  if (!profile) return { error: "Complete onboarding first." };

  const querySummary = [
    profile.target_primary,
    profile.target_secondary,
    ...(profile.research_interests || []).slice(0, 8),
  ]
    .filter(Boolean)
    .join(" · ");

  const { data: run, error: runError } = await ctx.supabase
    .from("discovery_runs")
    .insert({
      user_id: ctx.user.id,
      status: "pending",
      query_summary: querySummary,
    })
    .select("id")
    .single();

  if (runError || !run) return { error: runError?.message || "Could not start discovery." };

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = getOpenAIModel();

  try {
    const response = await client.responses.create({
      model,
      tools: [{ type: "web_search" }],
      input: [
        {
          role: "system",
          content: `You are Mission USA AI Discover for funded MS/PhD admissions.
Use web search to find real universities and professors in the USA and Canada that fit the applicant.
Rules:
- Prefer labs aligned with computer vision, robotics, mechatronics, applied AI, intelligent systems.
- Only recommend names you can ground with public faculty/lab pages; include evidence_urls.
- Never invent email addresses or claim openings exist.
- Mark confidence honestly (high/medium/low).
- Return 6–10 universities and 8–12 professors across US and Canada.
After searching, respond with ONLY JSON:
{ summary, universities: [{ name, country: "US"|"CA", department_or_lab, why_fit, evidence_urls, confidence }], professors: [{ name, university_name, country, department_or_lab, why_fit, evidence_urls, confidence }] }`,
        },
        {
          role: "user",
          content: JSON.stringify({
            applicant: {
              name: profile.full_name,
              degree: profile.degree,
              university: profile.university,
              cgpa: profile.cgpa,
              ielts: profile.ielts_academic,
              research_interests: profile.research_interests,
              strongest_project: profile.strongest_project,
              achievements: profile.achievements,
              target_primary: profile.target_primary,
              target_secondary: profile.target_secondary,
              target_intake: profile.target_intake,
            },
            task: "Recommend must-consider universities and professors to approach for funded graduate study.",
          }),
        },
      ],
    });

    const text = response.output_text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const raw = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text || "{}");
    const parsed = discoverySchema.safeParse(raw);

    if (!parsed.success) {
      await ctx.supabase
        .from("discovery_runs")
        .update({
          status: "failed",
          error_message: "Could not parse discovery JSON",
          raw_ai: { text },
        })
        .eq("id", run.id);
      return { error: "Discovery returned unusable data. Try again." };
    }

    const uniRows = parsed.data.universities.map((u) => ({
      user_id: ctx.user!.id,
      run_id: run.id,
      kind: "university" as const,
      country: u.country,
      name: u.name,
      university_name: u.name,
      department_or_lab: u.department_or_lab || "",
      why_fit: u.why_fit,
      evidence_urls: u.evidence_urls || [],
      confidence: u.confidence,
      status: "suggested" as const,
    }));

    const profRows = parsed.data.professors.map((p) => ({
      user_id: ctx.user!.id,
      run_id: run.id,
      kind: "professor" as const,
      country: p.country,
      name: p.name,
      university_name: p.university_name,
      department_or_lab: p.department_or_lab || "",
      why_fit: p.why_fit,
      evidence_urls: p.evidence_urls || [],
      confidence: p.confidence,
      status: "suggested" as const,
    }));

    if (uniRows.length) {
      await ctx.supabase.from("discovery_recommendations").insert(uniRows);
    }
    if (profRows.length) {
      await ctx.supabase.from("discovery_recommendations").insert(profRows);
    }

    await ctx.supabase
      .from("discovery_runs")
      .update({
        status: "completed",
        raw_ai: parsed.data,
        query_summary: parsed.data.summary || querySummary,
      })
      .eq("id", run.id);

    await ctx.supabase.from("ai_runs").insert({
      user_id: ctx.user.id,
      feature: "discover",
      request_type: "web_search",
      model,
      prompt_version: "discover_v1",
      output: parsed.data,
      referenced_entities: [{ type: "discovery_run", id: run.id }],
    });

    revalidatePath("/discover");
    return {
      success: `Found ${uniRows.length} universities and ${profRows.length} professors. Verify before outreach.`,
      runId: run.id,
    };
  } catch (err) {
    await ctx.supabase
      .from("discovery_runs")
      .update({
        status: "failed",
        error_message: err instanceof Error ? err.message : "Discovery failed",
      })
      .eq("id", run.id);
    return {
      error: err instanceof Error ? err.message : "Discovery failed.",
    };
  }
}

export async function dismissRecommendationAction(id: string) {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return;
  await ctx.supabase
    .from("discovery_recommendations")
    .update({ status: "dismissed" })
    .eq("id", id)
    .eq("user_id", ctx.user.id);
  revalidatePath("/discover");
}

export async function importRecommendationAction(id: string): Promise<ActionState> {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error || "Unauthorized" };

  const { data: rec } = await ctx.supabase
    .from("discovery_recommendations")
    .select("*")
    .eq("id", id)
    .eq("user_id", ctx.user.id)
    .maybeSingle();

  if (!rec) return { error: "Recommendation not found." };
  if (rec.status === "imported") return { success: "Already imported." };

  const countryLabel = rec.country === "CA" ? "Canada" : "United States";
  const urls = Array.isArray(rec.evidence_urls)
    ? (rec.evidence_urls as string[])
    : [];

  if (rec.kind === "university") {
    const { data: uni, error } = await ctx.supabase
      .from("universities")
      .insert({
        user_id: ctx.user.id,
        name: rec.name,
        country: countryLabel,
        department: rec.department_or_lab || "",
        notes: `${rec.why_fit}\n\nSources:\n${urls.join("\n")}`,
        priority: rec.confidence === "high" ? "high" : "medium",
        application_status: "researching",
      })
      .select("id")
      .single();
    if (error) return { error: error.message };
    await ctx.supabase
      .from("discovery_recommendations")
      .update({ status: "imported", linked_university_id: uni?.id })
      .eq("id", id);
    revalidatePath("/discover");
    revalidatePath("/universities");
    return { success: "University imported to your list." };
  }

  // professor: find or create university by name
  let universityId: string | null = null;
  if (rec.university_name) {
    const { data: existing } = await ctx.supabase
      .from("universities")
      .select("id")
      .eq("user_id", ctx.user.id)
      .ilike("name", rec.university_name)
      .maybeSingle();
    if (existing) {
      universityId = existing.id;
    } else {
      const { data: created } = await ctx.supabase
        .from("universities")
        .insert({
          user_id: ctx.user.id,
          name: rec.university_name,
          country: countryLabel,
          department: rec.department_or_lab || "",
          notes: "Created from AI Discover",
          application_status: "researching",
        })
        .select("id")
        .single();
      universityId = created?.id || null;
    }
  }

  const { data: prof, error } = await ctx.supabase
    .from("professors")
    .insert({
      user_id: ctx.user.id,
      university_id: universityId,
      full_name: rec.name,
      department: rec.department_or_lab || "",
      lab_name: rec.department_or_lab || "",
      faculty_profile_url: urls[0] || "",
      source_urls: urls,
      personal_notes: rec.why_fit,
      contact_priority: rec.confidence === "high" ? "high" : "medium",
      outreach_stage: "Discovered",
      research_interests: [],
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await ctx.supabase
    .from("discovery_recommendations")
    .update({
      status: "imported",
      linked_professor_id: prof?.id,
      linked_university_id: universityId,
    })
    .eq("id", id);

  revalidatePath("/discover");
  revalidatePath("/professors");
  revalidatePath("/universities");
  return { success: "Professor imported to CRM." };
}
