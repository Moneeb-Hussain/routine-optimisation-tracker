"use client";

import { useActionState } from "react";
import { createGoalAction, type ActionState } from "@/lib/actions/planning";
import { Button } from "@/components/ui/button";
import type { Goal } from "@/lib/types";

export function GoalsClient({ goals }: { goals: Goal[] }) {
  const [state, formAction, pending] = useActionState(createGoalAction, {} as ActionState);
  const roots = goals.filter((g) => !g.parent_id);
  const childrenOf = (id: string) => goals.filter((g) => g.parent_id === id);

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <form action={formAction} className="panel-surface space-y-3 p-5 lg:col-span-4">
        <h2 className="text-sm font-semibold">Add goal</h2>
        <input
          name="title"
          required
          placeholder="Goal title"
          className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
        />
        <textarea
          name="description"
          rows={2}
          placeholder="Success criteria / notes"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
        />
        <select
          name="horizon"
          defaultValue="quarterly"
          className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
        >
          <option value="long_term">Long-term</option>
          <option value="quarterly">Quarterly</option>
          <option value="monthly">Monthly</option>
          <option value="weekly">Weekly</option>
          <option value="daily">Daily</option>
        </select>
        {roots.length > 0 && (
          <select
            name="parent_id"
            defaultValue=""
            className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
          >
            <option value="">No parent (top-level)</option>
            {roots.map((g) => (
              <option key={g.id} value={g.id}>
                Under: {g.title}
              </option>
            ))}
          </select>
        )}
        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        {state.success && <p className="text-sm text-success">{state.success}</p>}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Saving…" : "Create goal"}
        </Button>
      </form>

      <div className="panel-surface p-5 lg:col-span-8">
        <h2 className="mb-4 text-sm font-semibold">Goal tree</h2>
        {roots.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No goals yet. Complete onboarding to seed the US journey tree, or add one here.
          </p>
        ) : (
          <ul className="space-y-4">
            {roots.map((root) => (
              <li key={root.id}>
                <p className="font-display text-lg font-semibold">{root.title}</p>
                <p className="text-xs text-muted-foreground">
                  {root.horizon} · {root.progress_percent}%
                </p>
                <ul className="mt-3 space-y-2 border-l border-border pl-4">
                  {childrenOf(root.id).map((child) => (
                    <li key={child.id} className="text-sm">
                      <span className="font-medium">{child.title}</span>
                      <span className="text-muted-foreground"> · {child.progress_percent}%</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
