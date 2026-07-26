export type GenericFitInput = {
  connectionParagraph: string;
  mentionedPaperOrProject: boolean;
  examinedRecentWork: boolean;
  applicantEvidenceRelated: boolean;
  couldCopyToManyProfessors: boolean;
  usesOnlyBroadKeywords: boolean;
  containsEmptyPraise: boolean;
  proposesUnsupportedExtension: boolean;
  informationOutdatedOrUnverified: boolean;
};

export type GenericFitFlag = {
  code: string;
  message: string;
};

export type GenericFitResult = {
  isGeneric: boolean;
  flags: GenericFitFlag[];
  missingInformation: string[];
  guidance: string[];
};

const BROAD_ONLY =
  /\b(artificial intelligence|machine learning|deep learning|computer vision|robotics|ai|ml)\b/i;

/**
 * Detects generic professor-fit connections that should not be emailed yet.
 */
export function detectGenericFit(input: GenericFitInput): GenericFitResult {
  const flags: GenericFitFlag[] = [];
  const missingInformation: string[] = [];
  const guidance: string[] = [];

  const text = input.connectionParagraph.trim();

  if (!text) {
    flags.push({
      code: "empty_connection",
      message: "No professor-specific connection paragraph was provided.",
    });
    missingInformation.push("A concrete research connection paragraph");
  }

  if (input.usesOnlyBroadKeywords || (text && BROAD_ONLY.test(text) && !input.mentionedPaperOrProject)) {
    flags.push({
      code: "broad_keywords_only",
      message:
        "Connection relies on broad terms (AI, robotics, computer vision) without a specific paper, project, or problem.",
    });
    missingInformation.push("Specific paper title, project, system, or research problem");
  }

  if (!input.mentionedPaperOrProject) {
    flags.push({
      code: "no_specific_work",
      message: "No specific paper, project, system, or research problem is identified.",
    });
    missingInformation.push("Verified paper / lab project reference");
  }

  if (!input.examinedRecentWork) {
    flags.push({
      code: "recent_work_not_examined",
      message: "The professor’s actual recent work has not been examined.",
    });
    missingInformation.push("Recent publications or lab updates with source URL + date");
  }

  if (input.couldCopyToManyProfessors) {
    flags.push({
      code: "copy_pasteable",
      message: "This connection could be copied into emails to many professors.",
    });
  }

  if (!input.applicantEvidenceRelated) {
    flags.push({
      code: "unrelated_evidence",
      message: "Applicant evidence appears unrelated to the professor’s work.",
    });
    guidance.push(
      "Map Automatic Retail Checkout V-3 or another verified project to a concrete problem in this lab.",
    );
  }

  if (input.containsEmptyPraise) {
    flags.push({
      code: "empty_praise",
      message: "Professor-specific paragraph relies on empty praise.",
    });
  }

  if (input.proposesUnsupportedExtension) {
    flags.push({
      code: "unsupported_extension",
      message:
        "Proposed future direction claims to “extend” work without enough evidence that this is appropriate.",
    });
  }

  if (input.informationOutdatedOrUnverified) {
    flags.push({
      code: "unverified_or_outdated",
      message: "Research information is outdated or unverified.",
    });
    missingInformation.push("Source URL and last-verified date");
  }

  if (flags.length > 0) {
    guidance.push("Research further before contacting, or skip if no credible angle emerges.");
    guidance.push(
      "Prefer openings like “Your work on…” naming a verified paper/project — never invent gaps or openings.",
    );
  } else {
    guidance.push("Connection looks specific enough to draft — still require human review before send.");
  }

  return {
    isGeneric: flags.length > 0,
    flags,
    missingInformation: [...new Set(missingInformation)],
    guidance,
  };
}
