"use client";

import {
  Flame,
  Moon,
  Brain,
  Target,
  Plane,
  Trophy,
  AlertTriangle,
  Quote,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { KpiCard } from "@/components/dashboard/kpi-cards";
import { ExecutionScoreRing } from "@/components/dashboard/execution-score-ring";
import { WeeklyProgressChart } from "@/components/dashboard/weekly-progress-chart";
import { CategoryMixChart } from "@/components/dashboard/category-mix-chart";
import { NextBestActionCard } from "@/components/dashboard/next-best-action";
import { MustDoList } from "@/components/dashboard/must-do-list";
import { PipelinePanel } from "@/components/dashboard/pipeline-panel";
import { ScoreBreakdown } from "@/components/dashboard/score-breakdown";
import { Badge } from "@/components/ui/badge";
import type { CommandCenterData } from "@/lib/data/command-center";

function sleepTone(hours: number, target: number) {
  if (hours >= target - 0.5) return "good" as const;
  if (hours >= target - 1.5) return "watch" as const;
  return "critical" as const;
}

export function CommandCenterView({
  data,
  embed = false,
}: {
  data: CommandCenterData;
  embed?: boolean;
}) {
  const d = data;
  const now = new Date();
  const localDate = new Intl.DateTimeFormat("en-US", {
    timeZone: d.timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);
  const localTime = new Intl.DateTimeFormat("en-US", {
    timeZone: d.timezone,
    hour: "numeric",
    minute: "2-digit",
  }).format(now);

  const body = (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone={d.mode === "live" ? "good" : "brand"}>
          {d.mode === "live" ? "Live data" : "UI preview · demo data"}
        </Badge>
        {d.setupRequired ? (
          <span className="text-xs text-muted-foreground">
            Add Supabase keys + run migration to replace fixtures with your data.
          </span>
        ) : d.mode === "demo" ? (
          <span className="text-xs text-muted-foreground">
            Sign in to load your goals, tasks, and sleep.
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            Score and must-dos come from today’s plan, tasks, focus, and sleep.
          </span>
        )}
      </div>

      <section className="mb-5 grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="panel-surface relative overflow-hidden p-5 md:p-6">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_80%_20%,rgba(14,116,144,0.12),transparent_55%)]" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{localDate}</span>
              <span>·</span>
              <span className="metric">{localTime}</span>
              <span>·</span>
              <span>{d.timezone}</span>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Good focus, {d.userFirstName}.
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Today’s primary goal:{" "}
              <span className="font-medium text-foreground">{d.primaryGoal}</span>
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="watch">
                {d.daysToDeadline} days to {d.deadlineLabel}
              </Badge>
              <Badge tone="good">{d.streakDays}-day streak</Badge>
            </div>
          </div>
        </div>

        <NextBestActionCard
          title={d.nextBestAction.title}
          reason={d.nextBestAction.reason}
          minutes={d.nextBestAction.minutes}
        />
      </section>

      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Weekly progress"
          value={`${d.weeklyProgress}%`}
          hint="Toward this week’s milestones"
          icon={Target}
          tone="good"
          badge="Solid"
          progress={d.weeklyProgress}
          delay={0.05}
        />
        <KpiCard
          label="Sleep last night"
          value={`${d.sleepHours}h`}
          hint={`Target ${d.sleepTarget}h · readiness, not punishment`}
          icon={Moon}
          tone={sleepTone(d.sleepHours, d.sleepTarget)}
          badge={d.sleepHours < d.sleepTarget - 1 ? "Protect rest" : "Ready"}
          progress={(d.sleepHours / d.sleepTarget) * 100}
          delay={0.1}
        />
        <KpiCard
          label="Deep work"
          value={`${d.deepWorkMinutes}m`}
          hint={`Target ${d.deepWorkTarget}m today`}
          icon={Brain}
          tone={d.deepWorkMinutes >= d.deepWorkTarget ? "good" : "watch"}
          progress={(d.deepWorkMinutes / d.deepWorkTarget) * 100}
          delay={0.15}
        />
        <KpiCard
          label="Journey readiness"
          value={`${d.applicationReadinessPct}%`}
          hint={`Interview prep ${d.interviewPrepPct}% · organizational estimate`}
          icon={Plane}
          tone="neutral"
          badge="Estimate"
          progress={d.applicationReadinessPct}
          delay={0.2}
        />
      </section>

      <section className="mb-5 grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-3">
          <ExecutionScoreRing score={d.executionScore} />
        </div>
        <div className="xl:col-span-5">
          <WeeklyProgressChart data={d.weeklyExecution} />
        </div>
        <div className="xl:col-span-4">
          <CategoryMixChart data={d.categoryMix} />
        </div>
      </section>

      <section className="mb-5 grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <MustDoList tasks={d.mustDos} />
        </div>
        <div className="lg:col-span-4">
          <PipelinePanel pipeline={d.pipeline} followUps={d.followUps} />
        </div>
        <div className="lg:col-span-4">
          <ScoreBreakdown items={d.scoreBreakdown} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="panel-surface p-5">
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-brand" />
            <h3 className="text-sm font-semibold">Recent wins</h3>
          </div>
          <ul className="space-y-2.5">
            {d.recentWins.map((win) => (
              <li
                key={win}
                className="rounded-lg border border-border bg-slate-50/70 px-3 py-2 text-sm text-foreground"
              >
                {win}
              </li>
            ))}
          </ul>
        </div>

        <div className="panel-surface p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h3 className="text-sm font-semibold">Current risk</h3>
          </div>
          <Badge tone="watch">{d.risk.label}</Badge>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {d.risk.detail}
          </p>
        </div>

        <div className="panel-surface p-5">
          <div className="mb-3 flex items-center gap-2">
            <Quote className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold">Fuel for today</h3>
          </div>
          <p className="text-sm leading-relaxed text-foreground">{d.motivation}</p>
          <div className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-warning" />
            Streak: {d.streakDays} days
          </div>
        </div>
      </section>
    </>
  );

  if (embed) return body;

  return (
    <AppShell
      title="Command Center"
      subtitle="Your daily admissions operating picture"
    >
      {body}
    </AppShell>
  );
}
