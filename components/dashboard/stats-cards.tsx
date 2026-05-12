import { Candidate } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Rocket, Navigation, Bus, Car, Users } from "lucide-react";

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
          candidates.reduce((sum, c) => {
            const avg =
              (c.scores.technicalDepth +
                c.scores.personality +
                c.scores.communication +
                c.scores.khandaniPan) /
              4;
            return sum + avg;
          }, 0) / total
        )
      : 0;

  const stats = [
    {
      label: "Total Evaluated",
      value: total,
      sub: `${todayCount} today`,
      icon: Users,
      iconColor: "text-muted-foreground",
      iconBg: "bg-secondary",
    },
    {
      label: "Astronauts",
      value: astronauts,
      sub: total > 0 ? `${Math.round((astronauts / total) * 100)}% of pool` : "—",
      icon: Rocket,
      iconColor: "text-[oklch(0.78_0.17_65)]",
      iconBg: "bg-[oklch(0.22_0.06_65)]",
    },
    {
      label: "Pilots",
      value: pilots,
      sub: total > 0 ? `${Math.round((pilots / total) * 100)}% of pool` : "—",
      icon: Navigation,
      iconColor: "text-[oklch(0.62_0.21_255)]",
      iconBg: "bg-[oklch(0.18_0.07_255)]",
    },
    {
      label: "Avg Score",
      value: avgScore || "—",
      sub: total > 0 ? `across ${total} candidate${total !== 1 ? "s" : ""}` : "no data yet",
      icon: null,
      iconColor: "",
      iconBg: "",
      isScore: true,
      score: avgScore,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(({ label, value, sub, icon: Icon, iconColor, iconBg, isScore, score }) => (
        <div
          key={label}
          className="rounded-lg border border-border bg-card p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              {label}
            </p>
            {Icon && (
              <div className={cn("flex h-7 w-7 items-center justify-center rounded-md", iconBg)}>
                <Icon className={cn("h-3.5 w-3.5", iconColor)} />
              </div>
            )}
          </div>
          <div>
            <p
              className={cn(
                "text-2xl font-bold tabular-nums",
                isScore && score >= 8
                  ? "text-emerald-400"
                  : isScore && score >= 5
                  ? "text-amber-400"
                  : isScore && score > 0
                  ? "text-red-400"
                  : "text-foreground"
              )}
            >
              {value}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
