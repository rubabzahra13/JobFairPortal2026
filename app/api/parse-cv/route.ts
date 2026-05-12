import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  normalizeSuggestedArchetype,
  normalizeSuggestedScores,
  normalizeSuggestedScoreReasons,
  normalizeSuggestionNote,
  normalizePersonalitySummary,
} from "@/lib/cv-parse-shared";
import { FIELD_GUIDE_SCORE_RUBRIC } from "@/lib/field-guide-rubric";
import type { Archetype, Scores } from "@/lib/types";

export const runtime = "nodejs";

const SYSTEM_PROMPT =
  "You are a CV parser and hiring assistant for a university job fair. Extract structured fields and conservative evaluation suggestions from text only. Respond with valid JSON only — no markdown, no code fences, no commentary.";

const RUBRIC_PROMPT = `${FIELD_GUIDE_SCORE_RUBRIC}

You also output EVALUATION SUGGESTIONS inferred only from the written CV (no live interview). Humans must confirm at the booth.

Archetype (exactly one string for key suggestedArchetype):
- "astronaut": mission-driven, ownership, strong projects/research/competition, clear hunger to build; exponential signals.
- "pilot": steady, reliable growth, solid internships/work, learns and ships; backbone-team signals.
- "bus_driver": competent but generic CV, narrow impact, reads like going through motions without standout hunger.
- "taxi_rider": job-hopping without depth, buzzword-heavy shallow bullets, no sustained build signal.

Scores (integers 1-10 each) for key suggestedScores object with keys exactly:
technicalDepth, personality, communication, khandaniPan
Choose each integer using ONLY the FIELD GUIDE dimension definitions and bands above (1-4 weak, 5-7 average, 8-10 strong). suggestedScores must be consistent with what you write in suggestedScoreReasons for that same key.

Also include evaluationSuggestionNote: one concise sentence (max 120 chars) summarizing strengths and growth areas across dimensions. Example style: "Strong technical skills with solid project experience; potential for growth in personality and communication."

Also include personalitySummary: 2-3 sentences (max 350 chars) capturing who this person seems to be based on the CV — their energy, drive, what makes them tick. Write in a warm but honest tone like a colleague describing someone after meeting them. Focus on personality signals, not technical skills. Examples of good signals: project passion, leadership style, curiosity patterns, commitment to causes, how they describe their work.

Include suggestedScoreReasons: an object with the SAME four keys as suggestedScores. For EACH key, write one tight paragraph (max ~400 characters) that MUST do all of the following:
1. State the score as "N/10" where N is the SAME integer as suggestedScores for that key.
2. Name the band explicitly using the guide wording: "1-4 weak", "5-7 average", or "8-10 strong" (pick the band that contains N).
3. Map CV evidence to the guide: say which Strong/Average/Weak bullet from that dimension best fits, using a concrete CV anchor (named project, stack, internship duration, leadership line, or resume structure).
4. Calibrate the exact N: one short phrase explaining why N is not clearly one point higher or lower when that is non-obvious (e.g. "not 8: no independent system/trade-off narrative" or "not 5: multiple shipped projects listed").
Avoid generic praise with no rubric tie-in. If the CV is silent on a dimension, say "CV silent on …", keep a conservative score, and explain from absence or writing-only proxies only.

Be conservative when evidence is weak — default toward mid scores (5-6) and pilot unless CV clearly supports otherwise.`;

function buildPrompt(cvText: string): string {
  return `Extract CV fields AND evaluation suggestions from this resume. Return ONLY one valid JSON object with these exact keys:

{
  "name": "",
  "email": "",
  "phone": "",
  "degree": "",
  "university": "",
  "batch": "",
  "experience": "",
  "skills": "",
  "hometown": "",
  "suggestedArchetype": "astronaut" | "pilot" | "bus_driver" | "taxi_rider",
  "suggestedScores": {
    "technicalDepth": 1,
    "personality": 1,
    "communication": 1,
    "khandaniPan": 1
  },
  "suggestedScoreReasons": {
    "technicalDepth": "Evidence from CV for this score",
    "personality": "",
    "communication": "",
    "khandaniPan": ""
  },
  "evaluationSuggestionNote": "short reason",
  "personalitySummary": "2-3 sentences about who they are"
}

${RUBRIC_PROMPT}

Use empty strings for missing contact fields. suggestedArchetype and suggestedScores must always be present (use "pilot" and mid scores if the CV is empty or ambiguous). suggestedScoreReasons must always be present with all four keys (use empty string only if you truly have zero signal for that dimension).

CV Content:
${cvText.slice(0, 8000)}`;
}

async function callOpenAI(prompt: string): Promise<string> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 1600,
  });

  return completion.choices[0]?.message?.content || "{}";
}

async function callGemini(prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1600,
    },
  });

  const result = await model.generateContent([
    { text: `${SYSTEM_PROMPT}\n\n${prompt}` },
  ]);

  return result.response.text();
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasGemini = !!process.env.GEMINI_API_KEY;

    if (!hasOpenAI && !hasGemini) {
      return NextResponse.json(
        { error: "No AI API key configured. Set OPENAI_API_KEY or GEMINI_API_KEY." },
        { status: 500 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let cvText = "";
    try {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      cvText = textResult.text;
      await parser.destroy();
    } catch (pdfError) {
      console.error("PDF parsing error:", pdfError);
      return NextResponse.json(
        {
          error: `Could not read PDF: ${pdfError instanceof Error ? pdfError.message : "Unknown error"}`,
        },
        { status: 400 }
      );
    }

    if (!cvText.trim()) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from PDF. The file may be image-based or corrupted.",
        },
        { status: 400 }
      );
    }

    const prompt = buildPrompt(cvText);

    let content: string;
    try {
      if (hasGemini) {
        content = await callGemini(prompt);
      } else {
        content = await callOpenAI(prompt);
      }
    } catch (aiError) {
      console.error("AI API error:", aiError);
      return NextResponse.json(
        { error: "AI API call failed. Check your API key and try again." },
        { status: 500 }
      );
    }

    const jsonStr = content.replace(/```json\n?|\n?```/g, "").trim();

    try {
      const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

      const data = {
        name: String(parsed.name ?? "").trim(),
        email: String(parsed.email ?? "").trim(),
        phone: String(parsed.phone ?? "").trim(),
        degree: String(parsed.degree ?? "").trim(),
        university: String(parsed.university ?? "").trim(),
        batch: String(parsed.batch ?? "").trim(),
        experience: String(parsed.experience ?? "").trim(),
        skills: String(parsed.skills ?? "").trim(),
        hometown: String(parsed.hometown ?? "").trim(),
      };

      const arch =
        normalizeSuggestedArchetype(parsed.suggestedArchetype) ?? ("pilot" as Archetype);
      const scores: Scores =
        normalizeSuggestedScores(parsed.suggestedScores) ??
        ({
          technicalDepth: 5,
          personality: 5,
          communication: 5,
          khandaniPan: 5,
        } satisfies Scores);

      const suggestions = {
        archetype: arch,
        scores,
        scoreReasons: normalizeSuggestedScoreReasons(parsed.suggestedScoreReasons),
        note: normalizeSuggestionNote(parsed.evaluationSuggestionNote),
        personalitySummary: normalizePersonalitySummary(parsed.personalitySummary),
      };

      return NextResponse.json({ success: true, data, suggestions, cvText });
    } catch {
      return NextResponse.json(
        { error: "Failed to parse LLM response", raw: content },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("CV parsing error:", error);
    return NextResponse.json({ error: "Failed to parse CV" }, { status: 500 });
  }
}
