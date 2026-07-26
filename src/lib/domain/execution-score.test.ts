import { describe, expect, it } from "vitest";
import {
  calculateExecutionScore,
  hoursBetween,
} from "@/lib/domain/execution-score";

describe("calculateExecutionScore", () => {
  it("weights must-dos more heavily than optional completion alone", () => {
    const missedMustDos = calculateExecutionScore({
      mustDoTotal: 2,
      mustDoCompleted: 0,
      weightedTaskCompletion: 100,
      deepWorkMinutes: 120,
      deepWorkTargetMinutes: 120,
      primaryGoalProgress: 80,
      scheduleAdherence: 80,
      reviewCompleted: true,
      sleepHours: 8,
      sleepTargetHours: 7.5,
    });

    const completedMustDos = calculateExecutionScore({
      mustDoTotal: 2,
      mustDoCompleted: 2,
      weightedTaskCompletion: 100,
      deepWorkMinutes: 120,
      deepWorkTargetMinutes: 120,
      primaryGoalProgress: 80,
      scheduleAdherence: 80,
      reviewCompleted: true,
      sleepHours: 8,
      sleepTargetHours: 7.5,
    });

    expect(completedMustDos.total - missedMustDos.total).toBe(30);
    expect(completedMustDos.total).toBeGreaterThan(missedMustDos.total);
  });

  it("treats missing sleep as full readiness, not punishment", () => {
    const withSleep = calculateExecutionScore({
      mustDoTotal: 1,
      mustDoCompleted: 1,
      weightedTaskCompletion: 80,
      deepWorkMinutes: 90,
      deepWorkTargetMinutes: 120,
      primaryGoalProgress: 70,
      scheduleAdherence: 70,
      reviewCompleted: true,
      sleepHours: null,
      sleepTargetHours: 7.5,
    });

    const sleepItem = withSleep.breakdown.find((b) => b.label === "Sleep readiness");
    expect(sleepItem?.value).toBe(100);
  });
});

describe("hoursBetween", () => {
  it("computes duration across midnight", () => {
    const start = new Date("2026-07-24T23:00:00");
    const end = new Date("2026-07-25T06:30:00");
    expect(hoursBetween(start, end)).toBe(7.5);
  });
});
