import type { SupabaseClient } from "@supabase/supabase-js";
import { embedTexts, toVectorLiteral } from "@/lib/ai/embeddings";
import { isOpenAIConfigured } from "@/lib/env";

/**
 * After inserting document_chunks rows, embed and store vectors when OpenAI is configured.
 * Returns status for documents.embedding_status.
 */
export async function embedDocumentChunks(params: {
  supabase: SupabaseClient;
  userId: string;
  documentId: string;
  versionId: string;
  chunks: string[];
}): Promise<"embedded" | "ready" | "skipped" | "failed"> {
  const { supabase, userId, documentId, versionId, chunks } = params;

  if (!chunks.length) return "skipped";
  if (!isOpenAIConfigured()) return "ready";

  try {
    const vectors = await embedTexts(chunks);
    if (!vectors || vectors.length !== chunks.length) return "failed";

    // Update each chunk with embedding (PostgREST accepts vector as string)
    for (let i = 0; i < chunks.length; i++) {
      const { error } = await supabase
        .from("document_chunks")
        .update({ embedding: toVectorLiteral(vectors[i]!) })
        .eq("user_id", userId)
        .eq("version_id", versionId)
        .eq("chunk_index", i);

      if (error) {
        // Column may be missing if migration 0006 not applied — keep text ready
        console.error("embed update failed", error.message);
        return "ready";
      }
    }

    await supabase
      .from("documents")
      .update({ embedding_status: "embedded" })
      .eq("id", documentId)
      .eq("user_id", userId);

    return "embedded";
  } catch (err) {
    console.error("embedDocumentChunks", err);
    await supabase
      .from("documents")
      .update({ embedding_status: "failed" })
      .eq("id", documentId)
      .eq("user_id", userId);
    return "failed";
  }
}
