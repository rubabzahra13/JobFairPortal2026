import { Candidate } from "./types";

const STORAGE_KEY = "vector_eval_candidates";

export function getCandidates(): Candidate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Candidate[]) : [];
  } catch {
    return [];
  }
}

export function saveCandidate(candidate: Candidate): void {
  const all = getCandidates();
  const idx = all.findIndex((c) => c.id === candidate.id);
  if (idx >= 0) {
    all[idx] = candidate;
  } else {
    all.unshift(candidate);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function deleteCandidate(id: string): void {
  const all = getCandidates().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function getCandidateById(id: string): Candidate | undefined {
  return getCandidates().find((c) => c.id === id);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
