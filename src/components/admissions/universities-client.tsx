"use client";

import { useActionState } from "react";
import { createUniversityAction, type ActionState } from "@/lib/actions/admissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type UniversityRow = {
  id: string;
  name: string;
  country: string;
  state_or_province: string;
  program: string;
  priority: string;
  application_status: string;
  deadline: string | null;
};

export function UniversitiesClient({ universities }: { universities: UniversityRow[] }) {
  const [state, formAction, pending] = useActionState(
    createUniversityAction,
    {} as ActionState,
  );

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <form action={formAction} className="panel-surface space-y-3 p-5 lg:col-span-4">
        <h2 className="text-sm font-semibold">Add university</h2>
        <input
          name="name"
          required
          placeholder="University name"
          className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            name="state_or_province"
            placeholder="State / province"
            className="h-11 rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
          />
          <input
            name="country"
            defaultValue="United States"
            className="h-11 rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
          />
        </div>
        <input
          name="department"
          placeholder="Department"
          className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
        />
        <input
          name="program"
          placeholder="Program (e.g. MS/PhD ECE)"
          className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
        />
        <input
          name="deadline"
          type="date"
          className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
        />
        <select
          name="priority"
          defaultValue="medium"
          className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
        >
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <textarea
          name="funding_notes"
          rows={2}
          placeholder="Funding notes"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
        />
        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        {state.success && <p className="text-sm text-success">{state.success}</p>}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Saving…" : "Save university"}
        </Button>
      </form>

      <div className="panel-surface p-5 lg:col-span-8">
        <h2 className="mb-3 text-sm font-semibold">Your universities</h2>
        {universities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No universities yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {universities.map((u) => (
              <li key={u.id} className="flex items-start justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-semibold">{u.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {[u.state_or_province, u.country].filter(Boolean).join(", ")}
                    {u.program ? ` · ${u.program}` : ""}
                    {u.deadline ? ` · deadline ${u.deadline}` : ""}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Badge tone="brand">{u.priority}</Badge>
                  <Badge tone="neutral">{u.application_status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
