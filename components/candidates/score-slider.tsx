"use client";

import { cn } from "@/lib/utils";

interface ScoreSliderProps {
  value: number;
  onChange: (val: number) => void;
  label: string;
  description: string;
  lowLabel: string;
  highLabel: string;
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
}: ScoreSliderProps) {
  const color = getScoreColor(value);

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
    </div>
  );
}
