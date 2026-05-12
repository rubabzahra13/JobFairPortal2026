import { Candidate } from "./types";

type CandidatesResponse = {
  candidates?: Candidate[];
  candidate?: Candidate;
  error?: string;
};

async function readJson(response: Response): Promise<CandidatesResponse> {
  try {
    return (await response.json()) as CandidatesResponse;
  } catch {
    return {};
  }
}

function apiError(data: CandidatesResponse, fallback: string): Error {
  return new Error(data.error || fallback);
}

export async function getCandidates(): Promise<Candidate[]> {
  const response = await fetch("/api/candidates", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });
  const data = await readJson(response);

  if (!response.ok) throw apiError(data, "Failed to load candidates");
  return data.candidates ?? [];
}

export async function getCandidate(id: string): Promise<Candidate | null> {
  const response = await fetch(`/api/candidates/${encodeURIComponent(id)}`, {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });
  const data = await readJson(response);

  if (response.status === 404) return null;
  if (!response.ok) throw apiError(data, "Failed to load candidate");
  return data.candidate ?? null;
}

export const getCandidateById = getCandidate;

export async function saveCandidate(candidate: Candidate): Promise<Candidate> {
  if (candidate.id) {
    const patchResponse = await fetch(`/api/candidates/${encodeURIComponent(candidate.id)}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(candidate),
    });
    const patchData = await readJson(patchResponse);

    if (patchResponse.ok) {
      if (!patchData.candidate) throw new Error("Candidate API returned no candidate");
      return patchData.candidate;
    }

    if (patchResponse.status !== 404) {
      throw apiError(patchData, "Failed to save candidate");
    }
  }

  const response = await fetch("/api/candidates", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(candidate),
  });
  const data = await readJson(response);

  if (!response.ok) throw apiError(data, "Failed to save candidate");
  if (!data.candidate) throw new Error("Candidate API returned no candidate");

  return data.candidate;
}

export async function updateCandidateStatus(
  id: string,
  status: NonNullable<Candidate["status"]>
): Promise<Candidate> {
  const response = await fetch(`/api/candidates/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
  const data = await readJson(response);

  if (!response.ok) throw apiError(data, "Failed to update candidate status");
  if (!data.candidate) throw new Error("Candidate API returned no candidate");

  return data.candidate;
}

export async function deleteCandidate(id: string): Promise<never> {
  throw new Error(`Deleting candidate ${id} is not supported by the shared backend yet.`);
}

export function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `cand_${crypto.randomUUID()}`;
  }
  return `cand_${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
