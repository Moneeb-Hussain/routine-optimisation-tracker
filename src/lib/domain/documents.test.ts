import { describe, expect, it } from "vitest";
import { chunkText, rankChunksByQuery } from "@/lib/domain/documents";

describe("documents helpers", () => {
  it("chunks text", () => {
    const chunks = chunkText("a".repeat(2500), 1000);
    expect(chunks.length).toBe(3);
  });

  it("ranks chunks by query terms", () => {
    const ranked = rankChunksByQuery(
      [
        { content: "YOLOv4 retail checkout conveyor", document_title: "CV" },
        { content: "visa timeline and travel docs", document_title: "Visa" },
      ],
      "retail computer vision checkout",
      2,
    );
    expect(ranked[0]?.document_title).toBe("CV");
  });
});
