import type { Archetype, Scores } from "@/lib/types";

const ARCHETYPES: readonly Archetype[] = [
  "astronaut",
  "pilot",
  "bus_driver",
  "taxi_rider",
] as const;

export function clampCvScore(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(10, Math.max(1, Math.round(n)));
}

export function normalizeSuggestedArchetype(value: unknown): Archetype | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim().toLowerCase().replace(/\s+/g, "_");
  return ARCHETYPES.includes(v as Archetype) ? (v as Archetype) : undefined;
}

export function normalizeSuggestedScores(value: unknown): Scores | undefined {
  if (!value || typeof value !== "object") return undefined;
  const o = value as Record<string, unknown>;
  return {
    technicalDepth: clampCvScore(o.technicalDepth, 5),
    personality: clampCvScore(o.personality, 5),
    communication: clampCvScore(o.communication, 5),
    khandaniPan: clampCvScore(o.khandaniPan, 5),
  };
}

export function normalizeSuggestionNote(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  if (!t) return undefined;
  return t.length > 150 ? `${t.slice(0, 147)}...` : t;
}

const PERSONALITY_SUMMARY_MAX = 400;

/** 2-3 line personality read from CV for notes section. */
export function normalizePersonalitySummary(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  if (!t) return undefined;
  return t.length > PERSONALITY_SUMMARY_MAX
    ? `${t.slice(0, PERSONALITY_SUMMARY_MAX - 3)}...`
    : t;
}

const SCORE_REASON_KEYS: (keyof Scores)[] = [
  "technicalDepth",
  "personality",
  "communication",
  "khandaniPan",
];

const REASON_MAX = 420;

function trimReasonField(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  if (!t) return undefined;
  return t.length > REASON_MAX ? `${t.slice(0, REASON_MAX - 3)}...` : t;
}

/** Per-dimension CV-only rationale for suggested scores. */
export function normalizeSuggestedScoreReasons(
  value: unknown
): Partial<Record<keyof Scores, string>> | undefined {
  if (!value || typeof value !== "object") return undefined;
  const o = value as Record<string, unknown>;
  const out: Partial<Record<keyof Scores, string>> = {};
  for (const k of SCORE_REASON_KEYS) {
    const r = trimReasonField(o[k]);
    if (r) out[k] = r;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}
