import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { CoachClient } from "@/components/coach/coach-client";
import { getCoachContext } from "@/lib/data/coach-context";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { Badge } from "@/components/ui/badge";

export default async function CoachPage() {
  if (!isSupabaseConfigured()) {
    return (
      <AppShell title="AI Coach" subtitle="Context-backed next actions">
        <div className="panel-surface p-6">
          <Badge tone="watch">Setup required</Badge>
          <p className="mt-3 text-sm text-muted-foreground">
            Configure Supabase to use the coach.
          </p>
        </div>
      </AppShell>
    );
  }

  const context = await getCoachContext();
  if (!context) {
    return (
      <AppShell title="AI Coach" subtitle="Context-backed next actions">
        <div className="panel-surface p-6">
          <p className="text-sm text-muted-foreground">
            Sign in to coach against your live plan.{" "}
            <Link href="/login" className="font-semibold text-brand">
              Login
            </Link>
          </p>
        </div>
      </AppShell>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: messages } = await supabase
    .from("coach_messages")
    .select("id, role, content, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: true })
    .limit(40);

  return (
    <AppShell
      title="AI Coach"
      subtitle="Asks your data what to do next — never invents professors or deadlines"
    >
      <CoachClient context={context} messages={messages || []} />
    </AppShell>
  );
}
