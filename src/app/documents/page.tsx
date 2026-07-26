import { AppShell } from "@/components/layout/app-shell";
import {
  DocumentsClient,
  type DocumentRow,
} from "@/components/documents/documents-client";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function DocumentsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <AppShell title="Document Vault" subtitle="Private CV, SOP, and templates">
        <div className="panel-surface p-6">
          <Badge tone="watch">Setup required</Badge>
        </div>
      </AppShell>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <AppShell title="Document Vault" subtitle="Private CV, SOP, and templates">
        <div className="panel-surface p-6 text-sm">
          <Link href="/login" className="font-semibold text-brand">
            Sign in
          </Link>
        </div>
      </AppShell>
    );
  }

  const { data, error } = await supabase
    .from("documents")
    .select("id, title, document_type, file_name, embedding_status, is_active, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <AppShell title="Document Vault" subtitle="Private uploads with signed access">
      {error && (
        <div className="mb-4 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
          {error.message}. Run{" "}
          <code className="font-mono">supabase/migrations/0003_phase2_documents.sql</code> in
          SQL Editor.
        </div>
      )}
      <DocumentsClient documents={(data || []) as DocumentRow[]} />
    </AppShell>
  );
}
