import { describe, expect, it } from "vitest";
import {
  extractJsonObject,
  normalizeDiscoveryPayload,
  parseDiscoveryText,
} from "@/lib/domain/discovery-parse";

describe("discovery-parse", () => {
  it("extracts JSON from markdown fences", () => {
    const raw = extractJsonObject(`Here you go:\n\`\`\`json\n{"summary":"ok","universities":[],"professors":[]}\n\`\`\``);
    expect(raw).toEqual({ summary: "ok", universities: [], professors: [] });
  });

  it("normalizes USA/Canada and messy fields", () => {
    const parsed = normalizeDiscoveryPayload({
      overview: "Strong CV robotics fit",
      schools: [
        {
          university: "MIT",
          country: "United States",
          department: "CSAIL",
          reason: "Robotics + vision labs",
          links: ["https://example.edu"],
          confidence: "High",
        },
      ],
      faculty: [
        {
          full_name: "Jane Doe",
          institution: "University of Toronto",
          country: "Canada",
          lab_name: "Robot Vision Lab",
          why: "Mechatronics overlap",
          sources: [{ url: "https://utoronto.ca/jane" }],
          score: "medium",
        },
      ],
    });

    expect(parsed?.universities[0]).toMatchObject({
      name: "MIT",
      country: "US",
      confidence: "high",
    });
    expect(parsed?.professors[0]).toMatchObject({
      name: "Jane Doe",
      university_name: "University of Toronto",
      country: "CA",
    });
    expect(parsed?.professors[0].evidence_urls).toEqual([
      "https://utoronto.ca/jane",
    ]);
  });

  it("parses prose-wrapped discovery JSON", () => {
    const text = `I searched the web. Results:
{"summary":"fit","universities":[{"name":"CMU","country":"US","why_fit":"RI","evidence_urls":[],"confidence":"high"}],"professors":[{"name":"A B","university_name":"CMU","country":"USA","why_fit":"vision","evidence_urls":["https://x.edu"],"confidence":"med"}]}`;
    const parsed = parseDiscoveryText(text);
    expect(parsed?.universities).toHaveLength(1);
    expect(parsed?.professors[0].country).toBe("US");
    expect(parsed?.professors[0].confidence).toBe("medium");
  });
});
