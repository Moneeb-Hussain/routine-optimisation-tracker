import { z } from "zod";

export const studyPlanDaySchema = z.object({
  day_number: z.number().int().positive(),
  title: z.string(),
  description: z.string().default(""),
  estimated_minutes: z.number().int().positive().default(60),
});

export const studyPlanParseSchema = z.object({
  title: z.string(),
  area: z.string(),
  daily_minutes: z.number().int().positive().default(60),
  days: z.array(studyPlanDaySchema).min(1),
});

export type StudyPlanParse = z.infer<typeof studyPlanParseSchema>;

/** Heuristic fallback when OpenAI is unavailable. */
export function parseStudyPlanHeuristic(
  text: string,
  fallbackArea: string,
  dailyMinutes: number,
): StudyPlanParse {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const days: StudyPlanParse["days"] = [];
  const dayRe =
    /^(?:day|d)\s*[-:]?\s*(\d+)\s*[-:.)]\s*(.+)$/i;

  for (const line of lines) {
    const m = line.match(dayRe);
    if (m) {
      days.push({
        day_number: Number(m[1]),
        title: m[2].trim().slice(0, 200),
        description: "",
        estimated_minutes: dailyMinutes,
      });
    }
  }

  if (days.length === 0) {
    // Split into chunks as pseudo-days (max 30)
    const chunks = lines.filter((l) => l.length > 8).slice(0, 30);
    chunks.forEach((title, i) => {
      days.push({
        day_number: i + 1,
        title: title.slice(0, 200),
        description: "",
        estimated_minutes: dailyMinutes,
      });
    });
  }

  if (days.length === 0) {
    days.push({
      day_number: 1,
      title: "Review uploaded study material",
      description: "Document had no clear day markers — start with a full read-through.",
      estimated_minutes: dailyMinutes,
    });
  }

  return {
    title: `${fallbackArea || "Study"} day-wise plan`,
    area: fallbackArea || "general",
    daily_minutes: dailyMinutes,
    days,
  };
}
