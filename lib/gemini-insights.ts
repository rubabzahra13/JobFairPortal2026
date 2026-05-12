import { GoogleGenerativeAI } from "@google/generative-ai";
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

Return only compact JSON with keys:
- summary: one concise interviewer-facing paragraph
- suggestedScores: object with technicalDepth, personality, communication, khandaniPan numbers from 1-10 based only on available evidence
- scoreReasons: object with one short reason for each suggested score
- interviewPrompts: 3 focused questions
- risks: 2-3 risks or unknowns to verify
- locationFit: one sentence about Islamabad/FAST/VECTOR fit if supported by facts

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
      maxOutputTokens: 700,
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent([{ text: buildCandidateInsightPrompt(candidate) }]);
  const text = result.response.text().trim();

  return normalizeGeminiInsightText(text);
}

export function normalizeGeminiInsightText(text: string): string {
  try {
    return JSON.stringify(JSON.parse(stripMarkdownJsonFence(text)));
  } catch {
    return JSON.stringify({
      summary: stripMarkdownJsonFence(text),
      suggestedScores: null,
      scoreReasons: {},
      interviewPrompts: [],
      risks: ["Gemini returned a non-JSON insight; review manually."],
      locationFit: "",
    });
  }
}

export function stripMarkdownJsonFence(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}
