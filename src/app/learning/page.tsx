import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { LearningClient } from "@/components/prep/learning-client";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { Badge } from "@/components/ui/badge";

export default async function LearningPage() {
  if (!isSupabaseConfigured()) {
    return (
      <AppShell title="Study Plans" subtitle="Day-wise skill sprints with done/left tracking">
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
      <AppShell title="Study Plans" subtitle="Day-wise skill sprints with done/left tracking">
        <p className="text-sm text-muted-foreground">
          <Link href="/login" className="font-semibold text-brand">
            Sign in
          </Link>
        </p>
      </AppShell>
    );
  }

  const [plans, items, documents] = await Promise.all([
    supabase
      .from("learning_plans")
      .select(
        "id, title, area, goal, status, daily_minutes, completion_percent, source_document_id",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("learning_items")
      .select("id, plan_id, title, description, status, estimated_minutes, day_number")
      .eq("user_id", user.id)
      .order("sort_order"),
    supabase
      .from("documents")
      .select("id, title, document_type")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <AppShell
      title="Study Plans"
      subtitle="Import a day-wise document (e.g. robotics · 1h/day) and track what’s left"
    >
      <LearningClient
        plans={plans.data || []}
        items={items.data || []}
        documents={documents.data || []}
      />
    </AppShell>
  );
}
