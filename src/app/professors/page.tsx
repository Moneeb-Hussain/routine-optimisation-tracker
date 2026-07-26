import { AppShell } from "@/components/layout/app-shell";
import {
  ProfessorsClient,
  type ProfessorRow,
  type UniversityOption,
} from "@/components/admissions/professors-client";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { FitCategory } from "@/lib/domain/fit-score";

export default async function ProfessorsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <AppShell title="Professor CRM" subtitle="Fit, pipeline, and follow-ups">
        <div className="panel-surface p-6">
          <Badge tone="watch">Setup required</Badge>
        </div>
      </AppShell>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <AppShell title="Professor CRM" subtitle="Fit, pipeline, and follow-ups">
        <div className="panel-surface p-6 text-sm">
          <Link href="/login" className="font-semibold text-brand">
            Sign in
          </Link>
        </div>
      </AppShell>
    );
  }

  const [professorsRes, universitiesRes] = await Promise.all([
    supabase
      .from("professors")
      .select(
        "id, full_name, lab_name, outreach_stage, fit_score, fit_category, generic_fit_warning, university_id, universities(name)",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("universities").select("id, name").eq("user_id", user.id).order("name"),
  ]);

  const professors = (professorsRes.data || []).map((row) => ({
    ...row,
    fit_category: (row.fit_category || "insufficient_evidence") as FitCategory,
    universities: Array.isArray(row.universities)
      ? row.universities[0] || null
      : row.universities,
  })) as ProfessorRow[];

  return (
    <AppShell title="Professor CRM" subtitle="Fit scoring, pipeline, and outreach stages">
      {professorsRes.error && (
        <div className="mb-4 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
          {professorsRes.error.message}. If the table is missing, run{" "}
          <code className="font-mono">supabase/migrations/0002_phase2_admissions.sql</code>{" "}
          in the Supabase SQL Editor.
        </div>
      )}
      <ProfessorsClient
        professors={professors}
        universities={(universitiesRes.data || []) as UniversityOption[]}
      />
    </AppShell>
  );
}
