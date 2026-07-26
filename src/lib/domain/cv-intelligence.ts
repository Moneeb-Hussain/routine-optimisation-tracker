export type CvAnalysisInput = {
  cvText: string;
  profile: {
    full_name: string;
    degree: string;
    university: string;
    cgpa?: number | null;
    ielts_academic?: number | null;
    research_interests: string[];
    strongest_project: { name: string; bullets: string[] };
    achievements: string[];
  };
};

export type CvAnalysisResult = {
  missingSections: string[];
  inconsistencies: string[];
  unsupportedClaims: string[];
  supportedResearchAreas: string[];
  weakResearchAreas: string[];
  recommendedBullets: string[];
  summary: string;
};

const SECTION_HINTS: Array<{ key: string; patterns: RegExp[] }> = [
  { key: "Education", patterns: [/education/i, /university/i, /bachelor/i, /bs\b/i] },
  { key: "Experience / Projects", patterns: [/project/i, /experience/i, /built/i] },
  { key: "Skills", patterns: [/skills/i, /technologies/i, /python/i] },
  { key: "Achievements", patterns: [/award/i, /winner/i, /hackerrank/i, /competition/i] },
  { key: "Contact", patterns: [/email/i, /@/, /linkedin/i, /github/i] },
];

/**
 * Rule-based CV intelligence — compares uploaded/pasted CV text to stored profile.
 * Does not overwrite the CV file.
 */
export function analyzeCvAgainstProfile(input: CvAnalysisInput): CvAnalysisResult {
  const text = input.cvText.trim();
  const lower = text.toLowerCase();
  const missingSections: string[] = [];
  const inconsistencies: string[] = [];
  const unsupportedClaims: string[] = [];
  const supportedResearchAreas: string[] = [];
  const weakResearchAreas: string[] = [];
  const recommendedBullets: string[] = [];

  if (!text) {
    return {
      missingSections: ["Entire CV text"],
      inconsistencies: [],
      unsupportedClaims: [],
      supportedResearchAreas: [],
      weakResearchAreas: [...input.profile.research_interests],
      recommendedBullets: [],
      summary: "No CV text available. Upload a .txt/.md CV or paste extracted text.",
    };
  }

  for (const section of SECTION_HINTS) {
    if (!section.patterns.some((p) => p.test(text))) {
      missingSections.push(section.key);
    }
  }

  if (input.profile.full_name && !lower.includes(input.profile.full_name.toLowerCase())) {
    inconsistencies.push(
      `Stored profile name "${input.profile.full_name}" was not found in the CV text.`,
    );
  }

  if (input.profile.university && !lower.includes(input.profile.university.toLowerCase())) {
    inconsistencies.push(
      `University "${input.profile.university}" from profile was not found in the CV text.`,
    );
  }

  if (
    input.profile.cgpa != null &&
    !lower.includes(String(input.profile.cgpa)) &&
    !lower.includes("3.16")
  ) {
    inconsistencies.push(`CGPA ${input.profile.cgpa} from profile was not found in the CV text.`);
  }

  if (
    input.profile.ielts_academic != null &&
    !/ielts/i.test(text)
  ) {
    missingSections.push("IELTS / English score");
  }

  const projectName = input.profile.strongest_project.name;
  if (projectName && !lower.includes(projectName.toLowerCase())) {
    inconsistencies.push(
      `Strongest project "${projectName}" is in the profile but missing from the CV text.`,
    );
    recommendedBullets.push(
      ...input.profile.strongest_project.bullets.slice(0, 4).map((b) => `${projectName}: ${b}`),
    );
  } else {
    for (const bullet of input.profile.strongest_project.bullets.slice(0, 3)) {
      if (!lower.includes(bullet.toLowerCase().slice(0, 24))) {
        recommendedBullets.push(`${projectName}: ${bullet}`);
      }
    }
  }

  for (const achievement of input.profile.achievements) {
    const needle = achievement.slice(0, 28).toLowerCase();
    if (!lower.includes(needle)) {
      recommendedBullets.push(achievement);
    }
  }

  // Heuristic: claims that look quantitative but aren't in profile achievements/project
  const claimMatches = text.match(/\b\d+(\.\d+)?%\b|\btop\s+\d+%/gi) || [];
  for (const claim of claimMatches.slice(0, 8)) {
    const inProfile =
      input.profile.achievements.some((a) => a.toLowerCase().includes(claim.toLowerCase())) ||
      input.profile.strongest_project.bullets.some((b) =>
        b.toLowerCase().includes(claim.toLowerCase()),
      );
    if (!inProfile) {
      unsupportedClaims.push(
        `Quantitative claim "${claim}" appears in CV but is not mirrored in stored profile evidence — verify before using in professor emails.`,
      );
    }
  }

  for (const interest of input.profile.research_interests) {
    if (lower.includes(interest.toLowerCase())) {
      supportedResearchAreas.push(interest);
    } else {
      weakResearchAreas.push(interest);
    }
  }

  const summary = [
    `Checked CV text (${text.length} chars) against stored profile.`,
    missingSections.length
      ? `${missingSections.length} section hint(s) look thin/missing.`
      : "Core section hints look present.",
    `${supportedResearchAreas.length} research interests appear supported by CV wording; ${weakResearchAreas.length} lack direct textual evidence.`,
    "This does not overwrite your uploaded CV.",
  ].join(" ");

  return {
    missingSections,
    inconsistencies,
    unsupportedClaims: [...new Set(unsupportedClaims)],
    supportedResearchAreas,
    weakResearchAreas,
    recommendedBullets: [...new Set(recommendedBullets)].slice(0, 10),
    summary,
  };
}
