"use client";

import { useTransition } from "react";
import { useActionState } from "react";
import { upsertDailyPlanAction, toggleTaskDoneAction, type ActionState } from "@/lib/actions/planning";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DailyPlan, Task } from "@/lib/types";

function ToggleDoneButton({ task }: { task: Task }) {
  const [pending, startTransition] = useTransition();
  const done = task.status === "done";

  return (
    <Button
      type="button"
      size="sm"
      variant={done ? "secondary" : "primary"}
      disabled={pending}
      onClick={() => startTransition(() => toggleTaskDoneAction(task.id, !done))}
    >
      {pending ? "…" : done ? "Undo" : "Done"}
    </Button>
  );
}

export function TodayClient({
  today,
  plan,
  tasks,
}: {
  today: string;
  plan: DailyPlan | null;
  tasks: Task[];
}) {
  const [state, formAction, pending] = useActionState(
    upsertDailyPlanAction,
    {} as ActionState,
  );

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <form action={formAction} className="panel-surface space-y-4 p-5 lg:col-span-7">
        <div>
          <h2 className="text-sm font-semibold">Daily plan</h2>
          <p className="text-xs text-muted-foreground">{today}</p>
        </div>
        <input type="hidden" name="plan_date" value={today} />
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Primary goal</span>
          <input
            name="primary_goal"
            required
            defaultValue={plan?.primary_goal || ""}
            className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
            placeholder="What matters most today?"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Why it matters</span>
          <textarea
            name="why_it_matters"
            rows={2}
            defaultValue={plan?.why_it_matters || ""}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Available hours</span>
            <input
              name="available_hours"
              type="number"
              step="0.5"
              defaultValue={plan?.available_hours ?? ""}
              className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Energy (1–5)</span>
            <input
              name="estimated_energy"
              type="number"
              min={1}
              max={5}
              defaultValue={plan?.estimated_energy ?? 3}
              className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
            />
          </label>
        </div>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Current blocker</span>
          <input
            name="current_blocker"
            defaultValue={plan?.current_blocker || ""}
            className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Notes</span>
          <textarea
            name="notes"
            rows={2}
            defaultValue={plan?.notes || ""}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
          />
        </label>
        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        {state.success && <p className="text-sm text-success">{state.success}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save plan"}
        </Button>
      </form>

      <div className="panel-surface p-5 lg:col-span-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Today’s tasks</h2>
          <Badge tone="brand">
            {tasks.filter((t) => t.status === "done").length}/{tasks.length}
          </Badge>
        </div>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tasks scheduled for today. Add some on the Tasks page with today’s date.
          </p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-border px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {task.category}
                    {task.is_must_do ? " · must-do" : ""}
                  </p>
                </div>
                <ToggleDoneButton task={task} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
