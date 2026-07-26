import { describe, expect, it } from "vitest";
import { parseStudyPlanHeuristic } from "@/lib/domain/study-plan";

describe("parseStudyPlanHeuristic", () => {
  it("parses Day N lines", () => {
    const plan = parseStudyPlanHeuristic(
      "Day 1: Intro to ROS\nDay 2 - PID control\nDay 3) Sensors lab",
      "robotics",
      60,
    );
    expect(plan.days).toHaveLength(3);
    expect(plan.days[0]?.title).toContain("ROS");
    expect(plan.daily_minutes).toBe(60);
    expect(plan.area).toBe("robotics");
  });

  it("falls back when no day markers", () => {
    const plan = parseStudyPlanHeuristic(
      "Learn kinematics basics carefully\nPractice Jacobian examples",
      "robotics",
      45,
    );
    expect(plan.days.length).toBeGreaterThanOrEqual(1);
  });
});
