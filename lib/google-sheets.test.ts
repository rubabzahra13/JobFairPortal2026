import { describe, expect, it } from "vitest";
import {
  findCandidateSheetRowNumber,
  hasCandidateSheetTab,
  isCandidateSheetHeaderRow,
} from "./google-sheets";
import { CANDIDATE_SHEET_HEADERS } from "./candidate-record";

describe("google sheets helpers", () => {
  it("detects the shared candidate header row exactly", () => {
    expect(isCandidateSheetHeaderRow([...CANDIDATE_SHEET_HEADERS])).toBe(true);
    expect(isCandidateSheetHeaderRow(["id", "name"])).toBe(false);
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
});
