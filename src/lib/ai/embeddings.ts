import OpenAI from "openai";
import {
  getOpenAIEmbeddingModel,
  isOpenAIConfigured,
} from "@/lib/env";

export async function embedTexts(
  texts: string[],
): Promise<number[][] | null> {
  if (!isOpenAIConfigured() || texts.length === 0) return null;

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = getOpenAIEmbeddingModel();

  // OpenAI allows batching; keep chunks modest
  const cleaned = texts.map((t) => t.replace(/\s+/g, " ").trim().slice(0, 8000));
  const response = await client.embeddings.create({
    model,
    input: cleaned,
  });

  return response.data
    .sort((a, b) => a.index - b.index)
    .map((row) => row.embedding);
}

export async function embedQuery(query: string): Promise<number[] | null> {
  const vectors = await embedTexts([query]);
  return vectors?.[0] ?? null;
}

/** Format for pgvector / PostgREST */
export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
