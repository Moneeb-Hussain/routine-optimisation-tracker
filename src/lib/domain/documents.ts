export const DOCUMENT_TYPES = [
  "cv",
  "email_template",
  "transcript",
  "degree",
  "ielts",
  "sop",
  "personal_statement",
  "research_statement",
  "project_description",
  "certificate",
  "publication",
  "recommendation_letter",
  "university_requirement",
  "interview_material",
  "course_material",
  "notes",
  "other",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export function documentTypeLabel(type: string): string {
  return type.replace(/_/g, " ");
}

/** Extract plain text from uploads including PDF and DOCX. */
export async function extractTextFromUpload(file: File): Promise<{
  text: string;
  status: "ready" | "skipped" | "partial";
  note: string;
}> {
  const name = file.name.toLowerCase();
  const mime = file.type;
  const buffer = Buffer.from(await file.arrayBuffer());

  const isText =
    mime.startsWith("text/") ||
    name.endsWith(".txt") ||
    name.endsWith(".md") ||
    name.endsWith(".markdown") ||
    name.endsWith(".csv") ||
    name.endsWith(".json");

  if (isText) {
    const text = buffer.toString("utf8");
    return {
      text: text.slice(0, 200_000),
      status: "ready",
      note: "Extracted from text upload.",
    };
  }

  const isDocx =
    name.endsWith(".docx") ||
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  if (isDocx) {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      const text = (result.value || "").trim();
      if (!text) {
        return {
          text: "",
          status: "partial",
          note: "DOCX opened but no text found. Paste text manually if needed.",
        };
      }
      return {
        text: text.slice(0, 200_000),
        status: "ready",
        note: "Extracted from DOCX.",
      };
    } catch {
      return {
        text: "",
        status: "skipped",
        note: "DOCX extraction failed. Paste text on the document page.",
      };
    }
  }

  const isPdf = name.endsWith(".pdf") || mime === "application/pdf";
  if (isPdf) {
    try {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text } = await extractText(pdf, { mergePages: true });
      const cleaned = (text || "").trim();
      if (!cleaned) {
        return {
          text: "",
          status: "partial",
          note: "PDF opened but no extractable text (may be scanned). Paste text manually.",
        };
      }
      return {
        text: cleaned.slice(0, 200_000),
        status: "ready",
        note: "Extracted from PDF.",
      };
    } catch {
      return {
        text: "",
        status: "skipped",
        note: "PDF extraction failed. Paste text on the document page.",
      };
    }
  }

  return {
    text: "",
    status: "skipped",
    note:
      "Binary format stored privately. Paste extracted text on the document page for CV intelligence.",
  };
}

export function chunkText(text: string, chunkSize = 1200): string[] {
  const cleaned = text.replace(/\r\n/g, "\n").trim();
  if (!cleaned) return [];
  const chunks: string[] = [];
  for (let i = 0; i < cleaned.length; i += chunkSize) {
    chunks.push(cleaned.slice(i, i + chunkSize));
  }
  return chunks.slice(0, 40);
}

/** Lightweight keyword retrieval over document chunks (no embeddings required). */
export function rankChunksByQuery(
  chunks: Array<{ content: string; document_title?: string }>,
  query: string,
  limit = 4,
): Array<{ content: string; score: number; document_title?: string }> {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
  if (terms.length === 0) {
    return chunks.slice(0, limit).map((c) => ({ ...c, score: 0 }));
  }

  return chunks
    .map((c) => {
      const hay = c.content.toLowerCase();
      const score = terms.reduce(
        (s, t) => s + (hay.includes(t) ? 1 : 0) + (hay.split(t).length - 1) * 0.25,
        0,
      );
      return { ...c, score };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
