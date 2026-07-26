import { AppShell } from "@/components/layout/app-shell";
import { ProfessorDetailClient } from "@/components/admissions/professor-detail-client";
import { createClient } from "@/lib/supabase/server";
import { isOpenAIConfigured, isSupabaseConfigured } from "@/lib/env";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { FitCategory } from "@/lib/domain/fit-score";

export default async function ProfessorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <AppShell title="Professor" subtitle="Fit analysis">
        <p className="text-sm text-muted-foreground">Configure Supabase first.</p>
      </AppShell>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: professor } = await supabase
    .from("professors")
    .select(
      "id, full_name, lab_name, email, faculty_profile_url, relevant_papers, fit_score, fit_category, generic_fit_warning, outreach_stage, recommended_email_angle, risks, universities(name)",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!professor) notFound();

  const [{ data: analyses }, { data: briefRows }] = await Promise.all([
    supabase
      .from("professor_fit_analyses")
      .select(
        "id, total_score, fit_category, summary, recommended_action, generic_flags, missing_information, created_at",
      )
      .eq("professor_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("ai_runs")
      .select("id, created_at, model, output, referenced_entities")
      .eq("user_id", user.id)
      .eq("feature", "professor_brief")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const briefs = (briefRows || [])
    .filter((row) => {
      const refs = Array.isArray(row.referenced_entities) ? row.referenced_entities : [];
      return refs.some(
        (ref) =>
          ref &&
          typeof ref === "object" &&
          "type" in ref &&
          "id" in ref &&
          ref.type === "professor" &&
          ref.id === id,
      );
    })
    .map((row) => ({
      id: row.id as string,
      created_at: row.created_at as string,
      model: row.model as string,
      output: (row.output && typeof row.output === "object"
        ? row.output
        : {}) as {
        professor_summary?: string;
        possible_email_angle?: string;
        recommended_action?: string;
        connection_credibility?: string;
        facts?: string[];
        interpretations?: string[];
        questions_requiring_verification?: string[];
        risks_of_contacting?: string[];
        sources_used?: string[];
      },
    }));

  const normalized = {
    ...professor,
    fit_category: (professor.fit_category || "insufficient_evidence") as FitCategory,
    universities: Array.isArray(professor.universities)
      ? professor.universities[0] || null
      : professor.universities,
  };

  return (
    <AppShell
      title={professor.full_name}
      subtitle="Fit analyzer · generic-fit checks · AI brief"
    >
      <div className="mb-4 text-sm">
        <Link href="/professors" className="font-semibold text-brand">
          ← Back to CRM
        </Link>
        {" · "}
        <Link
          href={`/email-studio?professor=${professor.id}`}
          className="font-semibold text-brand"
        >
          Draft email
        </Link>
      </div>
      <ProfessorDetailClient
        professor={normalized}
        analyses={(analyses || []).map((a) => ({
          ...a,
          generic_flags: Array.isArray(a.generic_flags) ? a.generic_flags : [],
          missing_information: Array.isArray(a.missing_information)
            ? a.missing_information
            : [],
        }))}
        briefs={briefs}
        openAIConfigured={isOpenAIConfigured()}
      />
    </AppShell>
  );
}
