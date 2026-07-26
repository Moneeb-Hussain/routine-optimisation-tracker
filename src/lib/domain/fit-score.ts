export type FitComponents = {
  researchFit: number;
  fundingActivity: number;
  competitiveness: number;
  responseProbability: number;
  evidenceQuality: number;
};

export type FitCategory =
  | "exceptional"
  | "strong"
  | "promising"
  | "borderline"
  | "weak"
  | "insufficient_evidence";

export type FitResult = {
  total: number;
  category: FitCategory;
  components: FitComponents;
  isAdmissionProbability: false;
  disclaimer: string;
};

/**
 * Professor fit score (organizational estimate — NOT admission probability).
 * Weights: research 40%, funding/activity 25%, competitiveness 15%,
 * response probability 10%, evidence quality 10%.
 */
export function calculateFitScore(components: FitComponents): FitResult {
  const researchFit = clamp(components.researchFit);
  const fundingActivity = clamp(components.fundingActivity);
  const competitiveness = clamp(components.competitiveness);
  const responseProbability = clamp(components.responseProbability);
  const evidenceQuality = clamp(components.evidenceQuality);

  const total = Math.round(
    researchFit * 0.4 +
      fundingActivity * 0.25 +
      competitiveness * 0.15 +
      responseProbability * 0.1 +
      evidenceQuality * 0.1,
  );

  return {
    total: clamp(total),
    category: categorizeFit(total, evidenceQuality),
    components: {
      researchFit,
      fundingActivity,
      competitiveness,
      responseProbability,
      evidenceQuality,
    },
    isAdmissionProbability: false,
    disclaimer:
      "Organizational fit estimate only — not an admission or funding probability.",
  };
}

export function categorizeFit(total: number, evidenceQuality: number): FitCategory {
  if (evidenceQuality < 40) return "insufficient_evidence";
  if (total >= 85) return "exceptional";
  if (total >= 75) return "strong";
  if (total >= 65) return "promising";
  if (total >= 50) return "borderline";
  return "weak";
}

export function fitCategoryLabel(category: FitCategory): string {
  switch (category) {
    case "exceptional":
      return "Exceptional Fit";
    case "strong":
      return "Strong Fit";
    case "promising":
      return "Promising Fit";
    case "borderline":
      return "Borderline Fit";
    case "weak":
      return "Weak Fit";
    case "insufficient_evidence":
      return "Insufficient Evidence";
  }
}

function clamp(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}
