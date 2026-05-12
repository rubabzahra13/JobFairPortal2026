import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const RESUME_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "resumes");

export function localResumeFileName(candidateId: string, originalName: string): string {
  const extension = path.extname(originalName).toLowerCase() || ".pdf";
  const safeId = candidateId.replace(/[^a-zA-Z0-9_-]/g, "-");
  return `${safeId}${extension}`;
}

export function publicResumeUrl(fileName: string): string {
  const baseUrl =
    process.env.BACKEND_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "";
  const pathName = `/uploads/resumes/${fileName}`;
  return baseUrl ? `${baseUrl.replace(/\/$/, "")}${pathName}` : pathName;
}

export async function saveResumeLocally(
  file: File,
  candidateId: string
): Promise<{ fileName: string; url: string }> {
  const fileName = localResumeFileName(candidateId, file.name);
  await mkdir(RESUME_UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(RESUME_UPLOAD_DIR, fileName), Buffer.from(await file.arrayBuffer()));
  return { fileName, url: publicResumeUrl(fileName) };
}
