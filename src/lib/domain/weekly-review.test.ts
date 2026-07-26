import { describe, expect, it } from "vitest";
import {
  buildWeeklyReviewStats,
  weekStartFromDate,
  weekEndFromStart,
} from "@/lib/domain/weekly-review";
import { buildJourneyStages, journeyOverallPercent } from "@/lib/domain/journey";

describe("weekly-review", () => {
  it("computes completion and must-do rates", () => {
    const stats = buildWeeklyReviewStats({
      weekStart: "2026-07-20",
      weekEnd: "2026-07-26",
      tasks: [
        { scheduled_date: "2026-07-21", status: "done", is_must_do: true },
        { scheduled_date: "2026-07-21", status: "todo", is_must_do: true },
        { scheduled_date: "2026-07-22", status: "done", is_must_do: false },
      ],
      focusMinutes: 120,
      sleepHours: [7, 8],
      outreachSent: 2,
      followUpsPending: 1,
      prepDone: 1,
      prepTotal: 5,
      blockers: ["Generic emails"],
    });
    expect(stats.completionPercent).toBe(67);
    expect(stats.mustDoRate).toBe(50);
    expect(stats.deepWorkHours).toBe(2);
    expect(stats.sleepAverage).toBe(7.5);
    expect(stats.commonBlocker).toContain("Generic");
  });

  it("derives week bounds", () => {
    expect(weekStartFromDate("2026-07-26")).toBe("2026-07-20");
    expect(weekEndFromStart("2026-07-20")).toBe("2026-07-26");
  });
});

describe("journey", () => {
  it("maps goals onto stages", () => {
    const stages = buildJourneyStages([
      { title: "Identify high-fit professors", progress_percent: 40, status: "active" },
      { title: "Prepare for interviews", progress_percent: 100, status: "completed" },
    ]);
    expect(stages.find((s) => s.id === "professors")?.progress).toBe(40);
    expect(stages.find((s) => s.id === "interviews")?.status).toBe("done");
    expect(journeyOverallPercent(stages)).toBeGreaterThan(0);
  });
});
