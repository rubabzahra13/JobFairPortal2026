import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  size?: "sm" | "md" | "lg";
  label?: string;
}

function getScoreStyle(score: number) {
  if (score >= 8)
    return {
      stroke: "oklch(0.72 0.19 149)",
      text: "text-emerald-400",
      glow: "drop-shadow(0 0 6px oklch(0.72 0.19 149 / 0.6))",
    };
  if (score >= 5)
    return {
      stroke: "oklch(0.78 0.17 65)",
      text: "text-amber-400",
      glow: "drop-shadow(0 0 6px oklch(0.78 0.17 65 / 0.5))",
    };
  return {
    stroke: "oklch(0.55 0.2 25)",
    text: "text-red-400",
    glow: "drop-shadow(0 0 6px oklch(0.55 0.2 25 / 0.5))",
  };
}

export function ScoreRing({ score, size = "md", label }: ScoreRingProps) {
  const pct = score / 10;
  const radius = 18;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - pct);
  const style = getScoreStyle(score);

  const dims = { sm: 40, md: 52, lg: 64 }[size];
  const fontSize = { sm: "text-xs", md: "text-sm", lg: "text-base" }[size];

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: dims, height: dims }}>
        <svg
          width={dims}
          height={dims}
          viewBox="0 0 44 44"
          className="-rotate-90"
          style={{ filter: style.glow }}
        >
          {/* Track */}
          <circle
            cx="22"
            cy="22"
            r={radius}
            fill="none"
            stroke="oklch(0.22 0.007 264)"
            strokeWidth="3.5"
          />
          {/* Progress */}
          <circle
            cx="22"
            cy="22"
            r={radius}
            fill="none"
            stroke={style.stroke}
            strokeWidth="3.5"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold tabular-nums", fontSize, style.text)}>
            {score}
          </span>
        </div>
      </div>
      {label && (
        <span className="text-center text-[10px] leading-tight text-muted-foreground">
          {label}
        </span>
      )}
    </div>
  );
}

interface ScoreBarProps {
  score: number;
  label: string;
}

export function ScoreBar({ score, label }: ScoreBarProps) {
  const style = getScoreStyle(score);
  const width = `${score * 10}%`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={cn("text-xs font-semibold tabular-nums", style.text)}>
          {score}/10
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width,
            background: style.stroke,
            boxShadow: `0 0 8px ${style.stroke}60`,
          }}
        />
      </div>
    </div>
  );
}
