export type MorningBriefInput = {
  firstName: string;
  primaryGoal: string;
  mustDoTitles: string[];
  followUpLabel: string | null;
  deadlineLabel: string | null;
  sleepHours: number | null;
  sleepTarget: number;
  energyLevel: number | null;
  interviewNextTitle: string | null;
  deepWorkTargetMinutes: number;
};

export type MorningBrief = {
  primaryGoal: string;
  topTasks: string[];
  importantDeadline: string;
  followUpDue: string;
  deepWorkBlock: string;
  interviewOrLearningAction: string;
  sleepAwareWorkload: string;
  avoidToday: string;
  motivation: string;
  source: "rule" | "ai" | "hybrid";
};

/**
 * Deterministic morning brief — works without OpenAI.
 * Sleep-aware: reduces workload guidance when rest is short.
 */
export function buildRuleMorningBrief(input: MorningBriefInput): MorningBrief {
  const sleepShort =
    input.sleepHours != null && input.sleepHours < input.sleepTarget - 1;

  const topTasks = input.mustDoTitles.slice(0, 3);
  while (topTasks.length < 3) {
    topTasks.push(
      topTasks.length === 0
        ? "Set today’s primary admissions goal"
        : topTasks.length === 1
          ? "Schedule one deep-work block"
          : "Log energy and confirm follow-ups",
    );
  }

  const workload = sleepShort
    ? `Sleep was ${input.sleepHours}h (target ${input.sleepTarget}h). Keep today to 1–2 high-impact tasks and protect recovery — do not stack late-night work.`
    : `Energy looks manageable. Protect a ${input.deepWorkTargetMinutes}-minute deep-work block for the primary goal.`;

  return {
    primaryGoal:
      input.primaryGoal ||
      "Define one admissions-moving outcome for today before opening email.",
    topTasks,
    importantDeadline: input.deadlineLabel || "No major deadline flagged — still advance outreach evidence.",
    followUpDue: input.followUpLabel || "No follow-up due — optionally research one strong-fit professor.",
    deepWorkBlock: sleepShort
      ? "One protected 45–60 minute focus block on the single highest-impact task."
      : `Aim for a focused ${Math.min(90, input.deepWorkTargetMinutes)}-minute deep-work block this morning.`,
    interviewOrLearningAction:
      input.interviewNextTitle ||
      "Complete one interview-prep or learning item (even 20 minutes counts).",
    sleepAwareWorkload: workload,
    avoidToday: sleepShort
      ? "Avoid opening many new professor tabs or rewriting the whole CV tonight."
      : "Avoid generic professor emails and low-value busywork that skips must-dos.",
    motivation: `Good morning${input.firstName ? `, ${input.firstName}` : ""}. One verified action beats a crowded list — start with the must-do that moves the US goal.`,
    source: "rule",
  };
}
