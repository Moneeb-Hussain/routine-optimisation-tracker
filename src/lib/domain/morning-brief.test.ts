import { describe, expect, it } from "vitest";
import { buildRuleMorningBrief } from "@/lib/domain/morning-brief";

describe("buildRuleMorningBrief", () => {
  it("reduces workload guidance when sleep is short", () => {
    const brief = buildRuleMorningBrief({
      firstName: "Moneeb",
      primaryGoal: "Finish Chen lab brief",
      mustDoTitles: ["Research paper", "Draft angle"],
      followUpLabel: null,
      deadlineLabel: null,
      sleepHours: 5.5,
      sleepTarget: 7.5,
      energyLevel: 2,
      interviewNextTitle: null,
      deepWorkTargetMinutes: 120,
    });

    expect(brief.sleepAwareWorkload.toLowerCase()).toContain("sleep");
    expect(brief.avoidToday.toLowerCase()).toContain("avoid");
    expect(brief.topTasks).toHaveLength(3);
  });
});
