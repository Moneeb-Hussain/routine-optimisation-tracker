"use client";

import type { ComponentType } from "react";
import { useTransition } from "react";
import { refreshMorningBriefAction } from "@/lib/actions/coach";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MorningBrief } from "@/lib/domain/morning-brief";
import { Moon, Target, ListChecks, Mail, Brain, Mic2 } from "lucide-react";

export function MorningBriefCard({
  brief,
  date,
}: {
  brief: MorningBrief;
  date: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="panel-surface relative overflow-hidden p-5 md:p-6">
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-cyan-400 to-brand" />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Morning Brief</h2>
          <p className="text-xs text-muted-foreground">{date}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="brand">{brief.source}</Badge>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await refreshMorningBriefAction();
              })
            }
          >
            {pending ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>

      <p className="font-display text-lg font-semibold tracking-tight text-foreground md:text-xl">
        {brief.motivation}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <BriefRow icon={Target} label="Primary goal" body={brief.primaryGoal} />
        <BriefRow icon={Moon} label="Sleep-aware load" body={brief.sleepAwareWorkload} />
        <BriefRow icon={Brain} label="Deep work" body={brief.deepWorkBlock} />
        <BriefRow icon={Mail} label="Follow-up" body={brief.followUpDue} />
        <BriefRow icon={Mic2} label="Prep / learning" body={brief.interviewOrLearningAction} />
        <BriefRow icon={ListChecks} label="Avoid today" body={brief.avoidToday} />
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Top 3
        </p>
        <ol className="space-y-2">
          {brief.topTasks.map((task, i) => (
            <li
              key={`${i}-${task}`}
              className="flex gap-3 rounded-lg border border-border bg-slate-50/70 px-3 py-2 text-sm"
            >
              <span className="metric text-brand">{i + 1}</span>
              <span>{task}</span>
            </li>
          ))}
        </ol>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Deadline note: {brief.importantDeadline}
      </p>
    </div>
  );
}

function BriefRow({
  icon: Icon,
  label,
  body,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/60 px-3 py-2.5">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-brand" />
        {label}
      </div>
      <p className="text-sm leading-relaxed text-foreground">{body}</p>
    </div>
  );
}
