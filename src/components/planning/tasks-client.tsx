"use client";

import { useActionState } from "react";
import { createTaskAction, type ActionState } from "@/lib/actions/planning";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/lib/types";

const CATEGORIES = [
  "Professor research",
  "Professor email",
  "Follow-up",
  "Application",
  "CV",
  "SOP",
  "Interview preparation",
  "Technical learning",
  "Health",
  "Personal",
];

export function TasksClient({
  tasks,
  defaultDate,
}: {
  tasks: Task[];
  defaultDate: string;
}) {
  const [state, formAction, pending] = useActionState(createTaskAction, {} as ActionState);

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <form action={formAction} className="panel-surface space-y-3 p-5 lg:col-span-4">
        <h2 className="text-sm font-semibold">Add task</h2>
        <input
          name="title"
          required
          placeholder="Task title"
          className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
        />
        <textarea
          name="description"
          rows={2}
          placeholder="Notes"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
        />
        <select
          name="category"
          className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
          defaultValue="Professor research"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          name="priority"
          className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
          defaultValue="medium"
        >
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <input
          name="scheduled_date"
          type="date"
          defaultValue={defaultDate}
          className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
        />
        <input
          name="estimated_minutes"
          type="number"
          placeholder="Minutes"
          className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
        />
        <label className="flex items-center gap-2 text-sm">
          <input name="is_must_do" type="checkbox" className="rounded border-border" />
          Must-do
        </label>
        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        {state.success && <p className="text-sm text-success">{state.success}</p>}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Saving…" : "Create task"}
        </Button>
      </form>

      <div className="panel-surface p-5 lg:col-span-8">
        <h2 className="mb-3 text-sm font-semibold">Your tasks</h2>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-start justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {task.category} · {task.priority}
                    {task.scheduled_date ? ` · ${task.scheduled_date}` : ""}
                  </p>
                </div>
                <div className="flex gap-1">
                  {task.is_must_do && <Badge tone="watch">Must</Badge>}
                  <Badge tone={task.status === "done" ? "good" : "neutral"}>
                    {task.status}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
