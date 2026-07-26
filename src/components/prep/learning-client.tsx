"use client";

import { useActionState, useTransition } from "react";
import {
  createLearningPlanAction,
  addLearningItemAction,
  toggleLearningItemDoneAction,
  type ActionState,
} from "@/lib/actions/learning";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type LearningPlan = {
  id: string;
  title: string;
  area: string;
  goal: string;
  status: string;
  daily_minutes: number;
  completion_percent: number;
};

export type LearningItem = {
  id: string;
  plan_id: string;
  title: string;
  status: string;
  estimated_minutes: number | null;
};

export function LearningClient({
  plans,
  items,
}: {
  plans: LearningPlan[];
  items: LearningItem[];
}) {
  const [planState, planAction, planPending] = useActionState(
    createLearningPlanAction,
    {} as ActionState,
  );
  const [itemState, itemAction, itemPending] = useActionState(
    addLearningItemAction,
    {} as ActionState,
  );

  const active = plans[0];
  const activeItems = items.filter((i) => i.plan_id === active?.id);

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <form action={planAction} className="panel-surface space-y-3 p-5 lg:col-span-4">
        <h2 className="text-sm font-semibold">New learning plan</h2>
        <input
          name="title"
          required
          placeholder="e.g. CV rewrite sprint"
          className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
        />
        <input
          name="area"
          defaultValue="admissions"
          className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
        />
        <textarea
          name="goal"
          rows={2}
          placeholder="What skill outcome?"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
        />
        <input
          name="daily_minutes"
          type="number"
          defaultValue={45}
          className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
        />
        {planState.error && <p className="text-sm text-danger">{planState.error}</p>}
        {planState.success && (
          <p className="text-sm text-success">{planState.success}</p>
        )}
        <Button type="submit" disabled={planPending} className="w-full">
          {planPending ? "Creating…" : "Create plan"}
        </Button>
      </form>

      <div className="space-y-4 lg:col-span-8">
        <div className="panel-surface p-5">
          <h2 className="mb-3 text-sm font-semibold">Plans</h2>
          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">No plans yet.</p>
          ) : (
            <ul className="space-y-2">
              {plans.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-slate-50/70 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.area} · {p.daily_minutes}m/day
                    </p>
                  </div>
                  <Badge tone="brand">{p.completion_percent}%</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        {active && (
          <div className="panel-surface p-5">
            <h2 className="mb-3 text-sm font-semibold">Items · {active.title}</h2>
            <ul className="space-y-2">
              {activeItems.map((item) => (
                <LearningItemRow key={item.id} item={item} />
              ))}
            </ul>
            <form
              action={itemAction}
              className="mt-4 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row"
            >
              <input type="hidden" name="plan_id" value={active.id} />
              <input
                name="title"
                required
                placeholder="Add learning item"
                className="h-11 flex-1 rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
              />
              <Button type="submit" disabled={itemPending} variant="secondary">
                Add
              </Button>
            </form>
            {itemState.error && (
              <p className="mt-2 text-sm text-danger">{itemState.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LearningItemRow({ item }: { item: LearningItem }) {
  const [pending, startTransition] = useTransition();
  const done = item.status === "done";
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border bg-slate-50/70 px-3 py-2">
      <p className={`text-sm ${done ? "line-through text-muted-foreground" : ""}`}>
        {item.title}
      </p>
      <Button
        type="button"
        size="sm"
        variant={done ? "secondary" : "primary"}
        disabled={pending}
        onClick={() =>
          startTransition(() =>
            toggleLearningItemDoneAction(item.id, item.plan_id, !done),
          )
        }
      >
        {pending ? "…" : done ? "Undo" : "Done"}
      </Button>
    </li>
  );
}
