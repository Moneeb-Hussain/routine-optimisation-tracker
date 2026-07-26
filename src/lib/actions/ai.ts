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

export type ActionState = { error?: string; success?: string };

const briefSchema = z.object({
  professor_summary: z.string(),
  current_research_themes: z.array(z.string()),
  most_relevant_verified_work: z.array(z.string()),
  connection_to_applicant: z.string(),
  strongest_connecting_evidence: z.string(),
  connection_credibility: z.enum(["high", "medium", "low", "unknown"]),
  potential_research_direction: z.string(),
  possible_email_angle: z.string(),
  questions_requiring_verification: z.array(z.string()),
  risks_of_contacting: z.array(z.string()),
  recommended_action: z.string(),
  facts: z.array(z.string()),
  interpretations: z.array(z.string()),
  sources_used: z.array(z.string()),
});

export async function generateProfessorBriefAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured." };
  }
  if (!isOpenAIConfigured()) {
    return {
      error:
        "OPENAI_API_KEY is missing in .env.local. Add it to generate AI briefs.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const professorId = String(formData.get("professor_id") || "");
  if (!professorId) return { error: "Professor is required." };

  const [{ data: professor }, { data: profile }, { data: analyses }] =
    await Promise.all([
      supabase
        .from("professors")
        .select("*, universities(name, country, program)")
        .eq("id", professorId)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("professor_fit_analyses")
        .select("total_score, fit_category, summary, generic_flags, missing_information, sources")
        .eq("professor_id", professorId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (!professor || !profile) return { error: "Professor or profile not found." };

  const model = getOpenAIModel();
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const system = `You write graduate-admissions research briefs for Mission USA AI.
Rules:
- Never invent papers, openings, grants, funding, or recruitment status.
- Separate facts from interpretation.
- If evidence is weak, say so and recommend research/skip.
- Fit scores are organizational estimates, not admission probabilities.
- Be concise, modest, and evidence-based.
Return ONLY valid JSON matching the schema fields requested.`;

  const userPrompt = {
    applicant: {
      name: profile.full_name,
      degree: profile.degree,
      university: profile.university,
      cgpa: profile.cgpa,
      ielts: profile.ielts_academic,
      research_interests: profile.research_interests,
      strongest_project: profile.strongest_project,
      achievements: profile.achievements,
    },
    professor: {
      full_name: professor.full_name,
      university: professor.universities,
      lab_name: professor.lab_name,
      research_interests: professor.research_interests,
      relevant_papers: professor.relevant_papers,
      current_projects: professor.current_projects,
      recruitment_status: professor.recruitment_status,
      funding_evidence: professor.funding_evidence,
      personal_notes: professor.personal_notes,
      fit_score: professor.fit_score,
      fit_category: professor.fit_category,
      generic_fit_warning: professor.generic_fit_warning,
      faculty_profile_url: professor.faculty_profile_url,
      source_urls: professor.source_urls,
    },
    latest_fit_analysis: analyses,
    required_json_keys: [
      "professor_summary",
      "current_research_themes",
      "most_relevant_verified_work",
      "connection_to_applicant",
      "strongest_connecting_evidence",
      "connection_credibility",
      "potential_research_direction",
      "possible_email_angle",
      "questions_requiring_verification",
      "risks_of_contacting",
      "recommended_action",
      "facts",
      "interpretations",
      "sources_used",
    ],
  };

  let raw = "";
  try {
    const response = await client.responses.create({
      model,
      input: [
        { role: "system", content: system },
        {
          role: "user",
          content: `Create a professor research brief from this JSON context. Do not invent facts.\n${JSON.stringify(userPrompt)}`,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "professor_research_brief",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              professor_summary: { type: "string" },
              current_research_themes: {
                type: "array",
                items: { type: "string" },
              },
              most_relevant_verified_work: {
                type: "array",
                items: { type: "string" },
              },
              connection_to_applicant: { type: "string" },
              strongest_connecting_evidence: { type: "string" },
              connection_credibility: {
                type: "string",
                enum: ["high", "medium", "low", "unknown"],
              },
              potential_research_direction: { type: "string" },
              possible_email_angle: { type: "string" },
              questions_requiring_verification: {
                type: "array",
                items: { type: "string" },
              },
              risks_of_contacting: {
                type: "array",
                items: { type: "string" },
              },
              recommended_action: { type: "string" },
              facts: { type: "array", items: { type: "string" } },
              interpretations: { type: "array", items: { type: "string" } },
              sources_used: { type: "array", items: { type: "string" } },
            },
            required: [
              "professor_summary",
              "current_research_themes",
              "most_relevant_verified_work",
              "connection_to_applicant",
              "strongest_connecting_evidence",
              "connection_credibility",
              "potential_research_direction",
              "possible_email_angle",
              "questions_requiring_verification",
              "risks_of_contacting",
              "recommended_action",
              "facts",
              "interpretations",
              "sources_used",
            ],
          },
        },
      },
    });

    raw = response.output_text || "";
  } catch (error) {
    const message = error instanceof Error ? error.message : "OpenAI request failed.";
    return { error: message };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return { error: "AI returned invalid JSON. Try again." };
  }

  const parsed = briefSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "AI brief failed validation." };
  }

  const { error } = await supabase.from("ai_runs").insert({
    user_id: user.id,
    feature: "professor_brief",
    request_type: "generate",
    model,
    prompt_version: "professor_brief_v1",
    output: parsed.data,
    referenced_entities: [
      { type: "professor", id: professorId },
      { type: "profile", id: user.id },
    ],
  });

  if (error) return { error: error.message };

  await supabase
    .from("professors")
    .update({
      ai_analysis: parsed.data.professor_summary,
      recommended_email_angle: parsed.data.possible_email_angle,
    })
    .eq("id", professorId)
    .eq("user_id", user.id);

  revalidatePath(`/professors/${professorId}`);
  return { success: "Research brief generated and saved." };
}
