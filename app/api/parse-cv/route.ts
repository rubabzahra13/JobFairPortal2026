import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Convert file to buffer and parse PDF
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    let cvText = "";
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse");
      const pdfData = await pdfParse(buffer);
      cvText = pdfData.text;
    } catch (pdfError) {
      console.error("PDF parsing error:", pdfError);
      return NextResponse.json(
        { error: `Could not read PDF: ${pdfError instanceof Error ? pdfError.message : "Unknown error"}` },
        { status: 400 }
      );
    }

    if (!cvText.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from PDF. The file may be image-based or corrupted." },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `Extract the following information from this CV/resume. Return ONLY a valid JSON object with these exact keys. If a field is not found, use an empty string.

{
  "name": "full name of the candidate",
  "email": "email address",
  "phone": "phone number",
  "degree": "degree and major (e.g., 'BS Computer Science')",
  "university": "university or institution name",
  "batch": "graduation year or current semester (e.g., '2025' or '7th Semester')",
  "experience": "brief experience summary (e.g., '1 internship at XYZ' or '2 years')",
  "skills": "key technical skills, comma separated",
  "hometown": "city/location if mentioned"
}

CV Content:
${cvText.slice(0, 8000)}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a CV parser. Extract structured information from resumes. Always respond with valid JSON only, no markdown or explanation.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content || "{}";
    
    // Clean up potential markdown formatting
    const jsonStr = content.replace(/```json\n?|\n?```/g, "").trim();
    
    try {
      const parsed = JSON.parse(jsonStr);
      return NextResponse.json({ success: true, data: parsed, cvText });
    } catch {
      return NextResponse.json(
        { error: "Failed to parse LLM response", raw: content },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("CV parsing error:", error);
    return NextResponse.json(
      { error: "Failed to parse CV" },
      { status: 500 }
    );
  }
}
