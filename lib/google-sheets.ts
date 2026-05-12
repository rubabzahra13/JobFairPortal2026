import type { Candidate } from "./types";
import {
  CANDIDATE_SHEET_HEADERS,
  LEGACY_CANDIDATE_SHEET_HEADERS,
  candidateToSheetRow,
  legacySheetRowToCandidate,
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

export function isLegacyCandidateSheetHeaderRow(row: readonly string[]): boolean {
  return (
    row.length === LEGACY_CANDIDATE_SHEET_HEADERS.length &&
    LEGACY_CANDIDATE_SHEET_HEADERS.every((header, index) => row[index] === header)
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
    fields: "sheets.properties(sheetId,title)",
  });
  const candidateSheet = spreadsheet.data.sheets?.find(
    (sheet) => sheet.properties?.title === SHEET_NAME
  );
  let sheetId = candidateSheet?.properties?.sheetId;
  let shouldFormatSheet = false;

  if (sheetId === undefined) {
    const addSheetResponse = await sheets.spreadsheets.batchUpdate({
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
    sheetId = addSheetResponse.data.replies?.[0]?.addSheet?.properties?.sheetId;
    shouldFormatSheet = true;
  }

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetRange(`A1:${columnLetter(CANDIDATE_SHEET_HEADERS.length)}1`),
  });
  const currentHeader = response.data.values?.[0] ?? [];

  if (isCandidateSheetHeaderRow(currentHeader)) return;

  const legacyRows = isLegacyCandidateSheetHeaderRow(currentHeader)
    ? await readLegacyCandidateRows()
    : [];

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: sheetRange(`A1:${columnLetter(CANDIDATE_SHEET_HEADERS.length)}1`),
    valueInputOption: "RAW",
    requestBody: {
      values: [[...CANDIDATE_SHEET_HEADERS]],
    },
  });

  if (legacyRows.length > 0) {
    const migratedRows = legacyRows
      .filter((row) => row[0])
      .map((row) => candidateToSheetRow(legacySheetRowToCandidate(row)));

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: sheetRange(`A2:${columnLetter(CANDIDATE_SHEET_HEADERS.length)}${migratedRows.length + 1}`),
      valueInputOption: "RAW",
      requestBody: {
        values: migratedRows,
      },
    });
  }

  shouldFormatSheet = true;

  if (sheetId != null && shouldFormatSheet) {
    await formatCandidateSheet(sheetId);
  }
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

async function readLegacyCandidateRows(): Promise<string[][]> {
  const sheets = getGoogleSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: sheetRange(`A2:${columnLetter(LEGACY_CANDIDATE_SHEET_HEADERS.length)}`),
  });

  return (response.data.values ?? []).map((row) => row.map(String));
}

async function formatCandidateSheet(sheetId: number): Promise<void> {
  const sheets = getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const columnCount = CANDIDATE_SHEET_HEADERS.length;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          updateSheetProperties: {
            properties: {
              sheetId,
              gridProperties: {
                frozenRowCount: 1,
              },
            },
            fields: "gridProperties.frozenRowCount",
          },
        },
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: columnCount,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.055, green: 0.078, blue: 0.12 },
                horizontalAlignment: "CENTER",
                verticalAlignment: "MIDDLE",
                wrapStrategy: "WRAP",
                textFormat: {
                  bold: true,
                  foregroundColor: { red: 1, green: 1, blue: 1 },
                },
              },
            },
            fields:
              "userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,wrapStrategy,textFormat)",
          },
        },
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: columnCount,
            },
            cell: {
              userEnteredFormat: {
                verticalAlignment: "TOP",
                wrapStrategy: "WRAP",
              },
            },
            fields: "userEnteredFormat(verticalAlignment,wrapStrategy)",
          },
        },
        {
          setBasicFilter: {
            filter: {
              range: {
                sheetId,
                startRowIndex: 0,
                startColumnIndex: 0,
                endColumnIndex: columnCount,
              },
            },
          },
        },
        dimensionWidthRequest(sheetId, 0, 1, 170),
        dimensionWidthRequest(sheetId, 1, 4, 160),
        dimensionWidthRequest(sheetId, 4, 10, 190),
        dimensionWidthRequest(sheetId, 10, 14, 120),
        dimensionWidthRequest(sheetId, 14, 22, 160),
        dimensionWidthRequest(sheetId, 22, 34, 240),
        dimensionWidthRequest(sheetId, 34, 40, 155),
        dimensionWidthRequest(sheetId, 40, columnCount, 145),
      ],
    },
  });
}

function dimensionWidthRequest(
  sheetId: number,
  startIndex: number,
  endIndex: number,
  pixelSize: number
) {
  return {
    updateDimensionProperties: {
      range: {
        sheetId,
        dimension: "COLUMNS",
        startIndex,
        endIndex,
      },
      properties: {
        pixelSize,
      },
      fields: "pixelSize",
    },
  };
}
