export type WeeklyReviewStats = {
  weekStart: string;
  weekEnd: string;
  completionPercent: number;
  mustDoRate: number;
  deepWorkHours: number;
  sleepAverage: number;
  outreachSummary: string;
  interviewSummary: string;
  bestDay: string;
  weakestDay: string;
  commonBlocker: string;
  suggestedAchievement: string;
  suggestedPriorities: string;
};

function dayLabel(isoDate: string) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(
    new Date(`${isoDate}T12:00:00`),
  );
}

export function buildWeeklyReviewStats(input: {
  weekStart: string;
  weekEnd: string;
  tasks: Array<{ scheduled_date: string | null; status: string; is_must_do: boolean }>;
  focusMinutes: number;
  sleepHours: number[];
  outreachSent: number;
  followUpsPending: number;
  prepDone: number;
  prepTotal: number;
  blockers: string[];
}): WeeklyReviewStats {
  const scheduled = input.tasks.filter((t) => t.scheduled_date);
  const done = scheduled.filter((t) => t.status === "done");
  const must = scheduled.filter((t) => t.is_must_do);
  const mustDone = must.filter((t) => t.status === "done");

  const byDay = new Map<string, { total: number; done: number }>();
  for (const t of scheduled) {
    if (!t.scheduled_date) continue;
    const cur = byDay.get(t.scheduled_date) || { total: 0, done: 0 };
    cur.total += 1;
    if (t.status === "done") cur.done += 1;
    byDay.set(t.scheduled_date, cur);
  }

  let bestDay = "No clear best day yet";
  let weakestDay = "No clear weak day yet";
  let bestRate = -1;
  let weakRate = 2;

  for (const [date, stats] of byDay) {
    if (stats.total === 0) continue;
    const rate = stats.done / stats.total;
    if (rate > bestRate) {
      bestRate = rate;
      bestDay = `${dayLabel(date)} (${Math.round(rate * 100)}% done)`;
    }
    if (rate < weakRate) {
      weakRate = rate;
      weakestDay = `${dayLabel(date)} (${Math.round(rate * 100)}% done)`;
    }
  }

  const sleepAverage =
    input.sleepHours.length === 0
      ? 0
      : Math.round(
          (input.sleepHours.reduce((s, h) => s + h, 0) / input.sleepHours.length) *
            10,
        ) / 10;

  const blocker =
    input.blockers.filter(Boolean).sort((a, b) => b.length - a.length)[0] ||
    "No blocker logged this week";

  return {
    weekStart: input.weekStart,
    weekEnd: input.weekEnd,
    completionPercent:
      scheduled.length === 0 ? 0 : Math.round((done.length / scheduled.length) * 100),
    mustDoRate: must.length === 0 ? 0 : Math.round((mustDone.length / must.length) * 100),
    deepWorkHours: Math.round((input.focusMinutes / 60) * 10) / 10,
    sleepAverage,
    outreachSummary: `${input.outreachSent} outreach logged · ${input.followUpsPending} follow-ups pending`,
    interviewSummary:
      input.prepTotal === 0
        ? "No interview-prep items yet — create a track next week."
        : `${input.prepDone}/${input.prepTotal} prep items completed`,
    bestDay,
    weakestDay,
    commonBlocker: blocker,
    suggestedAchievement:
      done.length > 0
        ? `Closed ${done.length} scheduled tasks and protected ${Math.round(input.focusMinutes)}m deep work.`
        : "Log tasks and focus sessions so next week’s win is measurable.",
    suggestedPriorities:
      "1) Clear overdue must-dos  2) One strong professor follow-up  3) One interview drill daily",
  };
}

/** Monday (or start) of the week containing `today` (YYYY-MM-DD), Monday-based. */
export function weekStartFromDate(today: string): string {
  const d = new Date(`${today}T12:00:00`);
  const day = d.getDay(); // 0 Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function weekEndFromStart(weekStart: string): string {
  const d = new Date(`${weekStart}T12:00:00`);
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0, 10);
}
