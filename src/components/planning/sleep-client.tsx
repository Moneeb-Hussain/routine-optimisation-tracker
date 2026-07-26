"use client";

import { useActionState } from "react";
import { upsertSleepLogAction, type ActionState } from "@/lib/actions/planning";
import { Button } from "@/components/ui/button";
import type { SleepLog } from "@/lib/types";

export function SleepClient({
  defaultDate,
  latest,
}: {
  defaultDate: string;
  latest: SleepLog | null;
}) {
  const [state, formAction, pending] = useActionState(
    upsertSleepLogAction,
    {} as ActionState,
  );

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <form action={formAction} className="panel-surface space-y-3 p-5 lg:col-span-6">
        <h2 className="text-sm font-semibold">Log sleep</h2>
        <p className="text-xs text-muted-foreground">
          Productivity support only — not medical advice. Poor sleep reduces planned workload.
        </p>
        <input
          name="log_date"
          type="date"
          defaultValue={latest?.log_date || defaultDate}
          className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Sleep start</span>
            <input
              name="sleep_start"
              type="datetime-local"
              className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Wake time</span>
            <input
              name="wake_time"
              type="datetime-local"
              className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
            />
          </label>
        </div>
        <input
          name="duration_hours"
          type="number"
          step="0.1"
          placeholder="Duration hours (optional if start/wake set)"
          defaultValue={latest?.duration_hours ?? ""}
          className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            name="quality"
            type="number"
            min={1}
            max={5}
            placeholder="Quality 1–5"
            className="h-11 rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
          />
          <input
            name="energy_level"
            type="number"
            min={1}
            max={5}
            placeholder="Energy 1–5"
            className="h-11 rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
          />
          <input
            name="stress_level"
            type="number"
            min={1}
            max={5}
            placeholder="Stress 1–5"
            className="h-11 rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input name="exercised" type="checkbox" /> Exercised
        </label>
        <textarea
          name="notes"
          rows={2}
          placeholder="Notes"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
        />
        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        {state.success && <p className="text-sm text-success">{state.success}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save sleep log"}
        </Button>
      </form>

      <div className="panel-surface p-5 lg:col-span-6">
        <h2 className="mb-2 text-sm font-semibold">Latest entry</h2>
        {!latest ? (
          <p className="text-sm text-muted-foreground">No sleep logs yet.</p>
        ) : (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Date</dt>
              <dd className="font-medium">{latest.log_date}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Duration</dt>
              <dd className="metric font-medium">{latest.duration_hours ?? "—"} h</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Energy</dt>
              <dd className="font-medium">{latest.energy_level ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Quality</dt>
              <dd className="font-medium">{latest.quality ?? "—"}</dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
