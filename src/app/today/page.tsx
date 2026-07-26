import { AppShell } from "@/components/layout/app-shell";
import { TodayClient } from "@/components/planning/today-client";
import { getTodayContext } from "@/lib/data/command-center";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function TodayPage() {
  const ctx = await getTodayContext();

  return (
    <AppShell title="Today" subtitle="Plan the day around one primary goal">
      {!ctx.configured ? (
        <div className="panel-surface p-6">
          <Badge tone="watch">Setup required</Badge>
          <p className="mt-3 text-sm text-muted-foreground">
            Configure Supabase to save daily plans. You can still explore the{" "}
            <Link href="/dashboard" className="font-semibold text-brand">
              Command Center
            </Link>{" "}
            UI preview.
          </p>
        </div>
      ) : !ctx.today ? (
        <div className="panel-surface p-6">
          <p className="text-sm text-muted-foreground">
            Sign in to plan your day.{" "}
            <Link href="/login" className="font-semibold text-brand">
              Go to login
            </Link>
          </p>
        </div>
      ) : (
        <TodayClient today={ctx.today} plan={ctx.plan} tasks={ctx.tasks} />
      )}
    </AppShell>
  );
}
