"use client";

import { useActionState } from "react";
import {
  saveEveningReviewAction,
  type ActionState,
} from "@/lib/actions/coach";
import { Button } from "@/components/ui/button";

export function EveningReviewForm({ today }: { today: string }) {
  const [state, formAction, pending] = useActionState(
    saveEveningReviewAction,
    {} as ActionState,
  );

  return (
    <form action={formAction} className="panel-surface space-y-3 p-5">
      <div>
        <h2 className="text-sm font-semibold">Evening review</h2>
        <p className="text-xs text-muted-foreground">
          Close the loop for {today}. Honest notes beat perfect days.
        </p>
      </div>
      <textarea
        name="completed_summary"
        rows={2}
        placeholder="What got done?"
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
      />
      <textarea
        name="incomplete_summary"
        rows={2}
        placeholder="What slipped?"
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
      />
      <input
        name="delay_cause"
        placeholder="Main delay cause"
        className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
      />
      <label className="block space-y-1.5">
        <span className="text-xs font-semibold text-muted-foreground">Focus (1–5)</span>
        <input
          name="focus_rating"
          type="number"
          min={1}
          max={5}
          defaultValue={3}
          className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
        />
      </label>
      <input
        name="biggest_win"
        placeholder="Biggest win"
        className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
      />
      <textarea
        name="learned"
        rows={2}
        placeholder="What did you learn?"
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
      />
      <textarea
        name="notes"
        rows={2}
        placeholder="Notes for tomorrow"
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
      />
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.success && <p className="text-sm text-success">{state.success}</p>}
      <Button type="submit" disabled={pending} variant="secondary">
        {pending ? "Saving…" : "Save evening review"}
      </Button>
    </form>
  );
}
