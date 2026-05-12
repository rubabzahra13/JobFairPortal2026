import { describe, expect, it } from "vitest";
import { PANEL_EVALUATORS, type Candidate } from "./types";
import {
  CANDIDATE_STATUSES,
  CANDIDATE_SHEET_HEADERS,
  candidateToSheetRow,
  legacySheetRowToCandidate,
  parseCandidateGeminiInsight,
  sheetRowToCandidate,
} from "./candidate-record";

const geminiInsight = JSON.stringify({
  summary: "High ownership signal.",
  suggestedScores: {
    technicalDepth: 7,
    personality: 9,
    communication: 8,
    khandaniPan: 8,
  },
  scoreReasons: {
    technicalDepth: "React internship signal.",
    personality: "Shows strong ownership.",
    communication: "Clear written answers.",
    khandaniPan: "Grounded Islamabad plan.",
  },
  interviewPrompts: ["What did you build?", "Why VECTOR?", "Where will you be after graduation?"],
  risks: ["Verify depth.", "Confirm availability."],
  locationFit: "Plans to stay in Islamabad.",
});

const candidate: Candidate = {
  id: "cand_1",
  name: "Ayesha Khan",
  email: "ayesha@example.com",
  phone: "03001234567",
  hometown: "Rawalpindi",
  currentCity: "Islamabad",
  graduationLocationPlan: "Islamabad after graduation",
  degree: "BS Computer Science",
  batch: "2026",
  yearsOfExperience: "Internship",
  scores: {
    technicalDepth: 6,
    personality: 9,
    communication: 8,
    khandaniPan: 8,
  },
  archetype: "pilot",
  evaluators: "Ibrahim",
  notes: "Strong communicator",
  status: "screening",
  source: "qr",
  resumeFileName: "ayesha.pdf",
  resumeUrl: "https://drive.google.com/file/d/abc/view",
  resumeText: "React internship",
  geminiInsight,
  geminiUpdatedAt: "2026-05-12T14:00:00.000Z",
  sourceSubmissionId: "submission_1",
  createdAt: "2026-05-12T14:00:00.000Z",
  updatedAt: "2026-05-12T14:05:00.000Z",
};

describe("candidate sheet mapping", () => {
  it("keeps stable Google Sheet headers for shared candidate records", () => {
    expect(CANDIDATE_SHEET_HEADERS).toEqual([
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
      "Aggregate Technical Score",
      "Aggregate Personality Score",
      "Aggregate Communication Score",
      "Aggregate Khandani Pan Score",
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
      "Evaluator Count",
      "Submitted Evaluators",
      ...PANEL_EVALUATORS.flatMap((evaluator) => [
        `${evaluator.displayName} Technical`,
        `${evaluator.displayName} Personality`,
        `${evaluator.displayName} Communication`,
        `${evaluator.displayName} Khandani Pan`,
        `${evaluator.displayName} Notes`,
        `${evaluator.displayName} Updated At`,
      ]),
    ]);
  });

  it("round trips intake, scoring, status, source, resume, and insight fields", () => {
    expect(sheetRowToCandidate(candidateToSheetRow(candidate))).toEqual(candidate);
  });

  it("keeps no-show candidates as an explicit status in sheet rows", () => {
    const noShowCandidate: Candidate = {
      ...candidate,
      status: "no_show",
    };

    expect(CANDIDATE_STATUSES).toContain("no_show");
    expect(candidateToSheetRow(noShowCandidate)[17]).toBe("no_show");
    expect(sheetRowToCandidate(candidateToSheetRow(noShowCandidate)).status).toBe("no_show");
  });

  it("writes Gemini fields as readable sheet columns instead of JSON", () => {
    const row = candidateToSheetRow(candidate);

    expect(row[22]).toBe("High ownership signal.");
    expect(row[23]).toBe("7");
    expect(row[31]).toBe(
      "What did you build?\nWhy VECTOR?\nWhere will you be after graduation?"
    );
    expect(row.some((cell) => cell.includes("\"suggestedScores\""))).toBe(false);
  });

  it("writes per-evaluator scorecards and aggregate scores to the sheet", () => {
    const row = candidateToSheetRow({
      ...candidate,
      evaluatorScorecards: {
        ibrahim: {
          evaluatorId: "ibrahim",
          displayName: "Ibrahim Basit",
          scores: { technicalDepth: 8, personality: 9, communication: 7, khandaniPan: 8 },
          notes: "Strong ownership.",
          updatedAt: "2026-05-12T15:00:00.000Z",
        },
        rubab: {
          evaluatorId: "rubab",
          displayName: "Rubab",
          scores: { technicalDepth: 6, personality: 7, communication: 9, khandaniPan: 7 },
          notes: "Clear communicator.",
          updatedAt: "2026-05-12T15:05:00.000Z",
        },
      },
    });
    const parsed = sheetRowToCandidate(row);

    expect(row[10]).toBe("7");
    expect(row[11]).toBe("8");
    expect(row[38]).toBe("2");
    expect(row[39]).toBe("Ibrahim Basit, Rubab");
    expect(row[40]).toBe("8");
    expect(row[44]).toBe("Strong ownership.");
    expect(row[52]).toBe("6");
    expect(row[56]).toBe("Clear communicator.");
    expect(parsed.scores).toEqual({
      technicalDepth: 7,
      personality: 8,
      communication: 8,
      khandaniPan: 8,
    });
    expect(parsed.evaluatorScorecards?.rubab?.scores.communication).toBe(9);
  });

  it("can parse old raw Gemini JSON rows for migration", () => {
    const legacy = legacySheetRowToCandidate([
      "cand_1",
      "Ayesha Khan",
      "ayesha@example.com",
      "03001234567",
      "Rawalpindi",
      "Islamabad",
      "Islamabad after graduation",
      "BS Computer Science",
      "2026",
      "Internship",
      "6",
      "9",
      "8",
      "8",
      "pilot",
      "Ibrahim",
      "Strong communicator",
      "screening",
      "qr",
      "ayesha.pdf",
      "https://drive.google.com/file/d/abc/view",
      "React internship",
      geminiInsight,
      "2026-05-12T14:00:00.000Z",
      "submission_1",
      "2026-05-12T14:00:00.000Z",
      "2026-05-12T14:05:00.000Z",
    ]);

    expect(parseCandidateGeminiInsight(legacy.geminiInsight)?.summary).toBe(
      "High ownership signal."
    );
    expect(candidateToSheetRow(legacy)[22]).toBe("High ownership signal.");
  });

  it("uses shared backend defaults for older sparse rows", () => {
    const parsed = sheetRowToCandidate(["cand_2", "Ali"]);

    expect(parsed).toMatchObject({
      id: "cand_2",
      name: "Ali",
      scores: {
        technicalDepth: 0,
        personality: 0,
        communication: 0,
        khandaniPan: 0,
      },
      archetype: "pilot",
      status: "screening",
      source: "panel",
    });
  });
});
