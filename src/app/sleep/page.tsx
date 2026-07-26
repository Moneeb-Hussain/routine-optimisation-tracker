import { AppShell } from "@/components/layout/app-shell";
import { SleepClient } from "@/components/planning/sleep-client";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { SleepLog } from "@/lib/types";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function SleepPage() {
  if (!isSupabaseConfigured()) {
    return (
      <AppShell title="Sleep & Energy" subtitle="Readiness for sustainable work">
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
      <AppShell title="Sleep & Energy" subtitle="Readiness for sustainable work">
        <div className="panel-surface p-6 text-sm">
          <Link href="/login" className="font-semibold text-brand">
            Sign in
          </Link>{" "}
          to log sleep.
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
    .from("sleep_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("log_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <AppShell title="Sleep & Energy" subtitle="Readiness for sustainable work">
      <SleepClient defaultDate={today} latest={(data as SleepLog | null) || null} />
    </AppShell>
  );
}
