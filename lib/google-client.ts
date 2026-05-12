import { google } from "googleapis";

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
] as const;

export function getGoogleAuthClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!email || !privateKey) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY are required");
  }

  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: [...GOOGLE_SCOPES],
  });
}

export function getGoogleSheetsClient() {
  return google.sheets({ version: "v4", auth: getGoogleAuthClient() });
}

export function getGoogleDriveClient() {
  return google.drive({ version: "v3", auth: getGoogleAuthClient() });
}
