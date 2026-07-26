import { AppShell } from "@/components/layout/app-shell";
import {
  UniversitiesClient,
  type UniversityRow,
} from "@/components/admissions/universities-client";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function UniversitiesPage() {
  if (!isSupabaseConfigured()) {
    return (
      <AppShell title="Universities" subtitle="Programs and deadlines">
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
      <AppShell title="Universities" subtitle="Programs and deadlines">
        <div className="panel-surface p-6 text-sm">
          <Link href="/login" className="font-semibold text-brand">
            Sign in
          </Link>
        </div>
      </AppShell>
    );
  }

  const { data } = await supabase
    .from("universities")
    .select(
      "id, name, country, state_or_province, program, priority, application_status, deadline",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <AppShell title="Universities" subtitle="Programs, funding notes, and deadlines">
      <div className="mb-4 rounded-xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
        After creating universities, add professors in{" "}
        <Link href="/professors" className="font-semibold text-brand">
          Professor CRM
        </Link>
        . Run migration{" "}
        <code className="font-mono">0002_phase2_admissions.sql</code> if tables are missing.
      </div>
      <UniversitiesClient universities={(data || []) as UniversityRow[]} />
    </AppShell>
  );
}
