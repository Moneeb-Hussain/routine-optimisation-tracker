import { z } from "zod";

export const discoverySchema = z.object({
  summary: z.string().default(""),
  universities: z.array(
    z.object({
      name: z.string().min(1),
      country: z.enum(["US", "CA"]),
      department_or_lab: z.string().default(""),
      why_fit: z.string().default(""),
      evidence_urls: z.array(z.string()).default([]),
      confidence: z.enum(["high", "medium", "low"]).default("medium"),
    }),
  ),
  professors: z.array(
    z.object({
      name: z.string().min(1),
      university_name: z.string().default(""),
      country: z.enum(["US", "CA"]),
      department_or_lab: z.string().default(""),
      why_fit: z.string().default(""),
      evidence_urls: z.array(z.string()).default([]),
      confidence: z.enum(["high", "medium", "low"]).default("medium"),
    }),
  ),
});

export type DiscoveryPayload = z.infer<typeof discoverySchema>;

function normalizeCountry(value: unknown): "US" | "CA" | null {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\./g, "");
  if (!raw) return null;
  if (
    raw === "us" ||
    raw === "usa" ||
    raw === "u s" ||
    raw === "u s a" ||
    raw.includes("united states") ||
    raw === "america"
  ) {
    return "US";
  }
  if (
    raw === "ca" ||
    raw === "can" ||
    raw.includes("canada") ||
    raw === "canadian"
  ) {
    return "CA";
  }
  return null;
}

function normalizeConfidence(value: unknown): "high" | "medium" | "low" {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  if (raw === "high" || raw === "h" || raw === "3") return "high";
  if (raw === "low" || raw === "l" || raw === "1") return "low";
  return "medium";
}

function asStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object" && "url" in item) {
          return String((item as { url?: unknown }).url || "").trim();
        }
        return String(item).trim();
      })
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return "";
}

/** Pull the largest JSON object from model text (code fences / prose OK). */
export function extractJsonObject(text: string): unknown | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence?.[1]?.trim() || trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    // continue
  }

  const start = candidate.indexOf("{");
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(candidate.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function normalizeItem(
  item: unknown,
  kind: "university" | "professor",
): Record<string, unknown> | null {
  if (!item || typeof item !== "object") return null;
  const obj = item as Record<string, unknown>;

  const name = pickString(obj, [
    "name",
    "university",
    "university_name",
    "professor",
    "professor_name",
    "full_name",
    "title",
  ]);
  if (!name) return null;

  const country =
    normalizeCountry(obj.country) ||
    normalizeCountry(obj.nation) ||
    normalizeCountry(obj.location) ||
    "US";

  const university_name =
    kind === "professor"
      ? pickString(obj, [
          "university_name",
          "university",
          "institution",
          "school",
          "affiliation",
        ]) || name
      : name;

  return {
    name: kind === "university" ? university_name || name : name,
    university_name: kind === "professor" ? university_name : university_name,
    country,
    department_or_lab: pickString(obj, [
      "department_or_lab",
      "department",
      "lab",
      "lab_name",
      "group",
      "research_group",
    ]),
    why_fit: pickString(obj, [
      "why_fit",
      "why",
      "rationale",
      "fit",
      "reason",
      "match_reason",
      "summary",
    ]),
    evidence_urls: asStringArray(
      obj.evidence_urls ?? obj.sources ?? obj.urls ?? obj.links ?? obj.source_urls,
    ),
    confidence: normalizeConfidence(obj.confidence ?? obj.score ?? obj.rank),
  };
}

/** Coerce messy model JSON into the discovery schema shape. */
export function normalizeDiscoveryPayload(raw: unknown): DiscoveryPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  const universitiesRaw = Array.isArray(obj.universities)
    ? obj.universities
    : Array.isArray(obj.schools)
      ? obj.schools
      : Array.isArray(obj.university_recommendations)
        ? obj.university_recommendations
        : [];

  const professorsRaw = Array.isArray(obj.professors)
    ? obj.professors
    : Array.isArray(obj.faculty)
      ? obj.faculty
      : Array.isArray(obj.professor_recommendations)
        ? obj.professor_recommendations
        : [];

  const universities = universitiesRaw
    .map((u) => normalizeItem(u, "university"))
    .filter(Boolean) as Array<Record<string, unknown>>;

  const professors = professorsRaw
    .map((p) => normalizeItem(p, "professor"))
    .filter(Boolean) as Array<Record<string, unknown>>;

  const summary =
    pickString(obj, ["summary", "overview", "query_summary", "notes"]) ||
    `Found ${universities.length} universities and ${professors.length} professors.`;

  const parsed = discoverySchema.safeParse({
    summary,
    universities,
    professors,
  });

  if (!parsed.success) return null;
  if (parsed.data.universities.length === 0 && parsed.data.professors.length === 0) {
    return null;
  }
  return parsed.data;
}

export function parseDiscoveryText(text: string): DiscoveryPayload | null {
  const extracted = extractJsonObject(text);
  if (!extracted) return null;
  return normalizeDiscoveryPayload(extracted);
}
