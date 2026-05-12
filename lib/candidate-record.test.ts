import { describe, expect, it } from "vitest";
import type { Candidate } from "./types";
import {
  CANDIDATE_SHEET_HEADERS,
  candidateToSheetRow,
  sheetRowToCandidate,
} from "./candidate-record";

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
  geminiInsight: "High ownership signal.",
  geminiUpdatedAt: "2026-05-12T14:00:00.000Z",
  sourceSubmissionId: "submission_1",
  createdAt: "2026-05-12T14:00:00.000Z",
  updatedAt: "2026-05-12T14:05:00.000Z",
};

describe("candidate sheet mapping", () => {
  it("keeps stable Google Sheet headers for shared candidate records", () => {
    expect(CANDIDATE_SHEET_HEADERS).toEqual([
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
    ]);
  });

  it("round trips intake, scoring, status, source, resume, and insight fields", () => {
    expect(sheetRowToCandidate(candidateToSheetRow(candidate))).toEqual(candidate);
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
