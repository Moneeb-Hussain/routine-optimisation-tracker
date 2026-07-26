"use client";

import { useState, useTransition } from "react";
import {
  runDiscoveryAction,
  importRecommendationAction,
  dismissRecommendationAction,
} from "@/lib/actions/discover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type DiscoveryRec = {
  id: string;
  kind: string;
  country: string;
  name: string;
  university_name: string;
  department_or_lab: string;
  why_fit: string;
  evidence_urls: string[] | unknown;
  confidence: string;
  status: string;
};

export type DiscoveryRun = {
  id: string;
  status: string;
  query_summary: string;
  created_at: string;
  error_message?: string;
};

export function DiscoverClient({
  run,
  recommendations,
}: {
  run: DiscoveryRun | null;
  recommendations: DiscoveryRec[];
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const universities = recommendations.filter(
    (r) => r.kind === "university" && r.status === "suggested",
  );
  const professors = recommendations.filter(
    (r) => r.kind === "professor" && r.status === "suggested",
  );
  const imported = recommendations.filter((r) => r.status === "imported");

  return (
    <div className="space-y-5">
      <div className="panel-surface relative overflow-hidden p-6">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_80%_20%,rgba(14,116,144,0.12),transparent_55%)]" />
        <div className="relative">
          <Badge tone="brand">USA + Canada</Badge>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">
            AI Discover
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Uses your profile + OpenAI web search to suggest universities and professors.
            Verify every link before you email anyone. Never auto-sends outreach.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const res = await runDiscoveryAction();
                  setMsg(res.error || res.success || null);
                })
              }
            >
              {pending ? "Searching…" : "Run discovery"}
            </Button>
            {run && (
              <span className="text-xs text-muted-foreground">
                Last: {run.status} · {new Date(run.created_at).toLocaleString()}
              </span>
            )}
          </div>
          {msg && <p className="mt-3 text-sm text-muted-foreground">{msg}</p>}
          {run?.error_message && (
            <p className="mt-2 text-sm text-danger">{run.error_message}</p>
          )}
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="panel-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Universities to consider</h3>
            <Badge tone="neutral">{universities.length}</Badge>
          </div>
          <ul className="space-y-3">
            {universities.map((r) => (
              <RecCard key={r.id} rec={r} />
            ))}
            {universities.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Run discovery to populate university suggestions.
              </p>
            )}
          </ul>
        </div>

        <div className="panel-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Professors to approach</h3>
            <Badge tone="neutral">{professors.length}</Badge>
          </div>
          <ul className="space-y-3">
            {professors.map((r) => (
              <RecCard key={r.id} rec={r} />
            ))}
            {professors.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Run discovery to populate professor suggestions.
              </p>
            )}
          </ul>
        </div>
      </section>

      {imported.length > 0 && (
        <div className="panel-surface p-5">
          <h3 className="mb-2 text-sm font-semibold">Imported</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {imported.map((r) => (
              <li key={r.id}>
                {r.kind}: {r.name}
                {r.university_name ? ` · ${r.university_name}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function RecCard({ rec }: { rec: DiscoveryRec }) {
  const [pending, start] = useTransition();
  const urls = Array.isArray(rec.evidence_urls)
    ? (rec.evidence_urls as string[])
    : [];

  return (
    <li className="rounded-lg border border-border bg-slate-50/70 px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{rec.name}</p>
          <p className="text-xs text-muted-foreground">
            {rec.kind === "professor" ? rec.university_name : rec.department_or_lab} ·{" "}
            {rec.country}
          </p>
        </div>
        <Badge tone={rec.confidence === "high" ? "good" : "watch"}>
          {rec.confidence}
        </Badge>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground">{rec.why_fit}</p>
      {urls.length > 0 && (
        <ul className="mt-2 space-y-1">
          {urls.slice(0, 3).map((u) => (
            <li key={u}>
              <a
                href={u}
                target="_blank"
                rel="noreferrer"
                className="break-all text-xs font-medium text-brand"
              >
                {u}
              </a>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await importRecommendationAction(rec.id);
            })
          }
        >
          Import
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => start(() => dismissRecommendationAction(rec.id))}
        >
          Dismiss
        </Button>
      </div>
    </li>
  );
}
