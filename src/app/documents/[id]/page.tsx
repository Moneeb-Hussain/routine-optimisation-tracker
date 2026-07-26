import { AppShell } from "@/components/layout/app-shell";
import { DocumentDetailClient } from "@/components/documents/document-detail-client";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isSupabaseConfigured()) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: document } = await supabase
    .from("documents")
    .select(
      "id, title, document_type, file_name, embedding_status, is_active, notes, active_version, storage_path",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!document) notFound();

  const [{ data: version }, { data: profile }] = await Promise.all([
    supabase
      .from("document_versions")
      .select("id, version, extracted_text, change_log")
      .eq("document_id", id)
      .eq("version", document.active_version)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select(
        "full_name, degree, university, cgpa, ielts_academic, research_interests, strongest_project, achievements",
      )
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const { data: signed } = await supabase.storage
    .from("documents")
    .createSignedUrl(document.storage_path, 60 * 10);

  return (
    <AppShell title={document.title} subtitle="Private document detail">
      <div className="mb-4 text-sm">
        <Link href="/documents" className="font-semibold text-brand">
          ← Back to vault
        </Link>
      </div>
      <DocumentDetailClient
        document={document}
        version={version}
        signedUrl={signed?.signedUrl || null}
        profile={
          profile
            ? {
                ...profile,
                research_interests: Array.isArray(profile.research_interests)
                  ? profile.research_interests
                  : [],
                strongest_project:
                  profile.strongest_project &&
                  typeof profile.strongest_project === "object"
                    ? (profile.strongest_project as {
                        name: string;
                        bullets: string[];
                      })
                    : { name: "", bullets: [] },
                achievements: Array.isArray(profile.achievements)
                  ? profile.achievements
                  : [],
              }
            : null
        }
      />
    </AppShell>
  );
}
