import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { DiscoverClient } from "@/components/discover/discover-client";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { Badge } from "@/components/ui/badge";

export default async function DiscoverPage() {
  if (!isSupabaseConfigured()) {
    return (
      <AppShell title="AI Discover" subtitle="Universities & professors via web search">
        <div className="panel-surface p-6">
          <Badge tone="watch">Setup required</Badge>
          <p className="mt-2 text-sm text-muted-foreground">
            Run migration 0007 and set OPENAI_API_KEY.
          </p>
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
      <AppShell title="AI Discover" subtitle="Universities & professors via web search">
        <p className="text-sm text-muted-foreground">
          <Link href="/login" className="font-semibold text-brand">
            Sign in
          </Link>
        </p>
      </AppShell>
    );
  }

  const { data: run } = await supabase
    .from("discovery_runs")
    .select("id, status, query_summary, created_at, error_message")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: recommendations } = run
    ? await supabase
        .from("discovery_recommendations")
        .select(
          "id, kind, country, name, university_name, department_or_lab, why_fit, evidence_urls, confidence, status",
        )
        .eq("user_id", user.id)
        .eq("run_id", run.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <AppShell
      title="AI Discover"
      subtitle="Must-consider universities and professors — verify before outreach"
    >
      <DiscoverClient run={run} recommendations={recommendations || []} />
    </AppShell>
  );
}
