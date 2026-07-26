"use client";

import Link from "next/link";
import type { JourneyStageView } from "@/lib/domain/journey";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Lock } from "lucide-react";

export function JourneyClient({
  stages,
  overall,
  intake,
}: {
  stages: JourneyStageView[];
  overall: number;
  intake: string;
}) {
  return (
    <div className="space-y-5">
      <div className="panel-surface relative overflow-hidden p-6">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_80%_30%,rgba(14,116,144,0.14),transparent_55%)]" />
        <div className="relative">
          <Badge tone="brand">Target intake {intake || "2027"}</Badge>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Journey to the United States
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Nine stages from profile strength to arrival. Progress syncs from your goal tree.
          </p>
          <div className="mt-5">
            <div className="mb-1.5 flex justify-between text-xs font-semibold text-muted-foreground">
              <span>Overall readiness</span>
              <span className="metric text-foreground">{overall}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-brand transition-all"
                style={{ width: `${Math.min(100, overall)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <ol className="space-y-3">
        {stages.map((stage, index) => (
          <li
            key={stage.id}
            className="panel-surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex gap-3">
              <StatusIcon status={stage.status} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Stage {index + 1}
                </p>
                <p className="text-sm font-semibold text-foreground">{stage.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{stage.description}</p>
                {stage.goalTitle && (
                  <p className="mt-1 text-xs text-brand">Linked goal: {stage.goalTitle}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 sm:min-w-[140px] sm:flex-col sm:items-end">
              <Badge
                tone={
                  stage.status === "done"
                    ? "good"
                    : stage.status === "active"
                      ? "watch"
                      : "neutral"
                }
              >
                {stage.status}
              </Badge>
              <span className="metric text-sm font-semibold">{stage.progress}%</span>
            </div>
          </li>
        ))}
      </ol>

      <p className="text-sm text-muted-foreground">
        Update progress on{" "}
        <Link href="/goals" className="font-semibold text-brand">
          Goals
        </Link>
        . Interview drills live in{" "}
        <Link href="/interview-prep" className="font-semibold text-brand">
          Interview Prep
        </Link>
        .
      </p>
    </div>
  );
}

function StatusIcon({ status }: { status: JourneyStageView["status"] }) {
  if (status === "done") {
    return <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />;
  }
  if (status === "active") {
    return <Circle className="mt-0.5 h-5 w-5 shrink-0 text-brand" />;
  }
  return <Lock className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" />;
}
