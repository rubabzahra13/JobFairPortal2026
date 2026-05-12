import type {
  Candidate,
  EvaluatorScorecard,
  EvaluatorScorecards,
  PanelEvaluatorId,
  Scores,
} from "./types";
import { PANEL_EVALUATORS } from "./types";

export const DEFAULT_PANEL_SCORES: Scores = {
  technicalDepth: 5,
  personality: 5,
  communication: 5,
  khandaniPan: 5,
};

const PANEL_EVALUATOR_MAP = new Map(PANEL_EVALUATORS.map((evaluator) => [evaluator.id, evaluator]));

export function evaluatorDisplayName(evaluatorId: PanelEvaluatorId): string {
  return PANEL_EVALUATOR_MAP.get(evaluatorId)?.displayName ?? evaluatorId;
}

export function isPanelEvaluatorId(value: string): value is PanelEvaluatorId {
  return PANEL_EVALUATORS.some((evaluator) => evaluator.id === value);
}

export function submittedScorecards(scorecards: EvaluatorScorecards | undefined) {
  return PANEL_EVALUATORS.map((evaluator) => scorecards?.[evaluator.id]).filter(
    (scorecard): scorecard is EvaluatorScorecard => Boolean(scorecard?.updatedAt)
  );
}

export function aggregateEvaluatorScores(
  scorecards: EvaluatorScorecards | undefined,
  fallback: Scores = DEFAULT_PANEL_SCORES
): Scores {
  const submitted = submittedScorecards(scorecards);
  if (submitted.length === 0) return { ...fallback };

  const sum = submitted.reduce(
    (acc, scorecard) => ({
      technicalDepth: acc.technicalDepth + scorecard.scores.technicalDepth,
      personality: acc.personality + scorecard.scores.personality,
      communication: acc.communication + scorecard.scores.communication,
      khandaniPan: acc.khandaniPan + scorecard.scores.khandaniPan,
    }),
    { technicalDepth: 0, personality: 0, communication: 0, khandaniPan: 0 }
  );

  return {
    technicalDepth: Math.round(sum.technicalDepth / submitted.length),
    personality: Math.round(sum.personality / submitted.length),
    communication: Math.round(sum.communication / submitted.length),
    khandaniPan: Math.round(sum.khandaniPan / submitted.length),
  };
}

export function evaluatorDisplayNames(scorecards: EvaluatorScorecards | undefined): string {
  return submittedScorecards(scorecards)
    .map((scorecard) => scorecard.displayName)
    .join(", ");
}

export function normalizeEvaluatorScorecards(
  scorecards: EvaluatorScorecards | undefined
): EvaluatorScorecards {
  const normalized: EvaluatorScorecards = {};

  for (const evaluator of PANEL_EVALUATORS) {
    const scorecard = scorecards?.[evaluator.id];
    if (!scorecard?.updatedAt) continue;

    normalized[evaluator.id] = {
      evaluatorId: evaluator.id,
      displayName: evaluator.displayName,
      scores: {
        technicalDepth: normalizeScore(scorecard.scores?.technicalDepth),
        personality: normalizeScore(scorecard.scores?.personality),
        communication: normalizeScore(scorecard.scores?.communication),
        khandaniPan: normalizeScore(scorecard.scores?.khandaniPan),
      },
      notes: scorecard.notes ?? "",
      updatedAt: scorecard.updatedAt,
    };
  }

  return normalized;
}

export function normalizeCandidateEvaluation(candidate: Candidate): Candidate {
  const evaluatorScorecards = normalizeEvaluatorScorecards(candidate.evaluatorScorecards);
  const scores = aggregateEvaluatorScores(evaluatorScorecards, candidate.scores);
  const evaluators = evaluatorDisplayNames(evaluatorScorecards);

  return {
    ...candidate,
    evaluatorScorecards,
    scores,
    evaluators: evaluators || candidate.evaluators || "",
  };
}

export function setEvaluatorScorecard(
  scorecards: EvaluatorScorecards | undefined,
  evaluatorId: PanelEvaluatorId,
  scores: Scores | null,
  notes: string,
  updatedAt = new Date().toISOString()
): EvaluatorScorecards {
  const nextScorecards: EvaluatorScorecards = { ...scorecards };

  if (!scores) {
    delete nextScorecards[evaluatorId];
    return nextScorecards;
  }

  nextScorecards[evaluatorId] = {
    evaluatorId,
    displayName: evaluatorDisplayName(evaluatorId),
    scores: {
      technicalDepth: normalizeScore(scores.technicalDepth),
      personality: normalizeScore(scores.personality),
      communication: normalizeScore(scores.communication),
      khandaniPan: normalizeScore(scores.khandaniPan),
    },
    notes: notes.trim(),
    updatedAt,
  };

  return normalizeEvaluatorScorecards(nextScorecards);
}

export function upsertEvaluatorScorecard(
  candidate: Candidate,
  evaluatorId: PanelEvaluatorId,
  scores: Scores,
  notes: string,
  updatedAt = new Date().toISOString()
): Candidate {
  const nextScorecards = setEvaluatorScorecard(
    candidate.evaluatorScorecards,
    evaluatorId,
    scores,
    notes,
    updatedAt
  );

  return normalizeCandidateEvaluation({
    ...candidate,
    evaluatorScorecards: nextScorecards,
  });
}

export function normalizeScore(value: unknown): number {
  const score = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(score)) return 5;
  return Math.min(10, Math.max(1, Math.round(score)));
}
