"use client";

import Link from "next/link";
import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createLearningPlanAction,
  importStudyPlanFromDocumentAction,
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
  source_document_id?: string | null;
};

export type LearningItem = {
  id: string;
  plan_id: string;
  title: string;
  description?: string;
  status: string;
  estimated_minutes: number | null;
  day_number: number | null;
};

export type DocOption = { id: string; title: string; document_type: string };

export function LearningClient({
  plans,
  items,
  documents,
}: {
  plans: LearningPlan[];
  items: LearningItem[];
  documents: DocOption[];
}) {
  const router = useRouter();
  const [planState, planAction, planPending] = useActionState(
    createLearningPlanAction,
    {} as ActionState,
  );
  const [importState, importAction, importPending] = useActionState(
    importStudyPlanFromDocumentAction,
    {} as ActionState,
  );

  useEffect(() => {
    const id = importState.planId || planState.planId;
    if (id) router.push(`/learning/${id}`);
  }, [importState.planId, planState.planId, router]);

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-4">
        <form action={importAction} className="panel-surface space-y-3 p-5">
          <h2 className="text-sm font-semibold">Import day-wise plan</h2>
          <p className="text-xs text-muted-foreground">
            Upload a plan in Documents first (e.g. robotics, 1h/day). Then import here to track done vs left.
          </p>
          <select
            name="document_id"
            required
            className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
            defaultValue=""
          >
            <option value="" disabled>
              Select document
            </option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title} ({d.document_type})
              </option>
            ))}
          </select>
          <input
            name="area"
            defaultValue="robotics"
            placeholder="Field (robotics, CV, ML…)"
            className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
          />
          <input
            name="daily_minutes"
            type="number"
            defaultValue={60}
            className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
          />
          {importState.error && (
            <p className="text-sm text-danger">{importState.error}</p>
          )}
          {importState.success && (
            <p className="text-sm text-success">{importState.success}</p>
          )}
          <Button type="submit" disabled={importPending || documents.length === 0} className="w-full">
            {importPending ? "Importing…" : "Import study plan"}
          </Button>
          {documents.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No documents yet. Go to{" "}
              <Link href="/documents" className="font-semibold text-brand">
                Document Vault
              </Link>
              .
            </p>
          )}
        </form>

        <form action={planAction} className="panel-surface space-y-3 p-5">
          <h2 className="text-sm font-semibold">Blank study plan</h2>
          <input
            name="title"
            required
            placeholder="e.g. Robotics 30-day sprint"
            className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
          />
          <input
            name="area"
            defaultValue="robotics"
            className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
          />
          <textarea
            name="goal"
            rows={2}
            placeholder="What skill outcome?"
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
          />
          <input
            name="daily_minutes"
            type="number"
            defaultValue={60}
            className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
          />
          {planState.error && <p className="text-sm text-danger">{planState.error}</p>}
          <Button type="submit" disabled={planPending} variant="secondary" className="w-full">
            {planPending ? "Creating…" : "Create plan"}
          </Button>
        </form>
      </div>

      <div className="space-y-4 lg:col-span-8">
        <div className="panel-surface p-5">
          <h2 className="mb-3 text-sm font-semibold">Your study plans</h2>
          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Import a day-wise document or create a blank plan.
            </p>
          ) : (
            <ul className="space-y-2">
              {plans.map((p) => {
                const planItems = items.filter((i) => i.plan_id === p.id);
                const left = planItems.filter((i) => i.status !== "done").length;
                return (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-slate-50/70 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium">{p.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.area} · {p.daily_minutes}m/day · {left} left
                        {p.source_document_id ? " · from document" : ""}
                      </p>
                      <div className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{ width: `${p.completion_percent}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={p.completion_percent >= 70 ? "good" : "brand"}>
                        {p.completion_percent}%
                      </Badge>
                      <Link href={`/learning/${p.id}`} className="text-xs font-semibold text-brand">
                        Open
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function StudyPlanDetailClient({
  plan,
  items,
}: {
  plan: LearningPlan;
  items: LearningItem[];
}) {
  const [itemState, itemAction, itemPending] = useActionState(
    addLearningItemAction,
    {} as ActionState,
  );
  const done = items.filter((i) => i.status === "done").length;
  const left = items.length - done;

  return (
    <div className="space-y-4">
      <div className="panel-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Badge tone="brand">{plan.area}</Badge>
            <h2 className="mt-2 font-display text-2xl font-semibold">{plan.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {plan.goal || `${plan.daily_minutes}m/day`} · {done} done · {left} left
            </p>
          </div>
          <Badge tone={plan.completion_percent >= 70 ? "good" : "watch"}>
            {plan.completion_percent}%
          </Badge>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-brand"
            style={{ width: `${plan.completion_percent}%` }}
          />
        </div>
      </div>

      <div className="panel-surface p-5">
        <h3 className="mb-3 text-sm font-semibold">Day-wise checklist</h3>
        <ul className="space-y-2">
          {items.map((item) => (
            <StudyItemRow key={item.id} item={item} />
          ))}
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground">No days yet.</p>
          )}
        </ul>

        <form
          action={itemAction}
          className="mt-4 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row"
        >
          <input type="hidden" name="plan_id" value={plan.id} />
          <input
            name="title"
            required
            placeholder="Add a day / item"
            className="h-11 flex-1 rounded-lg border border-border bg-card px-3 text-sm"
          />
          <input
            name="day_number"
            type="number"
            placeholder="Day #"
            className="h-11 w-24 rounded-lg border border-border bg-card px-3 text-sm"
          />
          <input
            name="estimated_minutes"
            type="number"
            defaultValue={plan.daily_minutes || 60}
            className="h-11 w-24 rounded-lg border border-border bg-card px-3 text-sm"
          />
          <Button type="submit" disabled={itemPending} variant="secondary">
            Add
          </Button>
        </form>
        {itemState.error && (
          <p className="mt-2 text-sm text-danger">{itemState.error}</p>
        )}
      </div>

      <Link href="/learning" className="text-sm font-semibold text-brand">
        ← All study plans
      </Link>
    </div>
  );
}

function StudyItemRow({ item }: { item: LearningItem }) {
  const [pending, start] = useTransition();
  const done = item.status === "done";
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border bg-slate-50/70 px-3 py-2.5">
      <div>
        <p className={`text-sm ${done ? "text-muted-foreground line-through" : ""}`}>
          {item.day_number != null ? `Day ${item.day_number}: ` : ""}
          {item.title}
        </p>
        <p className="text-xs text-muted-foreground">
          {item.estimated_minutes ? `${item.estimated_minutes}m` : "—"}
          {item.description ? ` · ${item.description.slice(0, 80)}` : ""}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        variant={done ? "secondary" : "primary"}
        disabled={pending}
        onClick={() =>
          start(() => toggleLearningItemDoneAction(item.id, item.plan_id, !done))
        }
      >
        {pending ? "…" : done ? "Undo" : "Done"}
      </Button>
    </li>
  );
}
