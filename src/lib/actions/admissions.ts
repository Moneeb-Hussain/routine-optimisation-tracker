"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { calculateFitScore, type FitCategory } from "@/lib/domain/fit-score";
import { detectGenericFit } from "@/lib/domain/generic-fit";
import { OUTREACH_STAGES } from "@/lib/domain/outreach-stages";

// Fix: Zod enum needs a mutable tuple
const outreachStageSchema = z.enum(
  OUTREACH_STAGES as unknown as [string, ...string[]],
);

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

const universitySchema = z.object({
  name: z.string().min(1),
  state_or_province: z.string().optional(),
  country: z.string().default("United States"),
  institution_type: z.enum(["public", "private", "other"]).default("public"),
  department: z.string().optional(),
  program: z.string().optional(),
  program_url: z.string().optional(),
  application_url: z.string().optional(),
  deadline: z.string().optional().nullable(),
  funding_notes: z.string().optional(),
  notes: z.string().optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).default("medium"),
  application_status: z
    .enum([
      "researching",
      "shortlisted",
      "preparing",
      "submitted",
      "interview",
      "accepted",
      "rejected",
      "withdrawn",
    ])
    .default("researching"),
});

const professorSchema = z.object({
  full_name: z.string().min(1),
  university_id: z.string().uuid().optional().nullable(),
  academic_rank: z.string().optional(),
  department: z.string().optional(),
  email: z.string().optional(),
  faculty_profile_url: z.string().optional(),
  lab_name: z.string().optional(),
  lab_url: z.string().optional(),
  google_scholar_url: z.string().optional(),
  research_interests: z.string().optional(),
  current_projects: z.string().optional(),
  relevant_papers: z.string().optional(),
  recruitment_status: z
    .enum(["unknown", "open", "maybe", "not_recruiting", "closed"])
    .default("unknown"),
  funding_evidence: z.string().optional(),
  personal_notes: z.string().optional(),
  contact_priority: z.enum(["critical", "high", "medium", "low"]).default("medium"),
  outreach_stage: outreachStageSchema.default("Discovered"),
});

export async function createUniversityAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error || "Unauthorized" };

  const parsed = universitySchema.safeParse({
    name: formData.get("name"),
    state_or_province: formData.get("state_or_province") || "",
    country: formData.get("country") || "United States",
    institution_type: formData.get("institution_type") || "public",
    department: formData.get("department") || "",
    program: formData.get("program") || "",
    program_url: formData.get("program_url") || "",
    application_url: formData.get("application_url") || "",
    deadline: formData.get("deadline") || null,
    funding_notes: formData.get("funding_notes") || "",
    notes: formData.get("notes") || "",
    priority: formData.get("priority") || "medium",
    application_status: formData.get("application_status") || "researching",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid university." };
  }

  const { error } = await ctx.supabase.from("universities").insert({
    user_id: ctx.user.id,
    ...parsed.data,
  });

  if (error) return { error: error.message };
  revalidatePath("/universities");
  revalidatePath("/professors");
  return { success: "University saved." };
}

export async function createProfessorAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error || "Unauthorized" };

  const interestsRaw = String(formData.get("research_interests") || "");
  const parsed = professorSchema.safeParse({
    full_name: formData.get("full_name"),
    university_id: formData.get("university_id") || null,
    academic_rank: formData.get("academic_rank") || "",
    department: formData.get("department") || "",
    email: formData.get("email") || "",
    faculty_profile_url: formData.get("faculty_profile_url") || "",
    lab_name: formData.get("lab_name") || "",
    lab_url: formData.get("lab_url") || "",
    google_scholar_url: formData.get("google_scholar_url") || "",
    research_interests: interestsRaw,
    current_projects: formData.get("current_projects") || "",
    relevant_papers: formData.get("relevant_papers") || "",
    recruitment_status: formData.get("recruitment_status") || "unknown",
    funding_evidence: formData.get("funding_evidence") || "",
    personal_notes: formData.get("personal_notes") || "",
    contact_priority: formData.get("contact_priority") || "medium",
    outreach_stage: formData.get("outreach_stage") || "Discovered",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid professor." };
  }

  const { research_interests, ...rest } = parsed.data;
  const { error } = await ctx.supabase.from("professors").insert({
    user_id: ctx.user.id,
    ...rest,
    research_interests: research_interests
      ? research_interests
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
  });

  if (error) return { error: error.message };
  revalidatePath("/professors");
  revalidatePath("/dashboard");
  return { success: "Professor added." };
}

export async function updateProfessorStageAction(professorId: string, stage: string) {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return;

  if (!OUTREACH_STAGES.includes(stage as (typeof OUTREACH_STAGES)[number])) return;

  await ctx.supabase
    .from("professors")
    .update({ outreach_stage: stage })
    .eq("id", professorId)
    .eq("user_id", ctx.user.id);

  revalidatePath("/professors");
  revalidatePath(`/professors/${professorId}`);
  revalidatePath("/dashboard");
}

export async function analyzeProfessorFitAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error || "Unauthorized" };

  const professorId = String(formData.get("professor_id") || "");
  if (!professorId) return { error: "Professor is required." };

  const components = {
    researchFit: Number(formData.get("research_fit") || 0),
    fundingActivity: Number(formData.get("funding_activity") || 0),
    competitiveness: Number(formData.get("competitiveness") || 0),
    responseProbability: Number(formData.get("response_probability") || 0),
    evidenceQuality: Number(formData.get("evidence_quality") || 0),
  };

  const fit = calculateFitScore(components);
  const generic = detectGenericFit({
    connectionParagraph: String(formData.get("connection_paragraph") || ""),
    mentionedPaperOrProject: formData.get("mentioned_paper_or_project") === "on",
    examinedRecentWork: formData.get("examined_recent_work") === "on",
    applicantEvidenceRelated: formData.get("applicant_evidence_related") === "on",
    couldCopyToManyProfessors: formData.get("could_copy_to_many") === "on",
    usesOnlyBroadKeywords: formData.get("uses_only_broad_keywords") === "on",
    containsEmptyPraise: formData.get("contains_empty_praise") === "on",
    proposesUnsupportedExtension: formData.get("proposes_unsupported_extension") === "on",
    informationOutdatedOrUnverified: formData.get("information_outdated") === "on",
  });

  const recommendedAction = generic.isGeneric
    ? "Research further or skip — connection still looks generic."
    : fit.category === "weak" || fit.category === "insufficient_evidence"
      ? "Gather verified sources before drafting an email."
      : "Draft a professor-specific email for human review.";

  const { error: analysisError } = await ctx.supabase.from("professor_fit_analyses").insert({
    user_id: ctx.user.id,
    professor_id: professorId,
    research_fit: fit.components.researchFit,
    funding_activity: fit.components.fundingActivity,
    competitiveness: fit.components.competitiveness,
    response_probability: fit.components.responseProbability,
    evidence_quality: fit.components.evidenceQuality,
    total_score: fit.total,
    fit_category: fit.category,
    generic_flags: generic.flags,
    missing_information: generic.missingInformation,
    summary: `${fit.disclaimer} Score ${fit.total}/100 (${fit.category}).`,
    recommended_action: recommendedAction,
    sources: String(formData.get("sources") || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((url) => ({ url, verified_on: new Date().toISOString().slice(0, 10) })),
    input_snapshot: {
      connection_paragraph: String(formData.get("connection_paragraph") || ""),
      components,
      generic,
    },
  });

  if (analysisError) return { error: analysisError.message };

  const nextStage =
    generic.isGeneric
      ? "Research Needed"
      : fit.category === "strong" || fit.category === "exceptional"
        ? "Strong Fit"
        : fit.category === "weak"
          ? "Weak Fit"
          : "Fit Assessed";

  const { error: updateError } = await ctx.supabase
    .from("professors")
    .update({
      fit_score: fit.total,
      fit_category: fit.category as FitCategory,
      generic_fit_warning: generic.isGeneric,
      recommended_email_angle: String(formData.get("connection_paragraph") || "").slice(0, 500),
      risks: generic.flags.map((f) => f.message).join(" · "),
      last_verified_at: new Date().toISOString().slice(0, 10),
      outreach_stage: nextStage,
    })
    .eq("id", professorId)
    .eq("user_id", ctx.user.id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/professors");
  revalidatePath(`/professors/${professorId}`);
  revalidatePath("/dashboard");
  return {
    success: `Fit assessed: ${fit.total}/100 (${fit.category}). ${fit.disclaimer}`,
  };
}

export async function createEmailTemplateAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error || "Unauthorized" };

  const name = String(formData.get("name") || "").trim();
  const body = String(formData.get("body_plain") || "").trim();
  const subjects = String(formData.get("subject_options") || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const isPrimary = formData.get("is_primary") === "on";

  if (!name || !body) return { error: "Name and body are required." };

  if (isPrimary) {
    await ctx.supabase
      .from("email_templates")
      .update({ is_primary: false })
      .eq("user_id", ctx.user.id);
  }

  const { error } = await ctx.supabase.from("email_templates").insert({
    user_id: ctx.user.id,
    name,
    body_plain: body,
    subject_options: subjects.length
      ? subjects
      : [
          "Prospective Graduate Student | Mechatronics & Intelligent Systems | IELTS 7.0 | Harvard CS50x Winner",
        ],
    is_primary: isPrimary,
  });

  if (error) return { error: error.message };
  revalidatePath("/email-studio");
  return { success: "Template saved." };
}

export async function createEmailDraftAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error || "Unauthorized" };

  const professorId = String(formData.get("professor_id") || "");
  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body_plain") || "").trim();
  const templateId = String(formData.get("template_id") || "") || null;

  if (!professorId || !subject || !body) {
    return { error: "Professor, subject, and body are required." };
  }

  const { error } = await ctx.supabase.from("email_drafts").insert({
    user_id: ctx.user.id,
    professor_id: professorId,
    template_id: templateId,
    subject,
    body_plain: body,
    status: "draft",
  });

  if (error) return { error: error.message };

  await ctx.supabase
    .from("professors")
    .update({ outreach_stage: "Draft Created" })
    .eq("id", professorId)
    .eq("user_id", ctx.user.id);

  revalidatePath("/email-studio");
  revalidatePath("/professors");
  revalidatePath("/dashboard");
  return { success: "Draft created. Human review required before sending." };
}

export async function updateEmailDraftStatusAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error || "Unauthorized" };

  const draftId = String(formData.get("draft_id") || "");
  const status = String(formData.get("status") || "");
  const followUpDays = Number(formData.get("follow_up_days") || 10);

  if (!draftId || !["approved", "sent", "ready_for_review", "archived"].includes(status)) {
    return { error: "Invalid draft update." };
  }

  const updates: Record<string, unknown> = { status };
  if (status === "approved") updates.approved_at = new Date().toISOString();
  if (status === "sent") {
    updates.sent_at = new Date().toISOString();
    const due = new Date();
    due.setDate(due.getDate() + (Number.isFinite(followUpDays) ? followUpDays : 10));
    updates.follow_up_due_on = due.toISOString().slice(0, 10);
  }

  const { data: draft, error } = await ctx.supabase
    .from("email_drafts")
    .update(updates)
    .eq("id", draftId)
    .eq("user_id", ctx.user.id)
    .select("professor_id, follow_up_due_on")
    .single();

  if (error) return { error: error.message };

  if (status === "sent" && draft) {
    await ctx.supabase
      .from("professors")
      .update({ outreach_stage: "Sent" })
      .eq("id", draft.professor_id)
      .eq("user_id", ctx.user.id);

    const { data: outreach } = await ctx.supabase
      .from("outreach_records")
      .insert({
        user_id: ctx.user.id,
        professor_id: draft.professor_id,
        stage: "Sent",
        sent_at: new Date().toISOString(),
        follow_up_due_on: draft.follow_up_due_on,
      })
      .select("id")
      .single();

    if (draft.follow_up_due_on) {
      await ctx.supabase.from("outreach_followups").insert({
        user_id: ctx.user.id,
        professor_id: draft.professor_id,
        outreach_record_id: outreach?.id ?? null,
        due_on: draft.follow_up_due_on,
        status: "pending",
        notes: "Auto-created when email marked sent (manual send outside the app).",
      });

      await ctx.supabase
        .from("professors")
        .update({ outreach_stage: "Follow-up Due" })
        .eq("id", draft.professor_id)
        .eq("user_id", ctx.user.id);
    }
  }

  if (status === "approved" && draft) {
    await ctx.supabase
      .from("professors")
      .update({ outreach_stage: "Ready to Send" })
      .eq("id", draft.professor_id)
      .eq("user_id", ctx.user.id);
  }

  revalidatePath("/email-studio");
  revalidatePath("/professors");
  revalidatePath("/dashboard");
  return {
    success:
      status === "sent"
        ? "Marked as sent. Follow-up scheduled. (App does not auto-email professors.)"
        : `Draft marked ${status}.`,
  };
}

export async function completeFollowUpAction(followUpId: string) {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return;

  await ctx.supabase
    .from("outreach_followups")
    .update({ status: "done", completed_at: new Date().toISOString() })
    .eq("id", followUpId)
    .eq("user_id", ctx.user.id);

  revalidatePath("/professors");
  revalidatePath("/dashboard");
  revalidatePath("/email-studio");
}
