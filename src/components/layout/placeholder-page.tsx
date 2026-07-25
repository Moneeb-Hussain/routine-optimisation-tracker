import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";

export default function PlaceholderPage({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <AppShell title={title} subtitle={description}>
      <div className="panel-surface mx-auto max-w-2xl p-8 text-center">
        <Badge tone="brand">{phase}</Badge>
        <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description} Navigation and shell are live so you can feel the product
          structure while we build each module end-to-end.
        </p>
      </div>
    </AppShell>
  );
}
