import { CommandCenterView } from "@/components/dashboard/command-center-view";
import { getCommandCenterData } from "@/lib/data/command-center";

export default async function DashboardPage() {
  const data = await getCommandCenterData();
  return <CommandCenterView data={data} />;
}
