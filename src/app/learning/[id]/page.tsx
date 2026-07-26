import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { StudyPlanDetailClient } from "@/components/prep/learning-client";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export default async function StudyPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isSupabaseConfigured()) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return (
      <AppShell title="Study Plan" subtitle="">
        <Link href="/login" className="font-semibold text-brand">
          Sign in
        </Link>
      </AppShell>
    );
  }

  const { data: plan } = await supabase
    .from("learning_plans")
    .select(
      "id, title, area, goal, status, daily_minutes, completion_percent, source_document_id",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!plan) notFound();

  const { data: items } = await supabase
    .from("learning_items")
    .select("id, plan_id, title, description, status, estimated_minutes, day_number")
    .eq("plan_id", id)
    .eq("user_id", user.id)
    .order("sort_order");

  return (
    <AppShell title={plan.title} subtitle={`${plan.area} · track done vs left`}>
      <StudyPlanDetailClient plan={plan} items={items || []} />
    </AppShell>
  );
}
