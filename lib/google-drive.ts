import { Readable } from "node:stream";
import { getGoogleDriveClient } from "./google-client";

export type UploadedResume = {
  fileName: string;
  url: string;
};

function getFolderId(): string {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) throw new Error("GOOGLE_DRIVE_FOLDER_ID is required");
  return folderId;
}

export async function uploadResumeToDrive(
  file: File,
  candidateId: string
): Promise<UploadedResume> {
  const drive = getGoogleDriveClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = file.name || `${candidateId}-resume`;
  const fileName = `${candidateId}-${safeName}`.replace(/[^\w.\- ]+/g, "_");

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [getFolderId()],
    },
    media: {
      mimeType: file.type || "application/octet-stream",
      body: Readable.from(buffer),
    },
    fields: "id,name,webViewLink",
  });

  const id = response.data.id;
  if (!id) throw new Error("Google Drive upload did not return a file id");

  return {
    fileName: response.data.name ?? fileName,
    url: response.data.webViewLink ?? `https://drive.google.com/file/d/${id}/view`,
  };
}
