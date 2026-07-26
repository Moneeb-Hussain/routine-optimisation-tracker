"use client";

import { useActionState } from "react";
import { analyzeProfessorFitAction, type ActionState } from "@/lib/actions/admissions";
import { generateProfessorBriefAction } from "@/lib/actions/ai";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fitCategoryLabel, type FitCategory } from "@/lib/domain/fit-score";

type Analysis = {
  id: string;
  total_score: number;
  fit_category: string;
  summary: string;
  recommended_action: string;
  generic_flags: Array<{ code?: string; message?: string }>;
  missing_information: string[];
  created_at: string;
};

type BriefRun = {
  id: string;
  created_at: string;
  model: string;
  output: {
    professor_summary?: string;
    possible_email_angle?: string;
    recommended_action?: string;
    connection_credibility?: string;
    facts?: string[];
    interpretations?: string[];
    questions_requiring_verification?: string[];
    risks_of_contacting?: string[];
    sources_used?: string[];
  };
};

export function ProfessorDetailClient({
  professor,
  analyses,
  briefs,
  openAIConfigured,
}: {
  professor: {
    id: string;
    full_name: string;
    lab_name: string;
    email: string;
    faculty_profile_url: string;
    relevant_papers: string;
    fit_score: number | null;
    fit_category: FitCategory;
    generic_fit_warning: boolean;
    outreach_stage: string;
    recommended_email_angle: string;
    risks: string;
    universities?: { name: string } | null;
  };
  analyses: Analysis[];
  briefs: BriefRun[];
  openAIConfigured: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    analyzeProfessorFitAction,
    {} as ActionState,
  );
  const [briefState, briefAction, briefPending] = useActionState(
    generateProfessorBriefAction,
    {} as ActionState,
  );

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="panel-surface space-y-3 p-5 lg:col-span-5">
        <div className="flex flex-wrap gap-2">
          <Badge tone="brand">{professor.outreach_stage}</Badge>
          {professor.fit_score != null && (
            <Badge tone="good">
              {Math.round(professor.fit_score)} · {fitCategoryLabel(professor.fit_category)}
            </Badge>
          )}
          {professor.generic_fit_warning && <Badge tone="watch">Generic-fit warning</Badge>}
        </div>
        <h2 className="font-display text-2xl font-semibold">{professor.full_name}</h2>
        <p className="text-sm text-muted-foreground">
          {professor.universities?.name || "No university"}
          {professor.lab_name ? ` · ${professor.lab_name}` : ""}
        </p>
        {professor.email && <p className="text-sm">{professor.email}</p>}
        {professor.faculty_profile_url && (
          <a
            href={professor.faculty_profile_url}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-brand"
          >
            Faculty profile
          </a>
        )}
        {professor.relevant_papers && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Relevant papers (user-provided)
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{professor.relevant_papers}</p>
          </div>
        )}
        {professor.risks && (
          <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning">
            {professor.risks}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Fit scores are organizational estimates — never admission probabilities. Never invent
          papers, openings, or funding.
        </p>
      </div>

      <form action={formAction} className="panel-surface space-y-3 p-5 lg:col-span-7">
        <h3 className="text-sm font-semibold">Fit analyzer</h3>
        <input type="hidden" name="professor_id" value={professor.id} />
        <textarea
          name="connection_paragraph"
          rows={3}
          required
          placeholder="Why this professor specifically? Name verified work."
          defaultValue={professor.recommended_email_angle || ""}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
        />
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          {(
            [
              ["research_fit", "Research fit"],
              ["funding_activity", "Funding/activity"],
              ["competitiveness", "Competitiveness"],
              ["response_probability", "Response prob."],
              ["evidence_quality", "Evidence quality"],
            ] as const
          ).map(([name, label]) => (
            <label key={name} className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </span>
              <input
                name={name}
                type="number"
                min={0}
                max={100}
                defaultValue={50}
                className="h-10 w-full rounded-lg border border-border bg-card px-2 text-sm outline-none ring-brand focus:ring-2"
              />
            </label>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ["mentioned_paper_or_project", "Mentions specific paper/project"],
              ["examined_recent_work", "Examined recent work"],
              ["applicant_evidence_related", "Applicant evidence is related"],
              ["could_copy_to_many", "Could copy to many professors"],
              ["uses_only_broad_keywords", "Only broad keywords"],
              ["contains_empty_praise", "Empty praise"],
              ["proposes_unsupported_extension", "Unsupported “extend” claim"],
              ["information_outdated", "Outdated/unverified info"],
            ] as const
          ).map(([name, label]) => (
            <label key={name} className="flex items-center gap-2 text-xs">
              <input name={name} type="checkbox" />
              {label}
            </label>
          ))}
        </div>
        <textarea
          name="sources"
          rows={2}
          placeholder="Source URLs (one per line) — required for factual claims"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
        />
        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        {state.success && <p className="text-sm text-success">{state.success}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "Analyzing…" : "Run fit + generic check"}
        </Button>
      </form>

      <div className="panel-surface p-5 lg:col-span-12">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">AI research brief</h3>
            <p className="text-xs text-muted-foreground">
              Uses only stored profile + professor fields. Never invents papers or openings.
            </p>
          </div>
          <form action={briefAction}>
            <input type="hidden" name="professor_id" value={professor.id} />
            <Button type="submit" disabled={briefPending || !openAIConfigured}>
              {briefPending ? "Generating…" : "Generate brief"}
            </Button>
          </form>
        </div>
        {!openAIConfigured && (
          <p className="mb-3 text-sm text-warning">
            Add OPENAI_API_KEY (and optional OPENAI_MODEL) to .env.local to enable briefs.
          </p>
        )}
        {briefState.error && <p className="mb-3 text-sm text-danger">{briefState.error}</p>}
        {briefState.success && (
          <p className="mb-3 text-sm text-success">{briefState.success}</p>
        )}
        {briefs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No AI briefs yet.</p>
        ) : (
          <ul className="space-y-3">
            {briefs.map((brief) => (
              <li key={brief.id} className="rounded-xl border border-border px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="brand">{brief.model}</Badge>
                  <Badge tone="neutral">
                    {brief.output.connection_credibility || "credibility n/a"}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(brief.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium">
                  {brief.output.professor_summary}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Angle: {brief.output.possible_email_angle}
                </p>
                <p className="mt-1 text-sm">{brief.output.recommended_action}</p>
                {(brief.output.facts || []).length > 0 && (
                  <div className="mt-2">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      Facts
                    </p>
                    <ul className="list-disc pl-5 text-xs">
                      {(brief.output.facts || []).map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {(brief.output.interpretations || []).length > 0 && (
                  <div className="mt-2">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      Interpretations
                    </p>
                    <ul className="list-disc pl-5 text-xs">
                      {(brief.output.interpretations || []).map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel-surface p-5 lg:col-span-12">
        <h3 className="mb-3 text-sm font-semibold">Analysis history</h3>
        {analyses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No analyses yet.</p>
        ) : (
          <ul className="space-y-3">
            {analyses.map((a) => (
              <li key={a.id} className="rounded-xl border border-border px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="brand">{Math.round(a.total_score)}</Badge>
                  <Badge tone="neutral">{a.fit_category}</Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(a.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-sm">{a.summary}</p>
                <p className="mt-1 text-sm text-muted-foreground">{a.recommended_action}</p>
                {a.generic_flags?.length > 0 && (
                  <ul className="mt-2 list-disc pl-5 text-xs text-warning">
                    {a.generic_flags.map((f, i) => (
                      <li key={`${a.id}-${i}`}>{f.message || f.code}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
