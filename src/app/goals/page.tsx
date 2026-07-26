import { AppShell } from "@/components/layout/app-shell";
import { GoalsClient } from "@/components/planning/goals-client";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { Goal } from "@/lib/types";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function GoalsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <AppShell title="Goals" subtitle="From US arrival down to this week">
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
      <AppShell title="Goals" subtitle="From US arrival down to this week">
        <div className="panel-surface p-6 text-sm">
          <Link href="/login" className="font-semibold text-brand">
            Sign in
          </Link>{" "}
          to view goals.
        </div>
      </AppShell>
    );
  }

  const { data } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .order("sort_order");

  return (
    <AppShell title="Goals" subtitle="From US arrival down to this week">
      <GoalsClient goals={(data || []) as Goal[]} />
    </AppShell>
  );
}
