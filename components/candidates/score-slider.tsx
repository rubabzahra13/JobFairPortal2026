"use client";

import { cn } from "@/lib/utils";

/** Split CV rationale into band summary + calibration (e.g. "Not 9: …"). */
function parseCvAiReason(
  reason: string,
  currentScore: number
): {
  bandKey: "strong" | "average" | "weak" | null;
  bandHeading: string | null;
  main: string;
  calibration: string | null;
  calibrationHeading: string | null;
} {
  const t = reason.trim();
  const head = t.match(/^(\d+\/10)\s*[-–]\s*(Strong|Average|Weak)\s*:\s*([\s\S]*)$/i);
  let rest = t;
  let bandKey: "strong" | "average" | "weak" | null = null;
  let bandHeading: string | null = null;
  if (head) {
    const word = head[2];
    bandKey = word.toLowerCase() as "strong" | "average" | "weak";
    bandHeading = `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}:`;
    rest = head[3].trim();
  }

  const parts = rest.split(/\s+Not\s+(\d+)\s*:\s*/gi);
  const main = (parts[0] ?? "").trim();
  let calibration: string | null = null;
  let calibrationHeading: string | null = null;

  if (parts.length > 1) {
    const pieces: string[] = [];
    for (let i = 1; i < parts.length; i += 2) {
      const scoreNum = parts[i] ? Number.parseInt(parts[i], 10) : NaN;
      const text = parts[i + 1]?.trim();
      if (text) {
        pieces.push(text);
        if (calibrationHeading === null && Number.isFinite(scoreNum)) {
          calibrationHeading =
            scoreNum > currentScore
              ? "Why not more?"
              : scoreNum < currentScore
                ? "Why not less?"
                : "Calibration";
        }
      }
    }
    if (pieces.length) {
      calibration = pieces.join(" ");
      if (!calibrationHeading) calibrationHeading = "Why not more?";
    }
  }

  if (!bandHeading && !calibration && main === t) {
    return {
      bandKey: null,
      bandHeading: null,
      main: t,
      calibration: null,
      calibrationHeading: null,
    };
  }

  return { bandKey, bandHeading, main, calibration, calibrationHeading };
}

const bandHeadingClass: Record<"strong" | "average" | "weak", string> = {
  strong: "text-emerald-400",
  average: "text-amber-400",
  weak: "text-red-400",
};

interface ScoreSliderProps {
  value: number;
  onChange: (val: number) => void;
  label: string;
  description: string;
  lowLabel: string;
  highLabel: string;
  /** CV-only AI rationale when opening from a QR submission */
  aiReason?: string;
}

function getScoreColor(val: number) {
  if (val >= 8) return { bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/40" };
  if (val >= 5) return { bg: "bg-amber-500", text: "text-amber-400", border: "border-amber-500/40" };
  return { bg: "bg-red-500", text: "text-red-400", border: "border-red-500/40" };
}

function getButtonStyle(num: number, isSelected: boolean) {
  const color = getScoreColor(num);
  
  if (isSelected) {
    return cn(
      "font-bold text-white",
      color.bg,
      "ring-2 ring-offset-1 ring-offset-background",
      num >= 8 ? "ring-emerald-400" : num >= 5 ? "ring-amber-400" : "ring-red-400"
    );
  }
  
  return cn(
    "bg-secondary/60 text-muted-foreground hover:bg-secondary",
    "hover:text-foreground"
  );
}

export function ScoreSlider({
  value,
  onChange,
  label,
  description,
  lowLabel,
  highLabel,
  aiReason,
}: ScoreSliderProps) {
  const color = getScoreColor(value);
  const parsed = aiReason ? parseCvAiReason(aiReason, value) : null;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="shrink-0 text-right">
          <span className={cn("text-2xl font-bold tabular-nums", color.text)}>
            {value}
          </span>
          <span className="text-xs text-muted-foreground">/10</span>
        </div>
      </div>

      {/* Score buttons - the main input */}
      <div className="flex gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            className={cn(
              "flex-1 h-10 rounded-md text-sm font-semibold tabular-nums transition-all duration-100",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              getButtonStyle(num, value === num)
            )}
          >
            {num}
          </button>
        ))}
      </div>

      {/* Labels row */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{lowLabel}</span>
        <span className="text-[10px] text-muted-foreground">{highLabel}</span>
      </div>

      {aiReason && parsed ? (
        <div className="rounded-md border border-primary/25 bg-primary/5 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary/90">
            AI note (from CV only)
          </p>
          <div className="mt-2 space-y-3">
            {parsed.bandHeading ? (
              <div className="space-y-1.5">
                <p
                  className={cn(
                    "text-xs font-semibold leading-none",
                    parsed.bandKey ? bandHeadingClass[parsed.bandKey] : "text-foreground"
                  )}
                >
                  {parsed.bandHeading}
                </p>
                {parsed.main ? (
                  <p className="text-xs leading-relaxed text-foreground/90">{parsed.main}</p>
                ) : null}
              </div>
            ) : parsed.main ? (
              <p className="text-xs leading-relaxed text-foreground/90">{parsed.main}</p>
            ) : null}
            {parsed.calibration ? (
              <div className="space-y-1.5 border-t border-primary/15 pt-3">
                <p className="text-xs font-semibold text-muted-foreground">
                  {parsed.calibrationHeading ?? "Why not more?"}
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">{parsed.calibration}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
