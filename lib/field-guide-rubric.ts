/**
 * Same scoring definitions as the internal Field Guide (/guide).
 * Used by /api/parse-cv so CV-only suggestions align with booth rubric.
 */
export const FIELD_GUIDE_SCORE_RUBRIC = `
FIELD GUIDE — use these definitions when choosing each 1–10 score and when writing suggestedScoreReasons.

Technical Depth (low = surface buzzwords, high = builds in their sleep):
• 8–10 Strong: Built projects independently, understands trade-offs, can whiteboard a system on the spot.
• 5–7 Average: Solid coursework knowledge, some projects, needs guidance on architecture.
• 1–4 Weak: Can recite definitions but can't apply them, no real building experience.

Personality (low = going through motions, high = would build at 2 AM for fun):
• 8–10 Strong: Infectious energy, asks sharp questions, visibly excited about technology and building.
• 5–7 Average: Pleasant, engaged, but playing it safe — not showing their real self yet.
• 1–4 Weak: Robotic, rehearsed answers, no spark, treats it like a transaction.

Communication & body language (low = can't hold eye contact, high = commands a room):
• 8–10 Strong: Steady eye contact, structured thinking out loud, comfortable with silence, articulate.
• 5–7 Average: Gets the point across but stumbles under pressure, decent but not polished.
• 1–4 Weak: Avoids eye contact, mumbles, can't organize thoughts, visibly uncomfortable.

Khandani Pan (low = no anchor, high = person you'd trust with your keys):
• 8–10 Strong: Talks about family, obligations, or long-term goals naturally, shows maturity beyond their age.
• 5–7 Average: Seems stable but hard to read — give them the benefit of the doubt.
• 1–4 Weak: Entitled attitude, no sense of sacrifice, everything is about what's in it for me.

Band summary: 1–4 = weak, 5–7 = average, 8–10 = strong (for CV-inferred signals only).
`;
