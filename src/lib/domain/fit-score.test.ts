import { describe, expect, it } from "vitest";
import { calculateFitScore, categorizeFit } from "@/lib/domain/fit-score";
import { detectGenericFit } from "@/lib/domain/generic-fit";

describe("calculateFitScore", () => {
  it("applies published weights and never claims admission probability", () => {
    const result = calculateFitScore({
      researchFit: 80,
      fundingActivity: 70,
      competitiveness: 60,
      responseProbability: 50,
      evidenceQuality: 90,
    });

    // 80*0.4 + 70*0.25 + 60*0.15 + 50*0.1 + 90*0.1 = 32+17.5+9+5+9 = 72.5 -> 73
    expect(result.total).toBe(73);
    expect(result.category).toBe("promising");
    expect(result.isAdmissionProbability).toBe(false);
  });

  it("marks insufficient evidence when evidence quality is low", () => {
    expect(categorizeFit(90, 20)).toBe("insufficient_evidence");
  });
});

describe("detectGenericFit", () => {
  it("flags broad keyword-only connections", () => {
    const result = detectGenericFit({
      connectionParagraph: "I am interested in your artificial intelligence and robotics work.",
      mentionedPaperOrProject: false,
      examinedRecentWork: false,
      applicantEvidenceRelated: false,
      couldCopyToManyProfessors: true,
      usesOnlyBroadKeywords: true,
      containsEmptyPraise: true,
      proposesUnsupportedExtension: false,
      informationOutdatedOrUnverified: true,
    });

    expect(result.isGeneric).toBe(true);
    expect(result.flags.some((f) => f.code === "broad_keywords_only")).toBe(true);
    expect(result.missingInformation.length).toBeGreaterThan(0);
  });

  it("passes a specific verified connection", () => {
    const result = detectGenericFit({
      connectionParagraph:
        "Your 2024 work on robust multimodal perception for warehouse automation connects to my conveyor retail-checkout detector.",
      mentionedPaperOrProject: true,
      examinedRecentWork: true,
      applicantEvidenceRelated: true,
      couldCopyToManyProfessors: false,
      usesOnlyBroadKeywords: false,
      containsEmptyPraise: false,
      proposesUnsupportedExtension: false,
      informationOutdatedOrUnverified: false,
    });

    expect(result.isGeneric).toBe(false);
    expect(result.flags).toHaveLength(0);
  });
});
