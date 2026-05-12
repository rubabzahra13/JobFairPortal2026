import { cn } from "@/lib/utils";
import { Archetype, ARCHETYPE_META } from "@/lib/types";

interface ArchetypeBadgeProps {
  archetype: Archetype;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export function ArchetypeBadge({
  archetype,
  size = "md",
  showIcon = true,
}: ArchetypeBadgeProps) {
  const meta = ARCHETYPE_META[archetype];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md font-medium border",
        meta.color,
        meta.bgColor,
        meta.borderColor,
        size === "sm" && "px-1.5 py-0.5 text-[10px]",
        size === "md" && "px-2 py-1 text-xs",
        size === "lg" && "px-3 py-1.5 text-sm"
      )}
    >
      {showIcon && (
        <span
          className={cn(
            "flex items-center justify-center rounded font-bold leading-none",
            size === "sm" && "h-3.5 w-3.5 text-[9px]",
            size === "md" && "h-4 w-4 text-[10px]",
            size === "lg" && "h-5 w-5 text-xs"
          )}
        >
          {meta.icon}
        </span>
      )}
      <span className={size === "sm" ? "hidden sm:inline" : undefined}>
        {archetype === "bus_driver"
          ? "Bus Driver"
          : archetype === "taxi_rider"
          ? "Taxi Rider"
          : meta.label.replace("The ", "")}
      </span>
    </span>
  );
}

interface PriorityBadgeProps {
  archetype: Archetype;
}

export function PriorityBadge({ archetype }: PriorityBadgeProps) {
  const meta = ARCHETYPE_META[archetype];
  const styles: Record<string, string> = {
    PRIORITY:
      "bg-[oklch(0.22_0.06_65)] text-[oklch(0.78_0.17_65)] border border-[oklch(0.78_0.17_65/0.3)]",
    STRONG:
      "bg-[oklch(0.18_0.07_255)] text-[oklch(0.62_0.21_255)] border border-[oklch(0.62_0.21_255/0.3)]",
    CONDITIONAL:
      "bg-[oklch(0.19_0.005_264)] text-[oklch(0.65_0.01_264)] border border-[oklch(0.65_0.01_264/0.3)]",
    PASS: "bg-[oklch(0.2_0.06_25)] text-[oklch(0.55_0.2_25)] border border-[oklch(0.55_0.2_25/0.3)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wider",
        styles[meta.priority]
      )}
    >
      {meta.priority}
    </span>
  );
}
