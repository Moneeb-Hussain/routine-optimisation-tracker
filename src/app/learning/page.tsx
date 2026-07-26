import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { LearningClient } from "@/components/prep/learning-client";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { Badge } from "@/components/ui/badge";

export default async function LearningPage() {
  if (!isSupabaseConfigured()) {
    return (
      <AppShell title="Learning Plans" subtitle="Skill sprints for admissions leverage">
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
      <AppShell title="Learning Plans" subtitle="Skill sprints for admissions leverage">
        <p className="text-sm text-muted-foreground">
          <Link href="/login" className="font-semibold text-brand">
            Sign in
          </Link>
        </p>
      </AppShell>
    );
  }

  const [plans, items] = await Promise.all([
    supabase
      .from("learning_plans")
      .select(
        "id, title, area, goal, status, daily_minutes, completion_percent",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("learning_items")
      .select("id, plan_id, title, status, estimated_minutes")
      .eq("user_id", user.id)
      .order("sort_order"),
  ]);

  return (
    <AppShell
      title="Learning Plans"
      subtitle="Small daily skill blocks that compound"
    >
      <LearningClient plans={plans.data || []} items={items.data || []} />
    </AppShell>
  );
}
