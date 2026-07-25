/**
 * Demo fixtures for Command Center UI preview.
 * Replace with live Supabase data in Phase 1 backend wiring.
 * Clearly marked as demonstration data — not admission predictions.
 */

export type Tone = "good" | "watch" | "critical" | "neutral";

export const commandCenterDemo = {
  userFirstName: "Moneeb",
  timezone: "Asia/Karachi",
  primaryGoal:
    "Finish a professor-specific research brief for one high-fit lab and draft the cold email outline.",
  daysToDeadline: 187,
  deadlineLabel: "Fall 2027 early application window",
  executionScore: 78,
  weeklyProgress: 64,
  streakDays: 5,
  sleepHours: 6.4,
  sleepTarget: 7.5,
  energyLevel: 3,
  deepWorkMinutes: 95,
  deepWorkTarget: 120,
  interviewPrepPct: 42,
  applicationReadinessPct: 28,
  nextBestAction: {
    title: "Research Dr. Chen’s latest multimodal perception paper",
    reason:
      "Strong fit signals exist, but the connection is still too broad. One verified paper unlocks a credible email angle.",
    minutes: 35,
  },
  risk: {
    label: "Follow-up lag",
    detail: "2 strong-fit drafts have no scheduled follow-up date.",
  },
  motivation:
    "One verified research connection beats ten generic emails. Protect the deep-work block and finish today’s brief.",
  mustDos: [
    {
      id: "1",
      title: "Complete professor research brief (Chen Lab)",
      minutes: 35,
      category: "Professor research",
      done: false,
    },
    {
      id: "2",
      title: "Log yesterday’s sleep and energy",
      minutes: 5,
      category: "Health",
      done: true,
    },
    {
      id: "3",
      title: "Schedule follow-up for sent email #2",
      minutes: 10,
      category: "Follow-up",
      done: false,
    },
  ],
  recentWins: [
    "Drafted CV v4 project bullets for Automatic Retail Checkout V-3",
    "Added 3 professors to Discovered stage",
    "Completed a 50-minute deep-work session on SOP outline",
  ],
  pipeline: [
    { stage: "Discovered", count: 12 },
    { stage: "Researching", count: 5 },
    { stage: "Strong Fit", count: 3 },
    { stage: "Draft Ready", count: 2 },
    { stage: "Sent", count: 4 },
    { stage: "Follow-up Due", count: 2 },
    { stage: "Replied", count: 1 },
  ],
  followUps: [
    {
      professor: "Dr. A. Rahman",
      university: "UIUC",
      due: "Today",
      tone: "critical" as Tone,
    },
    {
      professor: "Dr. L. Ortiz",
      university: "UCSD",
      due: "Tomorrow",
      tone: "watch" as Tone,
    },
  ],
  scoreBreakdown: [
    { label: "Must-do completion", weight: 30, value: 67 },
    { label: "Weighted task completion", weight: 20, value: 72 },
    { label: "Deep-work completion", weight: 15, value: 79 },
    { label: "Primary goal progress", weight: 15, value: 60 },
    { label: "Schedule adherence", weight: 10, value: 85 },
    { label: "Review consistency", weight: 5, value: 100 },
    { label: "Sleep readiness", weight: 5, value: 70 },
  ],
  weeklyExecution: [
    { day: "Mon", score: 72, deepWork: 80 },
    { day: "Tue", score: 81, deepWork: 110 },
    { day: "Wed", score: 64, deepWork: 45 },
    { day: "Thu", score: 88, deepWork: 130 },
    { day: "Fri", score: 76, deepWork: 95 },
    { day: "Sat", score: 58, deepWork: 40 },
    { day: "Sun", score: 78, deepWork: 95 },
  ],
  categoryMix: [
    { name: "Outreach", value: 28, fill: "#0E7490" },
    { name: "Interview", value: 22, fill: "#0369A1" },
    { name: "Learning", value: 18, fill: "#0F766E" },
    { name: "Documents", value: 14, fill: "#B45309" },
    { name: "Health", value: 10, fill: "#047857" },
    { name: "Admin", value: 8, fill: "#64748B" },
  ],
} as const;
