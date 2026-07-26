import { CommandCenterView } from "@/components/dashboard/command-center-view";
import { MorningBriefCard } from "@/components/coach/morning-brief-card";
import { getCommandCenterData } from "@/lib/data/command-center";
import { getOrBuildMorningBrief } from "@/lib/data/coach-context";
import { AppShell } from "@/components/layout/app-shell";

export default async function DashboardPage() {
  const data = await getCommandCenterData();
  const briefBundle =
    data.mode === "live" ? await getOrBuildMorningBrief() : null;

  if (!briefBundle) {
    return <CommandCenterView data={data} />;
  }

  // Inject morning brief above Command Center content by wrapping
  return (
    <AppShell
      title="Command Center"
      subtitle="Your daily admissions operating picture"
    >
      <div className="mb-5">
        <MorningBriefCard brief={briefBundle.brief} date={briefBundle.date} />
      </div>
      <CommandCenterView data={data} embed />
    </AppShell>
  );
}
