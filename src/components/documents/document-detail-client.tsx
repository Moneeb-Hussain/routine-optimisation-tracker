"use client";

import { useActionState, useState, useTransition } from "react";
import {
  deactivateDocumentAction,
  reembedDocumentAction,
  updateDocumentTextAction,
  type ActionState,
} from "@/lib/actions/documents";
import { analyzeCvAgainstProfile } from "@/lib/domain/cv-intelligence";
import { documentTypeLabel } from "@/lib/domain/documents";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ProfileLite = {
  full_name: string;
  degree: string;
  university: string;
  cgpa: number | null;
  ielts_academic: number | null;
  research_interests: string[];
  strongest_project: { name: string; bullets: string[] };
  achievements: string[];
};

export function DocumentDetailClient({
  document,
  version,
  signedUrl,
  profile,
}: {
  document: {
    id: string;
    title: string;
    document_type: string;
    file_name: string;
    embedding_status: string;
    is_active: boolean;
    notes: string;
  };
  version: {
    id: string;
    version: number;
    extracted_text: string;
    change_log: string;
  } | null;
  signedUrl: string | null;
  profile: ProfileLite | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateDocumentTextAction,
    {} as ActionState,
  );
  const [deactivating, startDeactivate] = useTransition();
  const [reembedding, startReembed] = useTransition();
  const [reembedMsg, setReembedMsg] = useState<string | null>(null);

  const analysis =
    document.document_type === "cv" && version?.extracted_text && profile
      ? analyzeCvAgainstProfile({
          cvText: version.extracted_text,
          profile: {
            ...profile,
            research_interests: profile.research_interests || [],
            strongest_project: profile.strongest_project || { name: "", bullets: [] },
            achievements: profile.achievements || [],
          },
        })
      : null;

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="panel-surface space-y-3 p-5 lg:col-span-4">
        <div className="flex flex-wrap gap-2">
          <Badge tone="brand">{documentTypeLabel(document.document_type)}</Badge>
          <Badge
            tone={
              document.embedding_status === "embedded" ||
              document.embedding_status === "ready"
                ? "good"
                : "neutral"
            }
          >
            {document.embedding_status}
          </Badge>
          {!document.is_active && <Badge tone="watch">inactive</Badge>}
        </div>
        <h2 className="font-display text-2xl font-semibold">{document.title}</h2>
        <p className="text-sm text-muted-foreground">{document.file_name}</p>
        {document.notes && <p className="text-sm">{document.notes}</p>}
        {signedUrl ? (
          <a
            href={signedUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex text-sm font-semibold text-brand"
          >
            Open signed download
          </a>
        ) : (
          <p className="text-xs text-muted-foreground">Signed URL unavailable.</p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={reembedding}
            onClick={() =>
              startReembed(async () => {
                const res = await reembedDocumentAction(document.id);
                setReembedMsg(res.error || res.success || null);
              })
            }
          >
            {reembedding ? "Embedding…" : "Re-embed for coach"}
          </Button>
          {document.is_active && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={deactivating}
              onClick={() => startDeactivate(() => deactivateDocumentAction(document.id))}
            >
              Deactivate
            </Button>
          )}
        </div>
        {reembedMsg && (
          <p className="text-xs text-muted-foreground">{reembedMsg}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Files stay private. Re-embed after pasting text (needs OPENAI_API_KEY + migration 0006).
        </p>
      </div>

      <form action={formAction} className="panel-surface space-y-3 p-5 lg:col-span-8">
        <h3 className="text-sm font-semibold">Extracted text</h3>
        <input type="hidden" name="document_id" value={document.id} />
        <textarea
          name="extracted_text"
          rows={16}
          defaultValue={version?.extracted_text || ""}
          placeholder="Paste CV / document text here for analysis and retrieval chunks."
          className="w-full rounded-lg border border-border bg-card px-3 py-2 font-mono text-xs outline-none ring-brand focus:ring-2"
        />
        {version?.change_log && (
          <p className="text-xs text-muted-foreground">{version.change_log}</p>
        )}
        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        {state.success && <p className="text-sm text-success">{state.success}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save extracted text"}
        </Button>
      </form>

      {document.document_type === "cv" && (
        <div className="panel-surface space-y-3 p-5 lg:col-span-12">
          <h3 className="text-sm font-semibold">CV intelligence</h3>
          {!analysis ? (
            <p className="text-sm text-muted-foreground">
              Add extracted text (and complete profile onboarding) to compare the CV with your
              stored academic profile.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{analysis.summary}</p>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <ListCard title="Missing / thin sections" items={analysis.missingSections} />
                <ListCard title="Inconsistencies vs profile" items={analysis.inconsistencies} />
                <ListCard title="Claims to verify" items={analysis.unsupportedClaims} />
                <ListCard title="Supported research areas" items={analysis.supportedResearchAreas} />
                <ListCard title="Weakly evidenced areas" items={analysis.weakResearchAreas} />
                <ListCard title="Recommended bullets" items={analysis.recommendedBullets} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-slate-50/70 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">None</p>
      ) : (
        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
