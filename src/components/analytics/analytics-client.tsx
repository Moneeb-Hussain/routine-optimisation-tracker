"use client";

import { useActionState, useTransition } from "react";
import {
  generateWeeklyReviewAction,
  updateWeeklyReviewNotesAction,
  type ActionState,
} from "@/lib/actions/weekly-review";
import type { AnalyticsData } from "@/lib/data/analytics";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WeeklyProgressChart } from "@/components/dashboard/weekly-progress-chart";
import { CategoryMixChart } from "@/components/dashboard/category-mix-chart";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function AnalyticsClient({ data }: { data: AnalyticsData }) {
  const [genPending, startGen] = useTransition();
  const [noteState, noteAction, notePending] = useActionState(
    updateWeeklyReviewNotesAction,
    {} as ActionState,
  );

  const chartData = data.dailyExecution.map((d) => ({
    day: d.day,
    score: d.total === 0 ? 0 : Math.round((d.done / d.total) * 100),
    deepWork: d.deepWork,
  }));

  const mix = data.pipeline.map((p, i) => ({
    name: p.stage,
    value: p.count,
    fill: ["#0E7490", "#0891B2", "#0284C7", "#0369A1", "#0F766E", "#155E75"][i % 6],
  }));

  const review = data.weeklyReview as {
    week_start?: string;
    completion_percent?: number;
    must_do_rate?: number;
    deep_work_hours?: number;
    sleep_average?: number;
    outreach_summary?: string;
    interview_summary?: string;
    best_day?: string;
    weakest_day?: string;
    common_blocker?: string;
    top_achievement?: string;
    next_week_priorities?: string;
  } | null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={data.mode === "live" ? "good" : "brand"}>
          {data.mode === "live" ? "Live week" : "Demo preview"}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {data.weekStart} → {data.weekEnd} · {data.timezone}
        </span>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={genPending || data.mode !== "live"}
          onClick={() =>
            startGen(async () => {
              await generateWeeklyReviewAction();
            })
          }
        >
          {genPending ? "Generating…" : "Generate weekly review"}
        </Button>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Kpi label="Tasks done" value={String(data.kpis.tasksDone)} />
        <Kpi label="Must-do rate" value={`${data.kpis.mustDoRate}%`} />
        <Kpi label="Deep work" value={`${data.kpis.deepWorkHours}h`} />
        <Kpi label="Sleep avg" value={`${data.kpis.sleepAvg}h`} />
        <Kpi label="Outreach logged" value={String(data.kpis.outreachCount)} />
        <Kpi label="Interview prep" value={`${data.kpis.prepPct}%`} />
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <WeeklyProgressChart data={chartData} />
        </div>
        <div className="xl:col-span-5">
          {mix.length > 0 ? (
            <CategoryMixChart data={mix} />
          ) : (
            <div className="panel-surface p-5 text-sm text-muted-foreground">
              Add professors to see pipeline mix.
            </div>
          )}
        </div>
      </section>

      <section className="panel-surface p-5">
        <h3 className="mb-3 text-sm font-semibold">Sleep this week</h3>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.sleepSeries}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "#94A3B8" }} />
              <Tooltip />
              <Bar dataKey="hours" fill="#0E7490" radius={[4, 4, 0, 0]} name="Hours" />
              <Line type="monotone" dataKey="hours" stroke="#D97706" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-12">
        <div className="panel-surface space-y-3 p-5 lg:col-span-7">
          <h3 className="text-sm font-semibold">Weekly review</h3>
          {!review ? (
            <p className="text-sm text-muted-foreground">
              Generate a review to lock stats for this week, then edit notes.
            </p>
          ) : (
            <>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Completion</dt>
                  <dd>{review.completion_percent}%</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Must-do rate</dt>
                  <dd>{review.must_do_rate}%</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Best day</dt>
                  <dd>{review.best_day}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Weakest day</dt>
                  <dd>{review.weakest_day}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">Outreach</dt>
                  <dd>{review.outreach_summary}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">Interview</dt>
                  <dd>{review.interview_summary}</dd>
                </div>
              </dl>
              <form action={noteAction} className="space-y-2 border-t border-border pt-3">
                <input type="hidden" name="week_start" value={review.week_start || data.weekStart} />
                <textarea
                  name="top_achievement"
                  rows={2}
                  defaultValue={review.top_achievement || ""}
                  placeholder="Top achievement"
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
                />
                <textarea
                  name="common_blocker"
                  rows={2}
                  defaultValue={review.common_blocker || ""}
                  placeholder="Common blocker"
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
                />
                <textarea
                  name="next_week_priorities"
                  rows={2}
                  defaultValue={review.next_week_priorities || ""}
                  placeholder="Next week priorities"
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
                />
                {noteState.error && <p className="text-sm text-danger">{noteState.error}</p>}
                {noteState.success && (
                  <p className="text-sm text-success">{noteState.success}</p>
                )}
                <Button type="submit" disabled={notePending} size="sm">
                  Save notes
                </Button>
              </form>
            </>
          )}
        </div>
        <div className="panel-surface p-5 lg:col-span-5">
          <h3 className="mb-3 text-sm font-semibold">How to use this</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Generate weekly review every Sunday night or Monday morning.</li>
            <li>Edit achievement / blocker / next priorities after the auto stats.</li>
            <li>Sleep dips should shrink must-dos — not shame you.</li>
            <li>Pipeline mix shows where outreach is stuck.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel-surface p-4">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
