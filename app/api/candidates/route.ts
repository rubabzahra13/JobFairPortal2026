import { NextRequest, NextResponse } from "next/server";
import { listCandidates, upsertCandidate } from "@/lib/google-sheets";
import { normalizeCandidateEvaluation } from "@/lib/evaluator-scorecards";
import type { Candidate, Scores } from "@/lib/types";

export const runtime = "nodejs";

const DEFAULT_SCORES: Scores = {
  technicalDepth: 5,
  personality: 5,
  communication: 5,
  khandaniPan: 5,
};

export async function GET() {
  const candidates = await listCandidates();
  return NextResponse.json({ candidates });
}

export async function POST(request: NextRequest) {
  let body: Partial<Candidate>;

  try {
    body = (await request.json()) as Partial<Candidate>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const candidate = normalizeCandidateEvaluation({
    id: body.id || `cand_${crypto.randomUUID()}`,
    name: stringField(body.name),
    email: body.email,
    phone: body.phone,
    hometown: stringField(body.hometown),
    currentCity: body.currentCity,
    graduationLocationPlan: body.graduationLocationPlan,
    degree: stringField(body.degree),
    batch: stringField(body.batch),
    yearsOfExperience: body.yearsOfExperience || "",
    scores: { ...DEFAULT_SCORES, ...body.scores },
    archetype: body.archetype || "pilot",
    evaluators: body.evaluators || "",
    notes: body.notes || "",
    status: body.status || "screening",
    source: "panel",
    resumeFileName: body.resumeFileName,
    resumeUrl: body.resumeUrl,
    resumeText: body.resumeText,
    evaluatorScorecards: body.evaluatorScorecards,
    geminiInsight: body.geminiInsight,
    geminiUpdatedAt: body.geminiUpdatedAt,
    sourceSubmissionId: body.sourceSubmissionId,
    createdAt: body.createdAt || now,
    updatedAt: now,
  });

  await upsertCandidate(candidate);

  return NextResponse.json({ candidate }, { status: 201 });
}

function stringField(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
