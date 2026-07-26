import { describe, expect, it } from "vitest";
import { analyzeCvAgainstProfile } from "@/lib/domain/cv-intelligence";
import { chunkText } from "@/lib/domain/documents";

describe("analyzeCvAgainstProfile", () => {
  it("flags missing project and supports matching interests", () => {
    const result = analyzeCvAgainstProfile({
      cvText:
        "Moneeb Hussain\nEducation UET Lahore\nSkills: Python, computer vision\nEmail me@test.com",
      profile: {
        full_name: "Moneeb Hussain",
        degree: "BS",
        university: "UET Lahore",
        cgpa: 3.16,
        ielts_academic: 7,
        research_interests: ["Computer vision", "Robotics"],
        strongest_project: {
          name: "Automatic Retail Checkout V-3",
          bullets: ["YOLOv4-tiny and OpenCV"],
        },
        achievements: ["Winner, Harvard CS50x Puzzle Day, perfect 10/10"],
      },
    });

    expect(result.supportedResearchAreas).toContain("Computer vision");
    expect(result.weakResearchAreas).toContain("Robotics");
    expect(
      result.inconsistencies.some((i) => i.includes("Automatic Retail Checkout")),
    ).toBe(true);
  });
});

describe("chunkText", () => {
  it("splits long text into bounded chunks", () => {
    const text = "a".repeat(2500);
    const chunks = chunkText(text, 1000);
    expect(chunks.length).toBe(3);
    expect(chunks[0]?.length).toBe(1000);
  });
});
