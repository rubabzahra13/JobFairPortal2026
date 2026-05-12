import type { Archetype, Candidate, Scores } from "./types";

export const CANDIDATE_STATUSES = ["screening", "shortlisted", "rejected", "hired"] as const;
export const CANDIDATE_SOURCES = ["qr", "panel", "import"] as const;

export const LEGACY_CANDIDATE_SHEET_HEADERS = [
  "id",
  "name",
  "email",
  "phone",
  "hometown",
  "currentCity",
  "graduationLocationPlan",
  "degree",
  "batch",
  "yearsOfExperience",
  "technicalDepth",
  "personality",
  "communication",
  "khandaniPan",
  "archetype",
  "evaluators",
  "notes",
  "status",
  "source",
  "resumeFileName",
  "resumeUrl",
  "resumeText",
  "geminiInsight",
  "geminiUpdatedAt",
  "sourceSubmissionId",
  "createdAt",
  "updatedAt",
] as const;

export const CANDIDATE_SHEET_HEADERS = [
  "Candidate ID",
  "Name",
  "Email",
  "Phone",
  "Hometown",
  "Current City",
  "Post-Graduation Location Plan",
  "Degree / Major",
  "Batch / Graduation Year",
  "Experience",
  "Panel Technical Score",
  "Panel Personality Score",
  "Panel Communication Score",
  "Panel Khandani Pan Score",
  "Archetype",
  "Evaluators",
  "Panel Notes",
  "Status",
  "Source",
  "Resume File",
  "Resume Link",
  "Parsed Resume Text",
  "Gemini Summary",
  "Gemini Suggested Technical",
  "Gemini Suggested Personality",
  "Gemini Suggested Communication",
  "Gemini Suggested Khandani Pan",
  "Gemini Technical Reason",
  "Gemini Personality Reason",
  "Gemini Communication Reason",
  "Gemini Khandani Pan Reason",
  "Gemini Interview Prompts",
  "Gemini Risks",
  "Gemini Location Fit",
  "Gemini Updated At",
  "Source Submission ID",
  "Created At",
  "Updated At",
] as const;

type CandidateStatus = NonNullable<Candidate["status"]>;
type CandidateSource = NonNullable<Candidate["source"]>;
type CandidateInsight = {
  summary?: string;
  suggestedScores?: Partial<Scores> | null;
  scoreReasons?: Partial<Record<keyof Scores, string>>;
  interviewPrompts?: string[];
  risks?: string[];
  locationFit?: string;
};

const ARCHETYPES: Archetype[] = ["astronaut", "pilot", "bus_driver", "taxi_rider"];

function parseNumber(value: string | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseArchetype(value: string | undefined): Archetype {
  return ARCHETYPES.includes(value as Archetype) ? (value as Archetype) : "pilot";
}

function parseStatus(value: string | undefined): CandidateStatus {
  return CANDIDATE_STATUSES.includes(value as CandidateStatus)
    ? (value as CandidateStatus)
    : "screening";
}

function parseSource(value: string | undefined): CandidateSource {
  return CANDIDATE_SOURCES.includes(value as CandidateSource)
    ? (value as CandidateSource)
    : "panel";
}

function candidateScore(scores: Scores, key: keyof Scores): string {
  return String(scores[key] ?? 0);
}

function optionalScore(score: number | undefined): string {
  return typeof score === "number" && Number.isFinite(score) ? String(score) : "";
}

function splitMultiline(value: string | undefined): string[] {
  return (value ?? "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean);
}

function joinReadableList(values: string[] | undefined): string {
  return values?.filter(Boolean).join("\n") ?? "";
}

function cleanGeminiSummary(value: string | undefined): string {
  const summary = (value ?? "").trim();

  if (!summary) return "";
  if (summary.startsWith("{") || summary.startsWith("[")) {
    return "Gemini returned incomplete output; regenerate insight from the panel.";
  }

  return summary;
}

export function parseCandidateGeminiInsight(value: string | undefined): CandidateInsight | null {
  if (!value) return null;

  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed === "string") return parseCandidateGeminiInsight(parsed);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as CandidateInsight;
    }
  } catch {
    return {
      summary: value,
      suggestedScores: null,
      scoreReasons: {},
      interviewPrompts: [],
      risks: [],
      locationFit: "",
    };
  }

  return null;
}

function geminiInsightFromSheet(row: readonly string[]): string {
  const insight: CandidateInsight = {
    summary: row[22] ?? "",
    suggestedScores: {
      technicalDepth: parseNumber(row[23]),
      personality: parseNumber(row[24]),
      communication: parseNumber(row[25]),
      khandaniPan: parseNumber(row[26]),
    },
    scoreReasons: {
      technicalDepth: row[27] ?? "",
      personality: row[28] ?? "",
      communication: row[29] ?? "",
      khandaniPan: row[30] ?? "",
    },
    interviewPrompts: splitMultiline(row[31]),
    risks: splitMultiline(row[32]),
    locationFit: row[33] ?? "",
  };
  const hasScores = Object.values(insight.suggestedScores ?? {}).some((score) => score > 0);
  const hasReasons = Object.values(insight.scoreReasons ?? {}).some(Boolean);
  const hasInsight =
    Boolean(insight.summary || insight.locationFit) ||
    hasScores ||
    hasReasons ||
    Boolean(insight.interviewPrompts?.length || insight.risks?.length);

  return hasInsight ? JSON.stringify(insight) : "";
}

export function candidateToSheetRow(candidate: Candidate): string[] {
  const geminiInsight = parseCandidateGeminiInsight(candidate.geminiInsight);
  const suggestedScores = geminiInsight?.suggestedScores ?? null;
  const scoreReasons = geminiInsight?.scoreReasons ?? {};

  return [
    candidate.id,
    candidate.name,
    candidate.email ?? "",
    candidate.phone ?? "",
    candidate.hometown,
    candidate.currentCity ?? "",
    candidate.graduationLocationPlan ?? "",
    candidate.degree,
    candidate.batch,
    candidate.yearsOfExperience,
    candidateScore(candidate.scores, "technicalDepth"),
    candidateScore(candidate.scores, "personality"),
    candidateScore(candidate.scores, "communication"),
    candidateScore(candidate.scores, "khandaniPan"),
    candidate.archetype,
    candidate.evaluators,
    candidate.notes,
    candidate.status ?? "screening",
    candidate.source ?? "panel",
    candidate.resumeFileName ?? "",
    candidate.resumeUrl ?? "",
    candidate.resumeText ?? "",
    cleanGeminiSummary(geminiInsight?.summary ?? candidate.geminiInsight),
    optionalScore(suggestedScores?.technicalDepth),
    optionalScore(suggestedScores?.personality),
    optionalScore(suggestedScores?.communication),
    optionalScore(suggestedScores?.khandaniPan),
    scoreReasons.technicalDepth ?? "",
    scoreReasons.personality ?? "",
    scoreReasons.communication ?? "",
    scoreReasons.khandaniPan ?? "",
    joinReadableList(geminiInsight?.interviewPrompts),
    joinReadableList(geminiInsight?.risks),
    geminiInsight?.locationFit ?? "",
    candidate.geminiUpdatedAt ?? "",
    candidate.sourceSubmissionId ?? "",
    candidate.createdAt,
    candidate.updatedAt ?? candidate.createdAt,
  ];
}

export function sheetRowToCandidate(row: readonly string[]): Candidate {
  return {
    id: row[0] ?? "",
    name: row[1] ?? "",
    email: row[2] ?? "",
    phone: row[3] ?? "",
    hometown: row[4] ?? "",
    currentCity: row[5] ?? "",
    graduationLocationPlan: row[6] ?? "",
    degree: row[7] ?? "",
    batch: row[8] ?? "",
    yearsOfExperience: row[9] ?? "",
    scores: {
      technicalDepth: parseNumber(row[10]),
      personality: parseNumber(row[11]),
      communication: parseNumber(row[12]),
      khandaniPan: parseNumber(row[13]),
    },
    archetype: parseArchetype(row[14]),
    evaluators: row[15] ?? "",
    notes: row[16] ?? "",
    status: parseStatus(row[17]),
    source: parseSource(row[18]),
    resumeFileName: row[19] ?? "",
    resumeUrl: row[20] ?? "",
    resumeText: row[21] ?? "",
    geminiInsight: geminiInsightFromSheet(row),
    geminiUpdatedAt: row[34] ?? "",
    sourceSubmissionId: row[35] ?? "",
    createdAt: row[36] ?? "",
    updatedAt: row[37] ?? row[36] ?? "",
  };
}

export function legacySheetRowToCandidate(row: readonly string[]): Candidate {
  return {
    id: row[0] ?? "",
    name: row[1] ?? "",
    email: row[2] ?? "",
    phone: row[3] ?? "",
    hometown: row[4] ?? "",
    currentCity: row[5] ?? "",
    graduationLocationPlan: row[6] ?? "",
    degree: row[7] ?? "",
    batch: row[8] ?? "",
    yearsOfExperience: row[9] ?? "",
    scores: {
      technicalDepth: parseNumber(row[10]),
      personality: parseNumber(row[11]),
      communication: parseNumber(row[12]),
      khandaniPan: parseNumber(row[13]),
    },
    archetype: parseArchetype(row[14]),
    evaluators: row[15] ?? "",
    notes: row[16] ?? "",
    status: parseStatus(row[17]),
    source: parseSource(row[18]),
    resumeFileName: row[19] ?? "",
    resumeUrl: row[20] ?? "",
    resumeText: row[21] ?? "",
    geminiInsight: row[22] ?? "",
    geminiUpdatedAt: row[23] ?? "",
    sourceSubmissionId: row[24] ?? "",
    createdAt: row[25] ?? "",
    updatedAt: row[26] ?? row[25] ?? "",
  };
}
