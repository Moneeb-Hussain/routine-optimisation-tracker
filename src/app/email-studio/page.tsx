import { AppShell } from "@/components/layout/app-shell";
import { EmailStudioClient } from "@/components/admissions/email-studio-client";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function EmailStudioPage({
  searchParams,
}: {
  searchParams: Promise<{ professor?: string }>;
}) {
  const params = await searchParams;

  if (!isSupabaseConfigured()) {
    return (
      <AppShell title="Email Studio" subtitle="Templates, drafts, human approval">
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
      <AppShell title="Email Studio" subtitle="Templates, drafts, human approval">
        <div className="panel-surface p-6 text-sm">
          <Link href="/login" className="font-semibold text-brand">
            Sign in
          </Link>
        </div>
      </AppShell>
    );
  }

  const [templatesRes, draftsRes, professorsRes, followUpsRes] = await Promise.all([
    supabase
      .from("email_templates")
      .select("id, name, subject_options, body_plain, is_primary")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("email_drafts")
      .select(
        "id, subject, body_plain, status, sent_at, follow_up_due_on, professor_id, professors(full_name)",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("professors")
      .select("id, full_name")
      .eq("user_id", user.id)
      .order("full_name"),
    supabase
      .from("outreach_followups")
      .select("id, due_on, status, notes, professors(full_name)")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("due_on")
      .limit(20),
  ]);

  const normalizeJoin = <T,>(value: T | T[] | null | undefined) =>
    Array.isArray(value) ? value[0] || null : value || null;

  return (
    <AppShell title="Email Studio" subtitle="Templates, drafts, approval, follow-ups">
      {(templatesRes.error || draftsRes.error) && (
        <div className="mb-4 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
          {(templatesRes.error || draftsRes.error)?.message}. Run{" "}
          <code className="font-mono">0002_phase2_admissions.sql</code> if needed.
        </div>
      )}
      <EmailStudioClient
        templates={templatesRes.data || []}
        drafts={(draftsRes.data || []).map((d) => ({
          ...d,
          professors: normalizeJoin(d.professors),
        }))}
        professors={professorsRes.data || []}
        followUps={(followUpsRes.data || []).map((f) => ({
          ...f,
          professors: normalizeJoin(f.professors),
        }))}
        selectedProfessorId={params.professor}
      />
    </AppShell>
  );
}
