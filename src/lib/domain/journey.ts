export const JOURNEY_STAGES = [
  {
    id: "profile",
    title: "Competitive profile",
    description: "CV, projects, IELTS, and research narrative ready to share.",
    match: /profile|cv|research profile/i,
  },
  {
    id: "professors",
    title: "High-fit professors",
    description: "Target list with fit scores and verified research angles.",
    match: /professor|fit/i,
  },
  {
    id: "outreach",
    title: "Personalized outreach",
    description: "Strong emails sent and follow-ups tracked — never generic.",
    match: /email|outreach/i,
  },
  {
    id: "conversations",
    title: "Professor conversations",
    description: "Meetings booked and research discussions underway.",
    match: /conversation|meeting/i,
  },
  {
    id: "applications",
    title: "Applications",
    description: "SOP, statements, transcripts, and portal submissions.",
    match: /application/i,
  },
  {
    id: "skills",
    title: "Technical depth",
    description: "Skills that make funding conversations credible.",
    match: /technical|skill/i,
  },
  {
    id: "interviews",
    title: "Interview readiness",
    description: "Stories, research pitch, and behavioral answers rehearsed.",
    match: /interview/i,
  },
  {
    id: "funding",
    title: "Funding secured",
    description: "RA/TA/fellowship path identified and advancing.",
    match: /funding/i,
  },
  {
    id: "visa",
    title: "Visa & travel",
    description: "Documents, timeline, and arrival logistics ready.",
    match: /visa|travel/i,
  },
] as const;

export type JourneyStageStatus = "locked" | "active" | "done";

export type JourneyStageView = {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: JourneyStageStatus;
  goalTitle: string | null;
};

export function buildJourneyStages(
  goals: Array<{ title: string; progress_percent: number; status: string }>,
): JourneyStageView[] {
  return JOURNEY_STAGES.map((stage) => {
    const goal = goals.find((g) => stage.match.test(g.title));
    const progress = goal?.progress_percent ?? 0;
    const status: JourneyStageStatus =
      progress >= 100 || goal?.status === "completed"
        ? "done"
        : progress > 0 || goal
          ? "active"
          : "locked";
    return {
      id: stage.id,
      title: stage.title,
      description: stage.description,
      progress,
      status,
      goalTitle: goal?.title || null,
    };
  });
}

export function journeyOverallPercent(stages: JourneyStageView[]): number {
  if (stages.length === 0) return 0;
  return Math.round(
    stages.reduce((s, st) => s + st.progress, 0) / stages.length,
  );
}
