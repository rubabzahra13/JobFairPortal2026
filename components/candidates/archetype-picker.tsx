"use client";

import { cn } from "@/lib/utils";
import { Archetype, ARCHETYPE_META } from "@/lib/types";
import { CheckCircle2 } from "lucide-react";

interface ArchetypePickerProps {
  value: Archetype;
  onChange: (value: Archetype) => void;
}

const ARCHETYPES: Archetype[] = ["astronaut", "pilot", "bus_driver", "taxi_rider"];

export function ArchetypePicker({ value, onChange }: ArchetypePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ARCHETYPES.map((archetype) => {
        const meta = ARCHETYPE_META[archetype];
        const selected = value === archetype;
        return (
          <button
            key={archetype}
            type="button"
            onClick={() => onChange(archetype)}
            className={cn(
              "relative flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-all duration-150 hover:border-opacity-60",
              selected
                ? cn("border-opacity-100", meta.borderColor, meta.bgColor)
                : "border-border bg-card hover:bg-secondary/40"
            )}
          >
            {selected && (
              <CheckCircle2
                className={cn("absolute right-2 top-2 h-3.5 w-3.5", meta.color)}
              />
            )}
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold border",
                selected ? cn(meta.bgColor, meta.borderColor, meta.color) : "bg-secondary border-border text-muted-foreground"
              )}
            >
              {meta.icon}
            </div>
            <div className="space-y-0.5">
              <p
                className={cn(
                  "text-[11px] font-semibold leading-tight",
                  selected ? meta.color : "text-foreground"
                )}
              >
                {archetype === "bus_driver"
                  ? "Bus Driver"
                  : archetype === "taxi_rider"
                  ? "Taxi Rider"
                  : meta.label.replace("The ", "")}
              </p>
              <p
                className={cn(
                  "text-[9px] font-semibold tracking-wider uppercase",
                  selected ? meta.color : "text-muted-foreground"
                )}
              >
                {meta.priority}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
