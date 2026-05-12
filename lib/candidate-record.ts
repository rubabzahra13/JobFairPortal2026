import type { Archetype, Candidate, Scores } from "./types";

export const CANDIDATE_STATUSES = ["screening", "shortlisted", "rejected", "hired"] as const;
export const CANDIDATE_SOURCES = ["qr", "panel", "import"] as const;

export const CANDIDATE_SHEET_HEADERS = [
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

type CandidateStatus = NonNullable<Candidate["status"]>;
type CandidateSource = NonNullable<Candidate["source"]>;

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

export function candidateToSheetRow(candidate: Candidate): string[] {
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
    candidate.geminiInsight ?? "",
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
    geminiInsight: row[22] ?? "",
    geminiUpdatedAt: row[23] ?? "",
    sourceSubmissionId: row[24] ?? "",
    createdAt: row[25] ?? "",
    updatedAt: row[26] ?? row[25] ?? "",
  };
}
