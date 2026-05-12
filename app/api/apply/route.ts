import { NextRequest, NextResponse } from "next/server";
import { uploadResumeToDrive } from "@/lib/google-drive";
import { upsertCandidate } from "@/lib/google-sheets";
import { generateCandidateInsight } from "@/lib/gemini-insights";
import { saveResumeLocally } from "@/lib/local-resume-storage";
import type { Candidate, Scores } from "@/lib/types";

export const runtime = "nodejs";

const DEFAULT_SCORES: Scores = {
  technicalDepth: 5,
  personality: 5,
  communication: 5,
  khandaniPan: 5,
};

export async function POST(request: NextRequest) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data" }, { status: 400 });
  }

  const name = formValue(formData, "name");
  const email = formValue(formData, "email");
  const phone = formValue(formData, "phone");
  const degree = formValue(formData, "degree");
  const batch = formValue(formData, "batch");
  const hometown = formValue(formData, "hometown");
  const graduationLocationPlan = formValue(formData, "graduationLocationPlan");

  if (!name || !email || !phone || !degree || !batch || !hometown || !graduationLocationPlan) {
    return NextResponse.json(
      {
        error:
          "name, email, phone, degree, batch, hometown, and graduationLocationPlan are required",
      },
      { status: 400 }
    );
  }

  const warnings: string[] = [];
  const now = new Date().toISOString();
  const candidateId = `cand_${crypto.randomUUID()}`;
  const file = formData.get("file");
  let resumeFileName = "";
  let resumeUrl = "";
  let resumeText = "";

  if (file instanceof File && file.size > 0) {
    if (isPdf(file)) {
      try {
        resumeText = await parsePdfText(file);
      } catch (error) {
        warnings.push(warningMessage("Resume PDF could not be parsed", error));
      }
    }

    try {
      const uploaded = await uploadResumeToDrive(file, candidateId);
      resumeFileName = uploaded.fileName;
      resumeUrl = uploaded.url;
    } catch (error) {
      warnings.push(warningMessage("Resume upload failed", error));
      try {
        const uploaded = await saveResumeLocally(file, candidateId);
        resumeFileName = uploaded.fileName;
        resumeUrl = uploaded.url;
        warnings.push("Resume saved to local backend storage instead of Google Drive.");
      } catch (localError) {
        resumeFileName = file.name;
        warnings.push(warningMessage("Local resume fallback failed", localError));
      }
    }
  }

  const candidate: Candidate = {
    id: candidateId,
    name,
    email,
    phone,
    degree,
    batch,
    hometown,
    currentCity: formValue(formData, "currentCity"),
    graduationLocationPlan,
    yearsOfExperience: "",
    scores: DEFAULT_SCORES,
    archetype: "pilot",
    evaluators: "",
    notes: "",
    status: "screening",
    source: "qr",
    resumeFileName,
    resumeUrl,
    resumeText,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const insight = await generateCandidateInsight(candidate);
    if (insight) {
      candidate.geminiInsight = insight;
      candidate.geminiUpdatedAt = new Date().toISOString();
    }
  } catch (error) {
    warnings.push(warningMessage("Gemini insight generation failed", error));
  }

  await upsertCandidate(candidate);

  return NextResponse.json(
    {
      candidate,
      warnings,
    },
    { status: 201 }
  );
}

function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isPdf(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

async function parsePdfText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return result.text.trim();
  } finally {
    await parser.destroy();
  }
}

function warningMessage(prefix: string, error: unknown): string {
  return `${prefix}: ${error instanceof Error ? error.message : "unknown error"}`;
}
