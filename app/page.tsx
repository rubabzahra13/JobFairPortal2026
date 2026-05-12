"use client";

import { StatsCards } from "@/components/dashboard/stats-cards";
import { CandidatesTable } from "@/components/dashboard/candidates-table";
import { useCandidates } from "@/hooks/use-candidates";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Rocket } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";

export default function DashboardPage() {
  const { candidates, loading, remove } = useCandidates();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Internal Briefing — Job Fair 2026
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Candidate Evaluations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Score independently. Tag together. The pride runs on Pilots.
          </p>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : (
        <StatsCards candidates={candidates} />
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary mb-4">
            <Rocket className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-base font-semibold">No candidates yet</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Start scoring candidates at the booth. Every person you evaluate
            gets captured here.
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
