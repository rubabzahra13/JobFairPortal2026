import { describe, expect, it } from "vitest";
import type { Candidate } from "./types";
import {
  buildCandidateInsightPrompt,
  getGeminiModelName,
  normalizeGeminiInsightText,
  serializeCandidateForInsight,
  stripMarkdownJsonFence,
} from "./gemini-insights";

const candidate: Candidate = {
  id: "cand_1",
  name: "Ayesha Khan",
  email: "ayesha@example.com",
  phone: "03001234567",
  hometown: "Rawalpindi",
  currentCity: "Islamabad",
  graduationLocationPlan: "I want to stay in Islamabad after graduation.",
  degree: "BS Computer Science",
  batch: "2026",
  yearsOfExperience: "Internship",
  scores: {
    technicalDepth: 6,
    personality: 8,
    communication: 7,
    khandaniPan: 9,
  },
  archetype: "pilot",
  evaluators: "Ibrahim",
  notes: "Led a campus project and communicates clearly.",
  resumeText: "Built a scheduling app for a university society.",
  createdAt: "2026-05-12T10:00:00.000Z",
};

describe("gemini insight helpers", () => {
  it("serializes only compact candidate fields needed for insight generation", () => {
    expect(serializeCandidateForInsight(candidate)).toEqual({
      id: "cand_1",
      name: "Ayesha Khan",
      hometown: "Rawalpindi",
      currentCity: "Islamabad",
      graduationLocationPlan: "I want to stay in Islamabad after graduation.",
      degree: "BS Computer Science",
      batch: "2026",
      yearsOfExperience: "Internship",
      scores: candidate.scores,
      archetype: "pilot",
      evaluators: "Ibrahim",
      notes: "Led a campus project and communicates clearly.",
      resumeText: "Built a scheduling app for a university society.",
    });
  });

  it("builds a prompt focused on VECTOR FAST Islamabad fit without final hiring decisions", () => {
    const prompt = buildCandidateInsightPrompt(candidate);

    expect(prompt).toContain("VECTOR Inc FAST Islamabad job fair");
    expect(prompt).toContain("personality");
    expect(prompt).toContain("communication");
    expect(prompt).toContain("ownership");
    expect(prompt).toContain("location fit");
    expect(prompt).toContain("do not invent facts");
    expect(prompt).toContain("do not make a final hiring decision");
    expect(prompt).toContain("suggestedScores");
    expect(prompt).toContain("scoreReasons");
    expect(prompt).toContain("interviewPrompts");
    expect(prompt).toContain("risks");
    expect(prompt).toContain('"name":"Ayesha Khan"');
  });

  it("uses a current Gemini model by default", () => {
    expect(getGeminiModelName()).toBe("gemini-2.5-flash");
  });

  it("strips markdown JSON fences from model output", () => {
    expect(stripMarkdownJsonFence("```json\n{\"summary\":\"ok\"}\n```")).toBe(
      "{\"summary\":\"ok\"}"
    );
  });

  it("wraps non-JSON model output in valid fallback JSON", () => {
    expect(JSON.parse(normalizeGeminiInsightText("partial model text"))).toEqual({
      summary: "partial model text",
      suggestedScores: null,
      scoreReasons: {},
      interviewPrompts: [],
      risks: ["Gemini returned a non-JSON insight; review manually."],
      locationFit: "",
    });
  });
});
