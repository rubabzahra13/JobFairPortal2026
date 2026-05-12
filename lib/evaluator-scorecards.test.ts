import { describe, expect, it } from "vitest";
import type { Candidate, EvaluatorScorecards } from "./types";
import {
  aggregateEvaluatorScores,
  evaluatorDisplayNames,
  normalizeCandidateEvaluation,
  upsertEvaluatorScorecard,
} from "./evaluator-scorecards";

const baseCandidate: Candidate = {
  id: "cand_1",
  name: "Ayesha Khan",
  email: "ayesha@example.com",
  phone: "03001234567",
  hometown: "Rawalpindi",
  degree: "BS Computer Science",
  batch: "23",
  yearsOfExperience: "",
  scores: {
    technicalDepth: 5,
    personality: 5,
    communication: 5,
    khandaniPan: 5,
  },
  archetype: "pilot",
  evaluators: "",
  notes: "",
  createdAt: "2026-05-12T10:00:00.000Z",
};

describe("evaluator scorecards", () => {
  it("averages only submitted evaluator scorecards", () => {
    const scorecards: EvaluatorScorecards = {
      ibrahim: {
        evaluatorId: "ibrahim",
        displayName: "Ibrahim Basit",
        scores: { technicalDepth: 8, personality: 9, communication: 7, khandaniPan: 8 },
        notes: "Strong ownership.",
        updatedAt: "2026-05-12T10:00:00.000Z",
      },
      rubab: {
        evaluatorId: "rubab",
        displayName: "Rubab",
        scores: { technicalDepth: 6, personality: 7, communication: 9, khandaniPan: 7 },
        notes: "Clear communicator.",
        updatedAt: "2026-05-12T10:02:00.000Z",
      },
    };

    expect(aggregateEvaluatorScores(scorecards, baseCandidate.scores)).toEqual({
      technicalDepth: 7,
      personality: 8,
      communication: 8,
      khandaniPan: 8,
    });
    expect(evaluatorDisplayNames(scorecards)).toEqual("Ibrahim Basit, Rubab");
  });

  it("falls back to existing scores when nobody has submitted an evaluator scorecard", () => {
    expect(aggregateEvaluatorScores({}, baseCandidate.scores)).toEqual(baseCandidate.scores);
  });

  it("updates one evaluator without overwriting another evaluator tab", () => {
    const first = upsertEvaluatorScorecard(
      baseCandidate,
      "ibrahim",
      { technicalDepth: 8, personality: 9, communication: 7, khandaniPan: 8 },
      "Strong ownership.",
      "2026-05-12T10:00:00.000Z"
    );
    const second = upsertEvaluatorScorecard(
      first,
      "rubab",
      { technicalDepth: 6, personality: 7, communication: 9, khandaniPan: 7 },
      "Clear communicator.",
      "2026-05-12T10:02:00.000Z"
    );

    expect(second.evaluatorScorecards?.ibrahim?.scores.technicalDepth).toBe(8);
    expect(second.evaluatorScorecards?.rubab?.scores.communication).toBe(9);
    expect(second.evaluators).toBe("Ibrahim Basit, Rubab");
    expect(second.scores).toEqual({
      technicalDepth: 7,
      personality: 8,
      communication: 8,
      khandaniPan: 8,
    });
  });

  it("normalizes aggregate scores from stored evaluator scorecards", () => {
    const normalized = normalizeCandidateEvaluation({
      ...baseCandidate,
      scores: { technicalDepth: 1, personality: 1, communication: 1, khandaniPan: 1 },
      evaluatorScorecards: {
        saleh: {
          evaluatorId: "saleh",
          displayName: "Saleh",
          scores: { technicalDepth: 7, personality: 8, communication: 8, khandaniPan: 9 },
          notes: "",
          updatedAt: "2026-05-12T10:00:00.000Z",
        },
      },
    });

    expect(normalized.scores).toEqual({
      technicalDepth: 7,
      personality: 8,
      communication: 8,
      khandaniPan: 9,
    });
    expect(normalized.evaluators).toBe("Saleh");
  });
});
