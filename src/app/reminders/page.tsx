import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { RemindersClient } from "@/components/reminders/reminders-client";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { Badge } from "@/components/ui/badge";

export default async function RemindersPage() {
  if (!isSupabaseConfigured()) {
    return (
      <AppShell title="Reminders" subtitle="In-app nudges for follow-ups and deep work">
        <div className="panel-surface p-6">
          <Badge tone="watch">Setup required</Badge>
          <p className="mt-2 text-sm text-muted-foreground">
            Run migration 0005 after connecting Supabase.
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
      <AppShell title="Reminders" subtitle="In-app nudges for follow-ups and deep work">
        <p className="text-sm text-muted-foreground">
          <Link href="/login" className="font-semibold text-brand">
            Sign in
          </Link>
        </p>
      </AppShell>
    );
  }

  const [reminders, prefs] = await Promise.all([
    supabase
      .from("reminders")
      .select("id, title, body, reminder_type, due_at, status, channel")
      .eq("user_id", user.id)
      .order("due_at", { ascending: true }),
    supabase
      .from("notification_preferences")
      .select(
        "email_enabled, in_app_enabled, quiet_hours_start, quiet_hours_end, max_emails_per_day",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return (
    <AppShell title="Reminders" subtitle="Never miss a follow-up or deep-work block">
      <RemindersClient
        reminders={reminders.data || []}
        prefs={prefs.data || null}
      />
    </AppShell>
  );
}
