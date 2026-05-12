import { NextRequest, NextResponse } from "next/server";
import { generateCandidateInsight } from "@/lib/gemini-insights";
import { getCandidateById, upsertCandidate } from "@/lib/google-sheets";

export const runtime = "nodejs";

type InsightRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: NextRequest, context: InsightRouteContext) {
  const { id } = await context.params;
  const candidate = await getCandidateById(id);

  if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

  const now = new Date().toISOString();
  const updatedCandidate = {
    ...candidate,
    geminiInsight: await generateCandidateInsight(candidate),
    geminiUpdatedAt: now,
    updatedAt: now,
  };

  await upsertCandidate(updatedCandidate);

  return NextResponse.json({ candidate: updatedCandidate });
}
