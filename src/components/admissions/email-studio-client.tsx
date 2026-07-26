"use client";

import { useActionState, useTransition } from "react";
import {
  completeFollowUpAction,
  createEmailDraftAction,
  createEmailTemplateAction,
  updateEmailDraftStatusAction,
  type ActionState,
} from "@/lib/actions/admissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Template = {
  id: string;
  name: string;
  subject_options: string[];
  body_plain: string;
  is_primary: boolean;
};

type Draft = {
  id: string;
  subject: string;
  body_plain: string;
  status: string;
  sent_at: string | null;
  follow_up_due_on: string | null;
  professor_id: string;
  professors?: { full_name: string } | null;
};

type ProfessorOption = { id: string; full_name: string };

type FollowUp = {
  id: string;
  due_on: string;
  status: string;
  notes: string;
  professors?: { full_name: string } | null;
};

const DEFAULT_BODY = `Dear Professor [Last Name],

I am Moneeb Hussain, a BS graduate in Mechatronics and Control Engineering from UET Lahore (CGPA 3.16; IELTS Academic 7.0). I am exploring funded graduate opportunities aligned with your lab.

Your work on [specific verified paper/project] is relevant to my experience building Automatic Retail Checkout V-3 (YOLOv4-tiny/OpenCV, 70 product classes, 98.78% detection accuracy in controlled tests).

Selected evidence:
• Harvard CS50x Puzzle Day winner (10/10)
• Top 4% HackerRank Orchestrate (10,000+ participants)

I would value your guidance on whether my background is a fit for openings in your group, and would welcome a brief conversation at your convenience.

Sincerely,
Moneeb Hussain`;

export function EmailStudioClient({
  templates,
  drafts,
  professors,
  followUps,
  selectedProfessorId,
}: {
  templates: Template[];
  drafts: Draft[];
  professors: ProfessorOption[];
  followUps: FollowUp[];
  selectedProfessorId?: string;
}) {
  const [templateState, templateAction, savingTemplate] = useActionState(
    createEmailTemplateAction,
    {} as ActionState,
  );
  const [draftState, draftAction, savingDraft] = useActionState(
    createEmailDraftAction,
    {} as ActionState,
  );
  const [statusState, statusAction, updatingStatus] = useActionState(
    updateEmailDraftStatusAction,
    {} as ActionState,
  );
  const [pendingFollowUp, startFollowUp] = useTransition();

  const primary = templates.find((t) => t.is_primary) || templates[0];

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
        Professor outreach is <strong className="text-foreground">never auto-sent</strong>. Mark
        drafts approved/sent only after you personally send them outside the app.
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <form action={templateAction} className="panel-surface space-y-3 p-5 lg:col-span-5">
          <h2 className="text-sm font-semibold">Master template</h2>
          <input
            name="name"
            required
            defaultValue="Josephson-pattern primary"
            className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
          />
          <textarea
            name="subject_options"
            rows={3}
            defaultValue={[
              "Prospective Graduate Student | Mechatronics & Intelligent Systems | IELTS 7.0 | Harvard CS50x Winner",
              "Prospective Graduate Student | Computer Vision & AI Automation | IELTS 7.0 | Harvard CS50x Winner",
            ].join("\n")}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
          />
          <textarea
            name="body_plain"
            rows={12}
            required
            defaultValue={primary?.body_plain || DEFAULT_BODY}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 font-mono text-xs outline-none ring-brand focus:ring-2"
          />
          <label className="flex items-center gap-2 text-sm">
            <input name="is_primary" type="checkbox" defaultChecked /> Primary template
          </label>
          {templateState.error && <p className="text-sm text-danger">{templateState.error}</p>}
          {templateState.success && (
            <p className="text-sm text-success">{templateState.success}</p>
          )}
          <Button type="submit" disabled={savingTemplate}>
            {savingTemplate ? "Saving…" : "Save template"}
          </Button>
        </form>

        <form action={draftAction} className="panel-surface space-y-3 p-5 lg:col-span-7">
          <h2 className="text-sm font-semibold">Professor-specific draft</h2>
          <select
            name="professor_id"
            required
            defaultValue={selectedProfessorId || ""}
            className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
          >
            <option value="">Select professor</option>
            {professors.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
          {primary && <input type="hidden" name="template_id" value={primary.id} />}
          <input
            name="subject"
            required
            defaultValue={
              primary?.subject_options?.[0] ||
              "Prospective Graduate Student | Mechatronics & Intelligent Systems | IELTS 7.0 | Harvard CS50x Winner"
            }
            className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
          />
          <textarea
            name="body_plain"
            rows={14}
            required
            defaultValue={primary?.body_plain || DEFAULT_BODY}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 font-mono text-xs outline-none ring-brand focus:ring-2"
          />
          {draftState.error && <p className="text-sm text-danger">{draftState.error}</p>}
          {draftState.success && <p className="text-sm text-success">{draftState.success}</p>}
          <Button type="submit" disabled={savingDraft}>
            {savingDraft ? "Saving…" : "Create draft"}
          </Button>
        </form>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="panel-surface p-5 lg:col-span-8">
          <h2 className="mb-3 text-sm font-semibold">Drafts</h2>
          {statusState.error && <p className="mb-2 text-sm text-danger">{statusState.error}</p>}
          {statusState.success && (
            <p className="mb-2 text-sm text-success">{statusState.success}</p>
          )}
          {drafts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No drafts yet.</p>
          ) : (
            <ul className="space-y-3">
              {drafts.map((d) => (
                <li key={d.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">
                      {d.professors?.full_name || "Professor"}
                    </p>
                    <Badge tone="neutral">{d.status}</Badge>
                    {d.follow_up_due_on && (
                      <Badge tone="watch">Follow-up {d.follow_up_due_on}</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{d.subject}</p>
                  <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 font-mono text-[11px] text-foreground">
                    {d.body_plain}
                  </pre>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {d.status === "draft" && (
                      <form action={statusAction}>
                        <input type="hidden" name="draft_id" value={d.id} />
                        <input type="hidden" name="status" value="ready_for_review" />
                        <Button type="submit" size="sm" variant="secondary" disabled={updatingStatus}>
                          Ready for review
                        </Button>
                      </form>
                    )}
                    {(d.status === "draft" || d.status === "ready_for_review") && (
                      <form action={statusAction}>
                        <input type="hidden" name="draft_id" value={d.id} />
                        <input type="hidden" name="status" value="approved" />
                        <Button type="submit" size="sm" variant="secondary" disabled={updatingStatus}>
                          Approve
                        </Button>
                      </form>
                    )}
                    {d.status === "approved" && (
                      <form action={statusAction}>
                        <input type="hidden" name="draft_id" value={d.id} />
                        <input type="hidden" name="status" value="sent" />
                        <input type="hidden" name="follow_up_days" value="10" />
                        <Button type="submit" size="sm" disabled={updatingStatus}>
                          Mark sent + schedule follow-up
                        </Button>
                      </form>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel-surface p-5 lg:col-span-4">
          <h2 className="mb-3 text-sm font-semibold">Follow-ups due</h2>
          {followUps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending follow-ups.</p>
          ) : (
            <ul className="space-y-2">
              {followUps.map((f) => (
                <li
                  key={f.id}
                  className="flex items-start justify-between gap-2 rounded-lg border border-border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {f.professors?.full_name || "Professor"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Due {f.due_on}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pendingFollowUp}
                    onClick={() => startFollowUp(() => completeFollowUpAction(f.id))}
                  >
                    Done
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
