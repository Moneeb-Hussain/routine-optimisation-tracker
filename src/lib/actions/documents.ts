"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import {
  DOCUMENT_TYPES,
  chunkText,
  extractTextFromUpload,
} from "@/lib/domain/documents";
import { embedDocumentChunks } from "@/lib/ai/embed-chunks";

export type ActionState = { error?: string; success?: string; documentId?: string };

async function requireUser() {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured." as const, supabase: null, user: null };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in." as const, supabase: null, user: null };
  }
  return { error: null, supabase, user };
}

export async function uploadDocumentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error || "Unauthorized" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }
  if (file.size > 20 * 1024 * 1024) {
    return { error: "File must be 20MB or smaller." };
  }

  const title = String(formData.get("title") || file.name).trim();
  const documentType = String(formData.get("document_type") || "other");
  const notes = String(formData.get("notes") || "");
  const tags = String(formData.get("tags") || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (!DOCUMENT_TYPES.includes(documentType as (typeof DOCUMENT_TYPES)[number])) {
    return { error: "Invalid document type." };
  }

  const documentId = crypto.randomUUID();
  const safeName = file.name.replace(/[^\w.\-()+ ]+/g, "_");
  const storagePath = `${ctx.user.id}/${documentId}/${safeName}`;

  const { error: uploadError } = await ctx.supabase.storage
    .from("documents")
    .upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    return {
      error: `${uploadError.message}. If the bucket is missing, run migration 0003_phase2_documents.sql.`,
    };
  }

  const extracted = await extractTextFromUpload(file);

  const { error: docError } = await ctx.supabase.from("documents").insert({
    id: documentId,
    user_id: ctx.user.id,
    document_type: documentType,
    title,
    file_name: file.name,
    storage_path: storagePath,
    mime_type: file.type || "application/octet-stream",
    file_size_bytes: file.size,
    tags,
    notes,
    active_version: 1,
    embedding_status: "pending",
    is_active: true,
  });

  if (docError) {
    await ctx.supabase.storage.from("documents").remove([storagePath]);
    return { error: docError.message };
  }

  const { data: version, error: versionError } = await ctx.supabase
    .from("document_versions")
    .insert({
      user_id: ctx.user.id,
      document_id: documentId,
      version: 1,
      file_name: file.name,
      storage_path: storagePath,
      mime_type: file.type || "application/octet-stream",
      file_size_bytes: file.size,
      extracted_text: extracted.text,
      change_log: extracted.note,
      is_active: true,
    })
    .select("id")
    .single();

  if (versionError) return { error: versionError.message };

  const chunks = chunkText(extracted.text);
  let embeddingStatus: string =
    extracted.status === "ready" ? "ready" : "skipped";

  if (chunks.length && version) {
    await ctx.supabase.from("document_chunks").insert(
      chunks.map((content, chunk_index) => ({
        user_id: ctx.user!.id,
        document_id: documentId,
        version_id: version.id,
        chunk_index,
        content,
        token_estimate: Math.ceil(content.length / 4),
      })),
    );

    embeddingStatus = await embedDocumentChunks({
      supabase: ctx.supabase,
      userId: ctx.user.id,
      documentId,
      versionId: version.id,
      chunks,
    });
  }

  await ctx.supabase
    .from("documents")
    .update({ embedding_status: embeddingStatus })
    .eq("id", documentId)
    .eq("user_id", ctx.user.id);

  revalidatePath("/documents");
  revalidatePath(`/documents/${documentId}`);
  return {
    success:
      embeddingStatus === "embedded"
        ? "Document uploaded and embedded for semantic coach search."
        : "Document uploaded to private storage.",
    documentId,
  };
}

export async function updateDocumentTextAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error || "Unauthorized" };

  const documentId = String(formData.get("document_id") || "");
  const extractedText = String(formData.get("extracted_text") || "");
  if (!documentId) return { error: "Document id required." };

  const { data: doc } = await ctx.supabase
    .from("documents")
    .select("id, active_version")
    .eq("id", documentId)
    .eq("user_id", ctx.user.id)
    .maybeSingle();

  if (!doc) return { error: "Document not found." };

  const { data: version } = await ctx.supabase
    .from("document_versions")
    .select("id")
    .eq("document_id", documentId)
    .eq("version", doc.active_version)
    .eq("user_id", ctx.user.id)
    .maybeSingle();

  if (!version) return { error: "Active version not found." };

  const { error } = await ctx.supabase
    .from("document_versions")
    .update({
      extracted_text: extractedText.slice(0, 200_000),
      change_log: "Extracted text updated manually.",
    })
    .eq("id", version.id)
    .eq("user_id", ctx.user.id);

  if (error) return { error: error.message };

  await ctx.supabase.from("document_chunks").delete().eq("version_id", version.id);

  const chunks = chunkText(extractedText);
  let embeddingStatus = extractedText.trim() ? "ready" : "skipped";

  if (chunks.length) {
    await ctx.supabase.from("document_chunks").insert(
      chunks.map((content, chunk_index) => ({
        user_id: ctx.user!.id,
        document_id: documentId,
        version_id: version.id,
        chunk_index,
        content,
        token_estimate: Math.ceil(content.length / 4),
      })),
    );

    embeddingStatus = await embedDocumentChunks({
      supabase: ctx.supabase,
      userId: ctx.user.id,
      documentId,
      versionId: version.id,
      chunks,
    });
  }

  await ctx.supabase
    .from("documents")
    .update({
      embedding_status: embeddingStatus,
    })
    .eq("id", documentId)
    .eq("user_id", ctx.user.id);

  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/documents");
  return {
    success:
      embeddingStatus === "embedded"
        ? "Text saved and re-embedded for coach search."
        : "Extracted text saved. CV intelligence can use it now.",
  };
}

export async function reembedDocumentAction(documentId: string): Promise<ActionState> {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error || "Unauthorized" };
  if (!documentId) return { error: "Document id required." };

  const { data: doc } = await ctx.supabase
    .from("documents")
    .select("id, active_version")
    .eq("id", documentId)
    .eq("user_id", ctx.user.id)
    .maybeSingle();
  if (!doc) return { error: "Document not found." };

  const { data: version } = await ctx.supabase
    .from("document_versions")
    .select("id, extracted_text")
    .eq("document_id", documentId)
    .eq("version", doc.active_version)
    .eq("user_id", ctx.user.id)
    .maybeSingle();
  if (!version) return { error: "Active version not found." };

  const text = version.extracted_text || "";
  await ctx.supabase.from("document_chunks").delete().eq("version_id", version.id);
  const chunks = chunkText(text);
  if (!chunks.length) {
    await ctx.supabase
      .from("documents")
      .update({ embedding_status: "skipped" })
      .eq("id", documentId);
    return { error: "No extracted text to embed. Paste text first." };
  }

  await ctx.supabase.from("document_chunks").insert(
    chunks.map((content, chunk_index) => ({
      user_id: ctx.user!.id,
      document_id: documentId,
      version_id: version.id,
      chunk_index,
      content,
      token_estimate: Math.ceil(content.length / 4),
    })),
  );

  const status = await embedDocumentChunks({
    supabase: ctx.supabase,
    userId: ctx.user.id,
    documentId,
    versionId: version.id,
    chunks,
  });

  await ctx.supabase
    .from("documents")
    .update({ embedding_status: status })
    .eq("id", documentId)
    .eq("user_id", ctx.user.id);

  revalidatePath(`/documents/${documentId}`);
  return {
    success:
      status === "embedded"
        ? "Document re-embedded."
        : `Embedding status: ${status}. Check OPENAI_API_KEY and migration 0006.`,
  };
}

export async function deactivateDocumentAction(documentId: string) {
  const ctx = await requireUser();
  if (ctx.error || !ctx.supabase || !ctx.user) return;

  await ctx.supabase
    .from("documents")
    .update({ is_active: false })
    .eq("id", documentId)
    .eq("user_id", ctx.user.id);

  revalidatePath("/documents");
  revalidatePath(`/documents/${documentId}`);
}
