import { Badge } from "@/components/ui/badge";
import type { Tone } from "@/lib/fixtures/command-center";

export function PipelinePanel({
  pipeline,
  followUps,
}: {
  pipeline: readonly { stage: string; count: number }[];
  followUps: readonly {
    professor: string;
    university: string;
    due: string;
    tone: Tone;
  }[];
}) {
  const max = Math.max(...pipeline.map((p) => p.count), 1);

  return (
    <div className="panel-surface p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Professor pipeline</h3>
        <p className="text-xs text-muted-foreground">Outreach stages at a glance</p>
      </div>

      <ul className="space-y-2.5">
        {pipeline.map((row) => (
          <li key={row.stage}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{row.stage}</span>
              <span className="metric font-semibold text-foreground">{row.count}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand to-accent"
                style={{ width: `${(row.count / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-5 border-t border-border pt-4">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Follow-ups due
        </h4>
        <ul className="space-y-2">
          {followUps.map((item) => (
            <li
              key={`${item.professor}-${item.university}`}
              className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {item.professor}
                </p>
                <p className="text-[11px] text-muted-foreground">{item.university}</p>
              </div>
              <Badge tone={item.tone === "neutral" ? "brand" : item.tone}>
                {item.due}
              </Badge>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
