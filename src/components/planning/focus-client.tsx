"use client";

import { useActionState } from "react";
import {
  completeFocusSessionAction,
  startFocusSessionAction,
  type ActionState,
} from "@/lib/actions/planning";
import { Button } from "@/components/ui/button";
import type { FocusSession, Task } from "@/lib/types";

export function FocusClient({
  tasks,
  active,
  recent,
}: {
  tasks: Task[];
  active: FocusSession | null;
  recent: FocusSession[];
}) {
  const [startState, startAction, starting] = useActionState(
    startFocusSessionAction,
    {} as ActionState,
  );
  const [endState, endAction, ending] = useActionState(
    completeFocusSessionAction,
    {} as ActionState,
  );

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="panel-surface space-y-4 p-5 lg:col-span-6">
        <h2 className="text-sm font-semibold">Start focus session</h2>
        {!active ? (
          <form action={startAction} className="space-y-3">
            <select
              name="planned_minutes"
              defaultValue="25"
              className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
            >
              <option value="25">Pomodoro 25</option>
              <option value="50">Deep block 50</option>
              <option value="90">Long block 90</option>
            </select>
            <select
              name="task_id"
              className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
              defaultValue=""
            >
              <option value="">No linked task</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
            {startState.error && <p className="text-sm text-danger">{startState.error}</p>}
            <Button type="submit" disabled={starting}>
              {starting ? "Starting…" : "Start session"}
            </Button>
          </form>
        ) : (
          <form action={endAction} className="space-y-3">
            <p className="text-sm">
              Running since{" "}
              <span className="font-medium">
                {new Date(active.started_at).toLocaleTimeString()}
              </span>{" "}
              · planned {active.planned_minutes}m
            </p>
            <input type="hidden" name="session_id" value={active.id} />
            <input
              name="actual_minutes"
              type="number"
              required
              defaultValue={active.planned_minutes}
              className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
              placeholder="Actual minutes"
            />
            <input
              name="focus_quality"
              type="number"
              min={1}
              max={5}
              defaultValue={4}
              className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
              placeholder="Focus quality 1–5"
            />
            <textarea
              name="completion_notes"
              rows={2}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
              placeholder="What did you finish?"
            />
            {endState.error && <p className="text-sm text-danger">{endState.error}</p>}
            <Button type="submit" disabled={ending}>
              {ending ? "Saving…" : "Complete session"}
            </Button>
          </form>
        )}
      </div>

      <div className="panel-surface p-5 lg:col-span-6">
        <h2 className="mb-3 text-sm font-semibold">Recent sessions</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sessions yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {recent.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
              >
                <span>{new Date(s.started_at).toLocaleString()}</span>
                <span className="metric text-muted-foreground">
                  {s.actual_minutes ?? s.planned_minutes}m · {s.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
