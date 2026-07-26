import { AppShell } from "@/components/layout/app-shell";
import { TasksClient } from "@/components/planning/tasks-client";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { Task } from "@/lib/types";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function TasksPage() {
  if (!isSupabaseConfigured()) {
    return (
      <AppShell title="Tasks" subtitle="Track must-dos and admissions work">
        <div className="panel-surface p-6">
          <Badge tone="watch">Setup required</Badge>
          <p className="mt-3 text-sm text-muted-foreground">
            Connect Supabase to create real tasks.
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
      <AppShell title="Tasks" subtitle="Track must-dos and admissions work">
        <div className="panel-surface p-6 text-sm">
          <Link href="/login" className="font-semibold text-brand">
            Sign in
          </Link>{" "}
          to manage tasks.
        </div>
      </AppShell>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .maybeSingle();

  const timezone = profile?.timezone || "Asia/Karachi";
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <AppShell title="Tasks" subtitle="Track must-dos and admissions work">
      <TasksClient tasks={(data || []) as Task[]} defaultDate={today} />
    </AppShell>
  );
}
