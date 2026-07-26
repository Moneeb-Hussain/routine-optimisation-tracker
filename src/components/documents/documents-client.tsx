"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  uploadDocumentAction,
  type ActionState,
} from "@/lib/actions/documents";
import { DOCUMENT_TYPES, documentTypeLabel } from "@/lib/domain/documents";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type DocumentRow = {
  id: string;
  title: string;
  document_type: string;
  file_name: string;
  embedding_status: string;
  is_active: boolean;
  created_at: string;
};

export function DocumentsClient({ documents }: { documents: DocumentRow[] }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    uploadDocumentAction,
    {} as ActionState,
  );

  useEffect(() => {
    if (state.documentId) {
      router.push(`/documents/${state.documentId}`);
    }
  }, [state.documentId, router]);

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <form action={formAction} className="panel-surface space-y-3 p-5 lg:col-span-4">
        <h2 className="text-sm font-semibold">Upload document</h2>
        <p className="text-xs text-muted-foreground">
          Private Supabase Storage. Text, Markdown, PDF, and DOCX auto-extract when possible.
          Scanned PDFs may need a paste on the document page for CV intelligence.
        </p>
        <input
          name="title"
          placeholder="Title (optional)"
          className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
        />
        <select
          name="document_type"
          defaultValue="cv"
          className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
        >
          {DOCUMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {documentTypeLabel(type)}
            </option>
          ))}
        </select>
        <input
          name="tags"
          placeholder="Tags (comma-separated)"
          className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
        />
        <input
          name="file"
          type="file"
          required
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
        />
        <textarea
          name="notes"
          rows={2}
          placeholder="Notes"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
        />
        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        {state.success && <p className="text-sm text-success">{state.success}</p>}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Uploading…" : "Upload privately"}
        </Button>
      </form>

      <div className="panel-surface p-5 lg:col-span-8">
        <h2 className="mb-3 text-sm font-semibold">Vault</h2>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-start justify-between gap-3 py-3">
                <div>
                  <Link
                    href={`/documents/${doc.id}`}
                    className="text-sm font-semibold text-foreground hover:text-brand"
                  >
                    {doc.title}
                  </Link>
                  <p className="text-[11px] text-muted-foreground">
                    {documentTypeLabel(doc.document_type)} · {doc.file_name}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Badge tone={doc.embedding_status === "ready" ? "good" : "neutral"}>
                    {doc.embedding_status}
                  </Badge>
                  {!doc.is_active && <Badge tone="watch">inactive</Badge>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
