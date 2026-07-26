import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { JourneyClient } from "@/components/journey/journey-client";
import {
  buildJourneyStages,
  journeyOverallPercent,
} from "@/lib/domain/journey";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { Badge } from "@/components/ui/badge";

export default async function JourneyPage() {
  if (!isSupabaseConfigured()) {
    return (
      <AppShell title="Journey to USA" subtitle="Profile strength to arrival">
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
      <AppShell title="Journey to USA" subtitle="Profile strength to arrival">
        <p className="text-sm text-muted-foreground">
          <Link href="/login" className="font-semibold text-brand">
            Sign in
          </Link>{" "}
          to see your journey.
        </p>
      </AppShell>
    );
  }

  const [{ data: goals }, { data: profile }] = await Promise.all([
    supabase
      .from("goals")
      .select("title, progress_percent, status")
      .eq("user_id", user.id),
    supabase
      .from("profiles")
      .select("target_intake")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const stages = buildJourneyStages(goals || []);
  const overall = journeyOverallPercent(stages);

  return (
    <AppShell title="Journey to USA" subtitle="Nine stages from profile to arrival">
      <JourneyClient
        stages={stages}
        overall={overall}
        intake={profile?.target_intake || "2027"}
      />
    </AppShell>
  );
}
