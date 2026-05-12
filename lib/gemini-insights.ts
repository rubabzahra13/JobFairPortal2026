import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { ResponseSchema } from "@google/generative-ai";
import type { Candidate } from "./types";

type CandidateInsightPayload = Pick<
  Candidate,
  | "id"
  | "name"
  | "hometown"
  | "currentCity"
  | "graduationLocationPlan"
  | "degree"
  | "batch"
  | "yearsOfExperience"
  | "scores"
  | "archetype"
  | "evaluators"
  | "notes"
  | "resumeText"
>;

const SYSTEM_INTENT =
  "You are supporting VECTOR Inc FAST Islamabad job fair interviewers. Judge personality, communication, ownership, and location fit more than raw technical depth. do not invent facts. do not make a final hiring decision. Produce interview prompts and risks for humans to verify.";

const INSIGHT_RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING },
    suggestedScores: {
      type: SchemaType.OBJECT,
      properties: {
        technicalDepth: { type: SchemaType.NUMBER },
        personality: { type: SchemaType.NUMBER },
        communication: { type: SchemaType.NUMBER },
        khandaniPan: { type: SchemaType.NUMBER },
      },
      required: ["technicalDepth", "personality", "communication", "khandaniPan"],
    },
    scoreReasons: {
      type: SchemaType.OBJECT,
      properties: {
        technicalDepth: { type: SchemaType.STRING },
        personality: { type: SchemaType.STRING },
        communication: { type: SchemaType.STRING },
        khandaniPan: { type: SchemaType.STRING },
      },
      required: ["technicalDepth", "personality", "communication", "khandaniPan"],
    },
    interviewPrompts: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    risks: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    locationFit: { type: SchemaType.STRING },
  },
  required: [
    "summary",
    "suggestedScores",
    "scoreReasons",
    "interviewPrompts",
    "risks",
    "locationFit",
  ],
};

export function getGeminiModelName(): string {
  return process.env.GEMINI_MODEL || "gemini-2.5-flash";
}

export function serializeCandidateForInsight(candidate: Candidate): CandidateInsightPayload {
  return {
    id: candidate.id,
    name: candidate.name,
    hometown: candidate.hometown,
    currentCity: candidate.currentCity,
    graduationLocationPlan: candidate.graduationLocationPlan,
    degree: candidate.degree,
    batch: candidate.batch,
    yearsOfExperience: candidate.yearsOfExperience,
    scores: candidate.scores,
    archetype: candidate.archetype,
    evaluators: candidate.evaluators,
    notes: candidate.notes,
    resumeText: candidate.resumeText,
  };
}

export function buildCandidateInsightPrompt(candidate: Candidate): string {
  const payload = JSON.stringify(serializeCandidateForInsight(candidate));

  return `${SYSTEM_INTENT}

Return only minified JSON with keys:
- summary: one interviewer-facing sentence under 35 words
- suggestedScores: object with technicalDepth, personality, communication, khandaniPan numbers from 1-10 based only on available evidence
- scoreReasons: object with one reason under 12 words for each suggested score
- interviewPrompts: exactly 3 focused questions, each under 16 words
- risks: exactly 2 risks or unknowns to verify, each under 16 words
- locationFit: one sentence under 20 words about Islamabad/FAST/VECTOR fit if supported by facts

Candidate:
${payload}`;
}

export async function generateCandidateInsight(candidate: Candidate): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "";

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: getGeminiModelName(),
    generationConfig: {
      temperature: 0.25,
      maxOutputTokens: 1400,
      responseMimeType: "application/json",
      responseSchema: INSIGHT_RESPONSE_SCHEMA,
    },
  });

  const result = await model.generateContent([{ text: buildCandidateInsightPrompt(candidate) }]);
  const text = result.response.text().trim();

  return normalizeGeminiInsightText(text);
}

export function normalizeGeminiInsightText(text: string): string {
  const parsed = parseGeminiInsightText(text);
  if (parsed) return JSON.stringify(parsed);

  const fallbackSummary = stripMarkdownJsonFence(text);

  try {
    const extracted = extractJsonObject(fallbackSummary);
    if (extracted) return JSON.stringify(JSON.parse(extracted));
  } catch {
    // Fall through to the safe fallback below.
  }

  return JSON.stringify({
    summary: fallbackSummary,
    suggestedScores: null,
    scoreReasons: {},
    interviewPrompts: [],
    risks: ["Gemini returned a non-JSON insight; review manually."],
    locationFit: "",
  });
}

function parseGeminiInsightText(text: string): Record<string, unknown> | null {
  const stripped = stripMarkdownJsonFence(text);
  const candidates = [stripped, extractJsonObject(stripped)].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      const parsed: unknown = JSON.parse(candidate);
      if (typeof parsed === "string") {
        const nested = JSON.parse(stripMarkdownJsonFence(parsed));
        return isRecord(nested) ? nested : null;
      }

      if (isRecord(parsed)) return parsed;
    } catch {
      continue;
    }
  }

  return null;
}

function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) return null;

  return text.slice(start, end + 1);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function stripMarkdownJsonFence(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}
