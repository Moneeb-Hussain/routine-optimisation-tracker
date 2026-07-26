import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { InterviewPrepClient } from "@/components/prep/interview-prep-client";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { Badge } from "@/components/ui/badge";

export default async function InterviewPrepPage() {
  if (!isSupabaseConfigured()) {
    return (
      <AppShell title="Interview Prep" subtitle="Tracks, drills, and question bank">
        <div className="panel-surface p-6">
          <Badge tone="watch">Setup required</Badge>
          <p className="mt-3 text-sm text-muted-foreground">
            Configure Supabase and run migration 0004.
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
      <AppShell title="Interview Prep" subtitle="Tracks, drills, and question bank">
        <div className="panel-surface p-6">
          <p className="text-sm text-muted-foreground">
            Sign in to start prep.{" "}
            <Link href="/login" className="font-semibold text-brand">
              Login
            </Link>
          </p>
        </div>
      </AppShell>
    );
  }

  const [tracks, items, questions, cvDocuments] = await Promise.all([
    supabase
      .from("preparation_tracks")
      .select("id, title, track_type, description, status, completion_percent")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("preparation_items")
      .select("id, track_id, title, status, estimated_minutes, day_number")
      .eq("user_id", user.id)
      .order("sort_order"),
    supabase
      .from("question_bank")
      .select("id, question, category, difficulty, expected_answer")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("documents")
      .select("id, title")
      .eq("user_id", user.id)
      .eq("document_type", "cv")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <AppShell
      title="Interview Prep"
      subtitle="Tracks, CV-generated questions, and practice attempts"
    >
      <InterviewPrepClient
        tracks={tracks.data || []}
        items={items.data || []}
        questions={questions.data || []}
        cvDocuments={cvDocuments.data || []}
      />
    </AppShell>
  );
}
