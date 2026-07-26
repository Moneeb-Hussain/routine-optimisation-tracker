export type ScoreBreakdownItem = {
  label: string;
  weight: number;
  value: number;
};

export type ExecutionScoreInput = {
  mustDoTotal: number;
  mustDoCompleted: number;
  /** 0–100 weighted completion across all scheduled tasks */
  weightedTaskCompletion: number;
  deepWorkMinutes: number;
  deepWorkTargetMinutes: number;
  /** 0–100 self/plan estimate of primary goal progress */
  primaryGoalProgress: number;
  /** 0–100 how well the day followed the planned blocks */
  scheduleAdherence: number;
  reviewCompleted: boolean;
  sleepHours: number | null;
  sleepTargetHours: number;
};

/**
 * Daily Execution Score (0–100).
 * Must-dos outweigh optional busywork. Sleep adjusts readiness — never punishes.
 */
export function calculateExecutionScore(input: ExecutionScoreInput): {
  total: number;
  breakdown: ScoreBreakdownItem[];
} {
  const mustDo =
    input.mustDoTotal === 0
      ? 100
      : Math.round((input.mustDoCompleted / input.mustDoTotal) * 100);

  const deepWork = Math.min(
    100,
    Math.round((input.deepWorkMinutes / Math.max(input.deepWorkTargetMinutes, 1)) * 100),
  );

  const review = input.reviewCompleted ? 100 : 0;

  let sleepReadiness = 100;
  if (input.sleepHours != null) {
    const ratio = input.sleepHours / Math.max(input.sleepTargetHours, 1);
    if (ratio >= 0.95) sleepReadiness = 100;
    else if (ratio >= 0.85) sleepReadiness = 85;
    else if (ratio >= 0.7) sleepReadiness = 70;
    else sleepReadiness = 55; // readiness signal, not a punishment cliff
  }

  const breakdown: ScoreBreakdownItem[] = [
    { label: "Must-do completion", weight: 30, value: clamp(mustDo) },
    {
      label: "Weighted task completion",
      weight: 20,
      value: clamp(input.weightedTaskCompletion),
    },
    { label: "Deep-work completion", weight: 15, value: clamp(deepWork) },
    {
      label: "Primary goal progress",
      weight: 15,
      value: clamp(input.primaryGoalProgress),
    },
    {
      label: "Schedule adherence",
      weight: 10,
      value: clamp(input.scheduleAdherence),
    },
    { label: "Review consistency", weight: 5, value: clamp(review) },
    { label: "Sleep readiness", weight: 5, value: clamp(sleepReadiness) },
  ];

  const total = Math.round(
    breakdown.reduce((sum, item) => sum + (item.value * item.weight) / 100, 0),
  );

  return { total: clamp(total), breakdown };
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function hoursBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.round((ms / (1000 * 60 * 60)) * 100) / 100;
}
