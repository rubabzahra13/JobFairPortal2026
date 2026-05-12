"use client";

import { useState } from "react";
import { Candidate, Archetype, calcTotalScore } from "@/lib/types";
import { ArchetypeBadge } from "@/components/candidates/archetype-badge";
import { ScoreRing } from "@/components/candidates/score-ring";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Eye,
  Pencil,
  Search,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "@/lib/date-utils";

type SortKey = "name" | "score" | "archetype" | "createdAt";
type SortDir = "asc" | "desc";

const ARCHETYPE_FILTERS: Array<{ value: Archetype | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "astronaut", label: "Astronaut" },
  { value: "pilot", label: "Pilot" },
  { value: "bus_driver", label: "Bus Driver" },
  { value: "taxi_rider", label: "Taxi Rider" },
];

interface CandidatesTableProps {
  candidates: Candidate[];
}

export function CandidatesTable({ candidates }: CandidatesTableProps) {
  const [search, setSearch] = useState("");
  const [archetypeFilter, setArchetypeFilter] = useState<Archetype | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const filtered = candidates
    .filter((c) => {
      if (archetypeFilter !== "all" && c.archetype !== archetypeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.degree.toLowerCase().includes(q) ||
          c.hometown.toLowerCase().includes(q) ||
          c.batch.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      let diff = 0;
      if (sortKey === "score") {
        diff = calcTotalScore(a.scores) - calcTotalScore(b.scores);
      } else if (sortKey === "name") {
        diff = a.name.localeCompare(b.name);
      } else if (sortKey === "archetype") {
        diff = a.archetype.localeCompare(b.archetype);
      } else {
        diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortDir === "asc" ? diff : -diff;
    });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, degree, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 bg-card pl-8 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {ARCHETYPE_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setArchetypeFilter(value)}
              className={cn(
                "shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                archetypeFilter === value
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Result count */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} candidate{filtered.length !== 1 ? "s" : ""}
        {archetypeFilter !== "all" || search ? " (filtered)" : ""}
      </p>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/30 hover:bg-muted/30">
              <TableHead
                className="h-11 min-w-[180px] px-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground"
                onClick={() => toggleSort("name")}
              >
                Name
              </TableHead>
              <TableHead className="hidden h-11 min-w-[200px] px-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">
                Degree / Batch
              </TableHead>
              <TableHead
                className="h-11 min-w-[120px] px-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground"
                onClick={() => toggleSort("archetype")}
              >
                Archetype
              </TableHead>
              <TableHead
                className="h-11 w-[88px] px-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground"
                onClick={() => toggleSort("score")}
              >
                Score
              </TableHead>
              <TableHead className="hidden h-11 min-w-[150px] px-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">
                Source
              </TableHead>
              <TableHead
                className="hidden h-11 px-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell cursor-pointer select-none hover:text-foreground"
                onClick={() => toggleSort("createdAt")}
              >
                Added
              </TableHead>
              <TableHead className="h-11 w-[120px] px-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 px-3 py-8 text-center text-sm text-muted-foreground"
                >
                  {candidates.length === 0
                    ? "No candidates yet — add your first one above."
                    : "No candidates match your filters."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((candidate, index) => {
                const total = calcTotalScore(candidate.scores);
                return (
                  <TableRow
                    key={candidate.id}
                    className={cn(
                      "border-border group transition-colors",
                      index % 2 === 1 && "bg-muted/15"
                    )}
                  >
                    <TableCell className="align-middle whitespace-normal py-3.5 px-3 min-w-0 max-w-[220px] sm:max-w-[260px]">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary ring-1 ring-border">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p
                            className="truncate text-sm font-semibold leading-snug text-foreground"
                            title={candidate.name}
                          >
                            {candidate.name}
                          </p>
                        {candidate.hometown ? (
                            <p
                              className="truncate text-[11px] leading-relaxed text-muted-foreground"
                              title={candidate.hometown}
                            >
                              {candidate.hometown}
                            </p>
                          ) : null}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {candidate.status ? (
                              <span className="rounded border border-border bg-secondary/50 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                                {candidate.status}
                              </span>
                            ) : null}
                            {candidate.resumeUrl ? (
                              <a
                                href={candidate.resumeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <FileText className="h-3 w-3" />
                                Resume
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden min-w-0 max-w-[280px] whitespace-normal align-middle py-3.5 px-3 sm:table-cell">
                      <div className="min-w-0 space-y-1">
                        <p
                          className="truncate text-xs font-medium leading-snug text-foreground"
                          title={candidate.degree || undefined}
                        >
                          {candidate.degree || "—"}
                        </p>
                        {candidate.batch ? (
                          <p
                            className="truncate text-[11px] leading-relaxed text-muted-foreground"
                            title={candidate.batch}
                          >
                            {candidate.batch}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="align-middle py-3.5 px-3">
                      <ArchetypeBadge archetype={candidate.archetype} size="sm" />
                    </TableCell>
                    <TableCell className="align-middle py-3.5 px-3">
                      <ScoreRing score={total} size="sm" />
                    </TableCell>
                    <TableCell className="hidden align-middle whitespace-nowrap py-3.5 px-3 md:table-cell">
                      <span className="rounded border border-border bg-secondary/40 px-2 py-1 text-xs capitalize text-muted-foreground">
                        {candidate.source ?? "panel"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden align-middle whitespace-nowrap py-3.5 px-3 sm:table-cell">
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {formatDistanceToNow(candidate.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell className="align-middle py-3.5 px-3 text-right">
                      <div className="flex flex-nowrap items-center justify-end gap-1.5">
                        <ButtonLink
                          href={`/candidates/${candidate.id}`}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="View profile"
                        >
                          <Eye className="h-4 w-4" />
                        </ButtonLink>
                        <ButtonLink
                          href={`/candidates/${candidate.id}/edit`}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Edit evaluation"
                        >
                          <Pencil className="h-4 w-4" />
                        </ButtonLink>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

    </div>
  );
}
