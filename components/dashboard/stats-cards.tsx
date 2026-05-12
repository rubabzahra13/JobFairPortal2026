"use client";

import { Candidate, calcTotalScore } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  candidates: Candidate[];
}

export function StatsCards({ candidates }: StatsCardsProps) {
  const total = candidates.length;
  const astronauts = candidates.filter((c) => c.archetype === "astronaut").length;
  const pilots = candidates.filter((c) => c.archetype === "pilot").length;
  const busDrivers = candidates.filter((c) => c.archetype === "bus_driver").length;
  const taxiRiders = candidates.filter((c) => c.archetype === "taxi_rider").length;

  const todayStr = new Date().toDateString();
  const todayCount = candidates.filter(
    (c) => new Date(c.createdAt).toDateString() === todayStr
  ).length;

  const avgScore =
    total > 0
      ? Math.round(
          candidates.reduce((sum, c) => sum + calcTotalScore(c.scores), 0) / total
        )
      : 0;

  const stats = [
    {
      label: "Total",
      value: total,
      sub: `${todayCount} today`,
      color: "text-foreground",
    },
    {
      label: "Astronaut",
      value: astronauts,
      icon: "A",
      iconBg: "bg-[oklch(0.78_0.17_65)]",
      color: "text-[oklch(0.78_0.17_65)]",
    },
    {
      label: "Pilot",
      value: pilots,
      icon: "P",
      iconBg: "bg-[oklch(0.62_0.21_255)]",
      color: "text-[oklch(0.62_0.21_255)]",
    },
    {
      label: "Bus Driver",
      value: busDrivers,
      icon: "B",
      iconBg: "bg-[oklch(0.5_0.01_264)]",
      color: "text-[oklch(0.5_0.01_264)]",
    },
    {
      label: "Taxi Rider",
      value: taxiRiders,
      icon: "T",
      iconBg: "bg-[oklch(0.55_0.2_25)]",
      color: "text-[oklch(0.55_0.2_25)]",
    },
    {
      label: "Avg Score",
      value: avgScore || "—",
      sub: "/10",
      color: avgScore >= 8 ? "text-emerald-400" : avgScore >= 5 ? "text-amber-400" : avgScore > 0 ? "text-red-400" : "text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {stats.map(({ label, value, sub, icon, iconBg, color }) => (
        <div
          key={label}
          className="rounded-lg border border-border bg-card p-3"
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            {icon && (
              <div className={cn("flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold text-white", iconBg)}>
                {icon}
              </div>
            )}
            <span className="text-[10px] text-muted-foreground truncate">{label}</span>
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className={cn("text-xl font-bold tabular-nums", color)}>{value}</span>
            {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
