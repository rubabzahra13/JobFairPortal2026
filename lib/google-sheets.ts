import type { Candidate } from "./types";
import {
  CANDIDATE_SHEET_HEADERS,
  candidateToSheetRow,
  sheetRowToCandidate,
} from "./candidate-record";
import { getGoogleSheetsClient } from "./google-client";

const SHEET_NAME = "Candidates";

function getSpreadsheetId(): string {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID is required");
  return spreadsheetId;
}

function sheetRange(range: string): string {
  return `'${SHEET_NAME}'!${range}`;
}

export function isCandidateSheetHeaderRow(row: readonly string[]): boolean {
  return (
    row.length === CANDIDATE_SHEET_HEADERS.length &&
    CANDIDATE_SHEET_HEADERS.every((header, index) => row[index] === header)
  );
}

export function findCandidateSheetRowNumber(
  rows: readonly (readonly string[])[],
  candidateId: string
): number | null {
  const rowIndex = rows.findIndex((row) => row[0] === candidateId);
  return rowIndex === -1 ? null : rowIndex + 2;
}

export function hasCandidateSheetTab(sheetTitles: readonly string[]): boolean {
  return sheetTitles.includes(SHEET_NAME);
}

export async function ensureCandidateSheetHeaders(): Promise<void> {
  const sheets = getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties.title",
  });
  const sheetTitles =
    spreadsheet.data.sheets
      ?.map((sheet) => sheet.properties?.title)
      .filter((title): title is string => Boolean(title)) ?? [];

  if (!hasCandidateSheetTab(sheetTitles)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: SHEET_NAME,
              },
            },
          },
        ],
      },
    });
  }

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetRange(`A1:${columnLetter(CANDIDATE_SHEET_HEADERS.length)}1`),
  });
  const currentHeader = response.data.values?.[0] ?? [];

  if (isCandidateSheetHeaderRow(currentHeader)) return;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: sheetRange(`A1:${columnLetter(CANDIDATE_SHEET_HEADERS.length)}1`),
    valueInputOption: "RAW",
    requestBody: {
      values: [[...CANDIDATE_SHEET_HEADERS]],
    },
  });
}

export async function listCandidates(): Promise<Candidate[]> {
  await ensureCandidateSheetHeaders();

  const sheets = getGoogleSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: sheetRange(`A2:${columnLetter(CANDIDATE_SHEET_HEADERS.length)}`),
  });

  return (response.data.values ?? [])
    .filter((row) => row[0])
    .map((row) => sheetRowToCandidate(row.map(String)));
}

export async function getCandidateById(id: string): Promise<Candidate | null> {
  const candidates = await listCandidates();
  return candidates.find((candidate) => candidate.id === id) ?? null;
}

export async function upsertCandidate(candidate: Candidate): Promise<Candidate> {
  await ensureCandidateSheetHeaders();

  const sheets = getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const rowsResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetRange(`A2:${columnLetter(CANDIDATE_SHEET_HEADERS.length)}`),
  });
  const rows = (rowsResponse.data.values ?? []).map((row) => row.map(String));
  const row = candidateToSheetRow(candidate);
  const existingRowNumber = findCandidateSheetRowNumber(rows, candidate.id);

  if (existingRowNumber) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: sheetRange(
        `A${existingRowNumber}:${columnLetter(CANDIDATE_SHEET_HEADERS.length)}${existingRowNumber}`
      ),
      valueInputOption: "RAW",
      requestBody: { values: [row] },
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: sheetRange(`A:${columnLetter(CANDIDATE_SHEET_HEADERS.length)}`),
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });
  }

  return candidate;
}

function columnLetter(columnNumber: number): string {
  let dividend = columnNumber;
  let columnName = "";

  while (dividend > 0) {
    const modulo = (dividend - 1) % 26;
    columnName = String.fromCharCode(65 + modulo) + columnName;
    dividend = Math.floor((dividend - modulo) / 26);
  }

  return columnName;
}
