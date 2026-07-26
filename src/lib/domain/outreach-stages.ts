export const OUTREACH_STAGES = [
  "Discovered",
  "Research Needed",
  "Researching",
  "Fit Assessed",
  "Weak Fit",
  "Strong Fit",
  "Draft Needed",
  "Draft Created",
  "Ready for Review",
  "Ready to Send",
  "Sent",
  "Follow-up Due",
  "Follow-up Sent",
  "Replied",
  "Encouraged to Apply",
  "Meeting Requested",
  "Interview Scheduled",
  "Not Recruiting",
  "Rejected",
  "No Response",
  "Closed",
] as const;

export type OutreachStage = (typeof OUTREACH_STAGES)[number];

export const PIPELINE_SUMMARY_STAGES: OutreachStage[] = [
  "Discovered",
  "Researching",
  "Strong Fit",
  "Draft Created",
  "Sent",
  "Follow-up Due",
  "Replied",
];

/** Map detailed stages into Command Center summary buckets. */
export function summarizeStage(stage: string): string {
  if (stage === "Research Needed" || stage === "Researching") return "Researching";
  if (stage === "Strong Fit" || stage === "Fit Assessed") return "Strong Fit";
  if (
    stage === "Draft Needed" ||
    stage === "Draft Created" ||
    stage === "Ready for Review" ||
    stage === "Ready to Send"
  ) {
    return "Draft Ready";
  }
  if (stage === "Follow-up Due" || stage === "Follow-up Sent") return "Follow-up Due";
  if (
    stage === "Replied" ||
    stage === "Encouraged to Apply" ||
    stage === "Meeting Requested" ||
    stage === "Interview Scheduled"
  ) {
    return "Replied";
  }
  if (stage === "Sent") return "Sent";
  if (stage === "Discovered") return "Discovered";
  return stage;
}
