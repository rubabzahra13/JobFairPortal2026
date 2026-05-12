import { NextRequest, NextResponse } from "next/server";
import { getCandidateById, upsertCandidate } from "@/lib/google-sheets";
import type { Candidate } from "@/lib/types";

export const runtime = "nodejs";

type CandidateRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: CandidateRouteContext) {
  const { id } = await context.params;
  const candidate = await getCandidateById(id);

  if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

  return NextResponse.json({ candidate });
}

export async function PATCH(request: NextRequest, context: CandidateRouteContext) {
  const { id } = await context.params;
  const existing = await getCandidateById(id);

  if (!existing) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

  let body: Partial<Candidate>;
  try {
    body = (await request.json()) as Partial<Candidate>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const candidate: Candidate = {
    ...existing,
    ...body,
    id: existing.id,
    scores: {
      ...existing.scores,
      ...body.scores,
    },
    updatedAt: new Date().toISOString(),
  };

  await upsertCandidate(candidate);

  return NextResponse.json({ candidate });
}
