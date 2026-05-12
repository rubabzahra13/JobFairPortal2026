import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sheetsMock = vi.hoisted(() => ({
  spreadsheets: {
    get: vi.fn(),
    batchUpdate: vi.fn(),
    values: {
      get: vi.fn(),
      update: vi.fn(),
      append: vi.fn(),
    },
  },
}));

vi.mock("./google-client", () => ({
  getGoogleSheetsClient: () => sheetsMock,
}));

import {
  findCandidateSheetRowNumber,
  candidateRowFormatRequest,
  hasCandidateSheetTab,
  isCandidateSheetHeaderRow,
  isLegacyCandidateSheetHeaderRow,
  upsertCandidate,
} from "./google-sheets";
import { CANDIDATE_SHEET_HEADERS, LEGACY_CANDIDATE_SHEET_HEADERS } from "./candidate-record";
import type { Candidate } from "./types";

const originalGoogleSheetId = process.env.GOOGLE_SHEET_ID;

const candidate: Candidate = {
  id: "cand_1",
  name: "Ayesha Khan",
  email: "ayesha@example.com",
  phone: "03001234567",
  hometown: "Islamabad",
  degree: "Bachelor of Science in Computer Science",
  batch: "22",
  yearsOfExperience: "Internship",
  scores: {
    technicalDepth: 7,
    personality: 8,
    communication: 8,
    khandaniPan: 8,
  },
  archetype: "pilot",
  evaluators: "Ibrahim Basit",
  notes: "Strong communicator",
  status: "no_show",
  source: "panel",
  createdAt: "2026-05-13T00:00:00.000Z",
};

describe("google sheets helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_SHEET_ID = "sheet_123";
  });

  afterEach(() => {
    if (originalGoogleSheetId === undefined) delete process.env.GOOGLE_SHEET_ID;
    else process.env.GOOGLE_SHEET_ID = originalGoogleSheetId;
  });

  it("detects the shared candidate header row exactly", () => {
    expect(isCandidateSheetHeaderRow([...CANDIDATE_SHEET_HEADERS])).toBe(true);
    expect(isCandidateSheetHeaderRow(["id", "name"])).toBe(false);
  });

  it("detects the legacy raw JSON candidate header for migration", () => {
    expect(isLegacyCandidateSheetHeaderRow([...LEGACY_CANDIDATE_SHEET_HEADERS])).toBe(true);
    expect(isLegacyCandidateSheetHeaderRow([...CANDIDATE_SHEET_HEADERS])).toBe(false);
  });

  it("maps a candidate id in data rows to its one-based sheet row number", () => {
    const rows = [
      ["cand_1", "Ayesha"],
      ["cand_2", "Bilal"],
    ];

    expect(findCandidateSheetRowNumber(rows, "cand_2")).toBe(3);
    expect(findCandidateSheetRowNumber(rows, "missing")).toBeNull();
  });

  it("detects whether the Candidates tab already exists", () => {
    expect(hasCandidateSheetTab(["Sheet1", "Candidates"])).toBe(true);
    expect(hasCandidateSheetTab(["Sheet1", "Responses"])).toBe(false);
  });

  it("builds a red row format request for no-show candidates", () => {
    const request = candidateRowFormatRequest(42, 7, "no_show", 12);
    const repeatCell = request.repeatCell;

    expect(repeatCell.range).toEqual({
      sheetId: 42,
      startRowIndex: 6,
      endRowIndex: 7,
      startColumnIndex: 0,
      endColumnIndex: 12,
    });
    expect(repeatCell.cell.userEnteredFormat.backgroundColor.red).toBeGreaterThan(
      repeatCell.cell.userEnteredFormat.backgroundColor.green
    );
    expect(repeatCell.cell.userEnteredFormat.textFormat.bold).toBe(true);
  });

  it("builds a neutral row format request for candidates that are not no-show", () => {
    const request = candidateRowFormatRequest(42, 7, "screening", 12);
    const format = request.repeatCell.cell.userEnteredFormat;

    expect(format.backgroundColor).toEqual({ red: 1, green: 1, blue: 1 });
    expect(format.textFormat.bold).toBe(false);
  });

  it("formats the saved candidate row red when upserting a no-show candidate", async () => {
    sheetsMock.spreadsheets.get.mockResolvedValue({
      data: { sheets: [{ properties: { sheetId: 42, title: "Candidates" } }] },
    });
    sheetsMock.spreadsheets.values.get
      .mockResolvedValueOnce({ data: { values: [[...CANDIDATE_SHEET_HEADERS]] } })
      .mockResolvedValueOnce({ data: { values: [["cand_1", "Ayesha Khan"]] } });
    sheetsMock.spreadsheets.values.update.mockResolvedValue({ data: {} });
    sheetsMock.spreadsheets.batchUpdate.mockResolvedValue({ data: {} });

    await upsertCandidate(candidate);

    expect(sheetsMock.spreadsheets.values.update).toHaveBeenCalledWith(
      expect.objectContaining({
        range: expect.stringContaining("A2:"),
      })
    );
    expect(sheetsMock.spreadsheets.batchUpdate).toHaveBeenCalledWith({
      spreadsheetId: "sheet_123",
      requestBody: {
        requests: [
          expect.objectContaining({
            repeatCell: expect.objectContaining({
              range: expect.objectContaining({
                sheetId: 42,
                startRowIndex: 1,
                endRowIndex: 2,
              }),
              cell: expect.objectContaining({
                userEnteredFormat: expect.objectContaining({
                  backgroundColor: { red: 0.62, green: 0.06, blue: 0.08 },
                  textFormat: expect.objectContaining({ bold: true }),
                }),
              }),
            }),
          }),
        ],
      },
    });
  });
});
