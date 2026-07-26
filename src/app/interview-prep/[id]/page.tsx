import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { InterviewPrepClient } from "@/components/prep/interview-prep-client";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export default async function InterviewPrepTrackPage({
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
      <AppShell title="Interview Prep" subtitle="Track detail">
        <p className="text-sm text-muted-foreground">
          <Link href="/login" className="font-semibold text-brand">
            Sign in
          </Link>
        </p>
      </AppShell>
    );
  }

  const { data: track } = await supabase
    .from("preparation_tracks")
    .select("id, title, track_type, description, status, completion_percent")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!track) notFound();

  const [items, questions] = await Promise.all([
    supabase
      .from("preparation_items")
      .select("id, track_id, title, status, estimated_minutes, day_number")
      .eq("track_id", id)
      .eq("user_id", user.id)
      .order("sort_order"),
    supabase
      .from("question_bank")
      .select("id, question, category, difficulty, expected_answer")
      .eq("user_id", user.id)
      .or(`track_id.eq.${id},track_id.is.null`)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <AppShell title={track.title} subtitle="Prep track">
      <InterviewPrepClient
        tracks={[track]}
        items={items.data || []}
        questions={questions.data || []}
      />
    </AppShell>
  );
}
