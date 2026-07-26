import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { AnalyticsClient } from "@/components/analytics/analytics-client";
import { getAnalyticsData } from "@/lib/data/analytics";
import { isSupabaseConfigured } from "@/lib/env";
import { Badge } from "@/components/ui/badge";

export default async function AnalyticsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <AppShell title="Analytics" subtitle="Weekly execution picture">
        <div className="panel-surface p-6">
          <Badge tone="watch">Setup required</Badge>
        </div>
      </AppShell>
    );
  }

  const data = await getAnalyticsData();
  if (data.mode === "demo") {
    return (
      <AppShell title="Analytics" subtitle="Weekly execution picture">
        <div className="mb-4 panel-surface p-4 text-sm text-muted-foreground">
          Sign in for live analytics. Showing demo preview.{" "}
          <Link href="/login" className="font-semibold text-brand">
            Login
          </Link>
        </div>
        <AnalyticsClient data={data} />
      </AppShell>
    );
  }

  return (
    <AppShell title="Analytics" subtitle="Weekly execution + review">
      <AnalyticsClient data={data} />
    </AppShell>
  );
}
