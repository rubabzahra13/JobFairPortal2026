export type Archetype = "astronaut" | "pilot" | "bus_driver" | "taxi_rider";

export interface Scores {
  technicalDepth: number;
  personality: number;
  communication: number;
  khandaniPan: number;
}

export interface Candidate {
  id: string;
  name: string;
  // Metadata
  hometown: string;
  degree: string;
  batch: string;
  yearsOfExperience: string;
  // Scores 1-10
  scores: Scores;
  // Archetype tag
  archetype: Archetype;
  // Evaluators
  evaluators: string;
  // Notes
  notes: string;
  // Link back to CV submission (IndexedDB PDF key)
  sourceSubmissionId?: string;
  // Timestamp
  createdAt: string;
}

export const ARCHETYPE_META: Record<
  Archetype,
  {
    label: string;
    icon: string;
    tagline: string;
    priority: string;
    color: string;
    bgColor: string;
    borderColor: string;
    description: string;
  }
> = {
  astronaut: {
    label: "The Astronaut",
    icon: "A",
    tagline: "Priority Hire — Move Fast, Don't Lose Them",
    priority: "PRIORITY",
    color: "text-[oklch(0.78_0.17_65)]",
    bgColor: "bg-[oklch(0.22_0.06_65)]",
    borderColor: "border-[oklch(0.78_0.17_65/0.4)]",
    description:
      "Mission-driven exponential thinkers who see VECTOR AI as a launchpad. They move before being told to.",
  },
  pilot: {
    label: "The Pilot",
    icon: "P",
    tagline: "Strong Hire — The Backbone of Every Great Team",
    priority: "STRONG",
    color: "text-[oklch(0.62_0.21_255)]",
    bgColor: "bg-[oklch(0.18_0.07_255)]",
    borderColor: "border-[oklch(0.62_0.21_255/0.4)]",
    description:
      "Steady, reliable, compounding growth. They show up, learn, improve, and stay.",
  },
  bus_driver: {
    label: "The Bus Driver",
    icon: "B",
    tagline: "Conditional — Only If There's a Very Specific Role Fit",
    priority: "CONDITIONAL",
    color: "text-[oklch(0.65_0.01_264)]",
    bgColor: "bg-[oklch(0.19_0.005_264)]",
    borderColor: "border-[oklch(0.65_0.01_264/0.4)]",
    description:
      "Technically competent but on autopilot. Capable but not hungry. Only in a well-defined execution role.",
  },
  taxi_rider: {
    label: "The Taxi Rider",
    icon: "T",
    tagline: "Pass — Protect the Team",
    priority: "PASS",
    color: "text-[oklch(0.55_0.2_25)]",
    bgColor: "bg-[oklch(0.2_0.06_25)]",
    borderColor: "border-[oklch(0.55_0.2_25/0.4)]",
    description:
      "Grasshopper mentality. Optimizes for the next ride. Will absorb knowledge and leave.",
  },
};

export const SCORE_DIMENSIONS: Array<{
  key: keyof Scores;
  label: string;
  description: string;
  lowLabel: string;
  highLabel: string;
}> = [
  {
    key: "technicalDepth",
    label: "Technical Depth",
    description: "Do they understand what's under the hood? Have they actually built things?",
    lowLabel: "Surface-level buzzwords",
    highLabel: "Builds in their sleep",
  },
  {
    key: "personality",
    label: "Personality",
    description: "Are they genuinely curious? Would they build at 2 AM for fun?",
    lowLabel: "Going through the motions",
    highLabel: "Would build at 2 AM for fun",
  },
  {
    key: "communication",
    label: "Communication & Body Language",
    description: "Can they hold their own in a room? Clear, composed, and present.",
    lowLabel: "Can't hold eye contact",
    highLabel: "Commands a room naturally",
  },
  {
    key: "khandaniPan",
    label: "Khandani Pan",
    description: "Are they grounded? Do they carry responsibility? Will they show up when it's hard?",
    lowLabel: "No anchor",
    highLabel: "Person you'd trust with your keys",
  },
];

export function calcTotalScore(scores: Scores): number {
  return Math.round(
    (scores.technicalDepth +
      scores.personality +
      scores.communication +
      scores.khandaniPan) /
      4
  );
}

export function getScoreColor(score: number): string {
  if (score >= 8) return "text-emerald-400";
  if (score >= 5) return "text-amber-400";
  return "text-red-400";
}

export function getScoreLabel(score: number): string {
  if (score >= 8) return "Strong";
  if (score >= 5) return "Average";
  return "Weak";
}
