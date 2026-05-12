import { deleteStoredCvPdf } from "./cv-storage";

export interface Submission {
  id: string;
  // Extracted from CV
  name: string;
  email: string;
  phone: string;
  degree: string;
  university: string;
  batch: string;
  experience: string;
  skills: string;
  hometown: string;
  // CV data
  cvText: string;
  cvFileName: string;
  // CV file (binary stored in IndexedDB; see lib/cv-storage.ts)
  cvStored?: boolean;
  // Status
  status: "pending" | "reviewed" | "evaluated";
  candidateId?: string; // Links to evaluated candidate
  // Timestamps
  submittedAt: string;
}

const STORAGE_KEY = "vector_eval_submissions";

export function getSubmissions(): Submission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Submission[]) : [];
  } catch {
    return [];
  }
}

export function saveSubmission(submission: Submission): void {
  const all = getSubmissions();
  const idx = all.findIndex((s) => s.id === submission.id);
  if (idx >= 0) {
    all[idx] = submission;
  } else {
    all.unshift(submission);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function getSubmissionById(id: string): Submission | undefined {
  return getSubmissions().find((s) => s.id === id);
}

export function updateSubmissionStatus(
  id: string,
  status: Submission["status"],
  candidateId?: string
): void {
  const submission = getSubmissionById(id);
  if (submission) {
    submission.status = status;
    if (candidateId) submission.candidateId = candidateId;
    saveSubmission(submission);
  }
}

export function getSubmissionByCandidateId(
  candidateId: string
): Submission | undefined {
  return getSubmissions().find((s) => s.candidateId === candidateId);
}

export function deleteSubmission(id: string): void {
  void deleteStoredCvPdf(id).catch(() => {});
  const all = getSubmissions().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function generateSubmissionId(): string {
  return `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
