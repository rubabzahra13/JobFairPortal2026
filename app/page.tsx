"use client";

import { CandidatesTable } from "@/components/dashboard/candidates-table";
import { useCandidates } from "@/hooks/use-candidates";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Rocket, Users, TrendingUp, Target } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { calcTotalScore, ARCHETYPE_META } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { candidates, loading, remove } = useCandidates();

  const total = candidates.length;
  const astronauts = candidates.filter((c) => c.archetype === "astronaut").length;
  const pilots = candidates.filter((c) => c.archetype === "pilot").length;
  const busDrivers = candidates.filter((c) => c.archetype === "bus_driver").length;
  const taxiRiders = candidates.filter((c) => c.archetype === "taxi_rider").length;
  const priorityHires = astronauts + pilots;

  const avgScore =
    total > 0
      ? Math.round(
          candidates.reduce((sum, c) => sum + calcTotalScore(c.scores), 0) / total
        )
      : 0;

  const todayStr = new Date().toDateString();
  const todayCount = candidates.filter(
    (c) => new Date(c.createdAt).toDateString() === todayStr
  ).length;

  const archetypes = [
    { key: "astronaut", count: astronauts, ...ARCHETYPE_META.astronaut },
    { key: "pilot", count: pilots, ...ARCHETYPE_META.pilot },
    { key: "bus_driver", count: busDrivers, ...ARCHETYPE_META.bus_driver },
    { key: "taxi_rider", count: taxiRiders, ...ARCHETYPE_META.taxi_rider },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-6">
      {/* Header Row */}
      <div>
        <p className="text-xs font-medium text-primary uppercase tracking-wider">Job Fair 2026</p>
        <h1 className="text-2xl font-bold tracking-tight mt-1">Evaluations</h1>
      </div>

      {/* Metrics Bar */}
      {loading ? (
        <Skeleton className="h-24 rounded-xl" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden">
          <div className="bg-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{total}</p>
              <p className="text-xs text-muted-foreground">{todayCount} today</p>
            </div>
          </div>
          <div className="bg-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-emerald-400">{priorityHires}</p>
              <p className="text-xs text-muted-foreground">priority hires</p>
            </div>
          </div>
          <div className="bg-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{avgScore || "—"}<span className="text-sm font-normal text-muted-foreground">/10</span></p>
              <p className="text-xs text-muted-foreground">avg score</p>
            </div>
          </div>
          <div className="bg-card p-4 flex items-center gap-3">
            <div className="flex-1 grid grid-cols-4 gap-1">
              {archetypes.map(({ key, count, icon, color }) => (
                <div key={key} className="text-center">
                  <div
                    className="h-8 rounded flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: count > 0 ? color : "var(--secondary)" }}
                  >
                    {count > 0 ? count : "—"}
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-1">{icon}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Archetype Pills */}
      {!loading && total > 0 && (
        <div className="flex flex-wrap gap-2">
          {archetypes.map(({ key, count, label, icon, color }) => (
            <div
              key={key}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                count > 0 ? "border-transparent" : "border-border text-muted-foreground"
              )}
              style={count > 0 ? { backgroundColor: `${color}20`, color } : undefined}
            >
              <span className="font-bold">{icon}</span>
              <span>{label}</span>
              <span className="tabular-nums">{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-4">
            <Rocket className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">No candidates yet</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Start scoring candidates at the booth to build your talent pipeline.
          </p>
          <ButtonLink href="/candidates/new" className="mt-6 gap-2">
            <Plus className="h-4 w-4" />
            Score First Candidate
          </ButtonLink>
        </div>
      ) : (
        <CandidatesTable candidates={candidates} onDelete={remove} />
      )}
    </div>
  );
}
