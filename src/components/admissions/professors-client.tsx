"use client";

import Link from "next/link";
import { useActionState, useTransition } from "react";
import {
  createProfessorAction,
  updateProfessorStageAction,
  type ActionState,
} from "@/lib/actions/admissions";
import { OUTREACH_STAGES, PIPELINE_SUMMARY_STAGES } from "@/lib/domain/outreach-stages";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fitCategoryLabel, type FitCategory } from "@/lib/domain/fit-score";

export type ProfessorRow = {
  id: string;
  full_name: string;
  lab_name: string;
  outreach_stage: string;
  fit_score: number | null;
  fit_category: FitCategory;
  generic_fit_warning: boolean;
  university_id: string | null;
  universities?: { name: string } | null;
};

export type UniversityOption = { id: string; name: string };

function StageSelect({ professor }: { professor: ProfessorRow }) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      className="h-8 max-w-[160px] rounded-md border border-border bg-card px-2 text-[11px]"
      defaultValue={professor.outreach_stage}
      disabled={pending}
      onChange={(e) =>
        startTransition(() => updateProfessorStageAction(professor.id, e.target.value))
      }
    >
      {OUTREACH_STAGES.map((stage) => (
        <option key={stage} value={stage}>
          {stage}
        </option>
      ))}
    </select>
  );
}

export function ProfessorsClient({
  professors,
  universities,
}: {
  professors: ProfessorRow[];
  universities: UniversityOption[];
}) {
  const [state, formAction, pending] = useActionState(
    createProfessorAction,
    {} as ActionState,
  );

  const byStage = PIPELINE_SUMMARY_STAGES.map((stage) => ({
    stage,
    items: professors.filter((p) => {
      if (stage === "Researching") {
        return p.outreach_stage === "Researching" || p.outreach_stage === "Research Needed";
      }
      if (stage === "Strong Fit") {
        return p.outreach_stage === "Strong Fit" || p.outreach_stage === "Fit Assessed";
      }
      if (stage === "Draft Created") {
        return [
          "Draft Needed",
          "Draft Created",
          "Ready for Review",
          "Ready to Send",
        ].includes(p.outreach_stage);
      }
      if (stage === "Follow-up Due") {
        return p.outreach_stage === "Follow-up Due" || p.outreach_stage === "Follow-up Sent";
      }
      if (stage === "Replied") {
        return [
          "Replied",
          "Encouraged to Apply",
          "Meeting Requested",
          "Interview Scheduled",
        ].includes(p.outreach_stage);
      }
      return p.outreach_stage === stage;
    }),
  }));

  return (
    <div className="space-y-5">
      <form
        action={formAction}
        className="panel-surface grid gap-3 p-5 md:grid-cols-2 lg:grid-cols-3"
      >
        <h2 className="text-sm font-semibold md:col-span-2 lg:col-span-3">Add professor</h2>
        <input
          name="full_name"
          required
          placeholder="Full name"
          className="h-11 rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
        />
        <select
          name="university_id"
          className="h-11 rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
          defaultValue=""
        >
          <option value="">No university linked</option>
          {universities.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <input
          name="lab_name"
          placeholder="Lab name"
          className="h-11 rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
        />
        <input
          name="email"
          placeholder="Email"
          className="h-11 rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
        />
        <input
          name="faculty_profile_url"
          placeholder="Faculty profile URL"
          className="h-11 rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
        />
        <input
          name="research_interests"
          placeholder="Interests (comma-separated)"
          className="h-11 rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
        />
        <textarea
          name="relevant_papers"
          rows={2}
          placeholder="Relevant verified papers (no invented titles)"
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none ring-brand focus:ring-2 md:col-span-2"
        />
        <textarea
          name="personal_notes"
          rows={2}
          placeholder="Personal notes"
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
        />
        <div className="flex items-end gap-3 md:col-span-2 lg:col-span-3">
          {state.error && <p className="text-sm text-danger">{state.error}</p>}
          {state.success && <p className="text-sm text-success">{state.success}</p>}
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Add professor"}
          </Button>
        </div>
      </form>

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-3">
          {byStage.map((col) => (
            <div
              key={col.stage}
              className="panel-surface w-64 shrink-0 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {col.stage}
                </h3>
                <Badge tone="neutral">{col.items.length}</Badge>
              </div>
              <ul className="space-y-2">
                {col.items.map((p) => (
                  <li key={p.id} className="rounded-lg border border-border bg-slate-50/70 p-2.5">
                    <Link
                      href={`/professors/${p.id}`}
                      className="text-sm font-semibold text-foreground hover:text-brand"
                    >
                      {p.full_name}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      {p.universities?.name || "No university"}
                      {p.lab_name ? ` · ${p.lab_name}` : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.fit_score != null && (
                        <Badge tone="brand">{Math.round(p.fit_score)}</Badge>
                      )}
                      {p.generic_fit_warning && <Badge tone="watch">Generic?</Badge>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-surface p-5">
        <h2 className="mb-3 text-sm font-semibold">Table view</h2>
        {professors.length === 0 ? (
          <p className="text-sm text-muted-foreground">No professors yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-2 pr-3">Professor</th>
                  <th className="py-2 pr-3">University</th>
                  <th className="py-2 pr-3">Fit</th>
                  <th className="py-2 pr-3">Stage</th>
                  <th className="py-2">Open</th>
                </tr>
              </thead>
              <tbody>
                {professors.map((p) => (
                  <tr key={p.id} className="border-b border-border/70">
                    <td className="py-3 pr-3 font-medium">
                      {p.full_name}
                      {p.generic_fit_warning ? (
                        <span className="ml-2 text-[10px] font-bold uppercase text-warning">
                          generic risk
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {p.universities?.name || "—"}
                    </td>
                    <td className="py-3 pr-3">
                      {p.fit_score != null
                        ? `${Math.round(p.fit_score)} · ${fitCategoryLabel(p.fit_category)}`
                        : "Not assessed"}
                    </td>
                    <td className="py-3 pr-3">
                      <StageSelect professor={p} />
                    </td>
                    <td className="py-3">
                      <Link href={`/professors/${p.id}`} className="font-semibold text-brand">
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
