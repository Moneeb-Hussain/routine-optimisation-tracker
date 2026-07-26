import { AppShell } from "@/components/layout/app-shell";
import { FocusClient } from "@/components/planning/focus-client";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { FocusSession, Task } from "@/lib/types";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function FocusPage() {
  if (!isSupabaseConfigured()) {
    return (
      <AppShell title="Focus" subtitle="Deep work attached to real tasks">
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
      <AppShell title="Focus" subtitle="Deep work attached to real tasks">
        <div className="panel-surface p-6 text-sm">
          <Link href="/login" className="font-semibold text-brand">
            Sign in
          </Link>{" "}
          to start a session.
        </div>
      </AppShell>
    );
  }

  const [tasksRes, activeRes, recentRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .neq("status", "done")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("focus_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "running")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("focus_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(8),
  ]);

  return (
    <AppShell title="Focus" subtitle="Deep work attached to real tasks">
      <FocusClient
        tasks={(tasksRes.data || []) as Task[]}
        active={(activeRes.data as FocusSession | null) || null}
        recent={(recentRes.data || []) as FocusSession[]}
      />
    </AppShell>
  );
}
