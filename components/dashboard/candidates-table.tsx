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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Pencil,
  Search,
  Trash2,
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
  onDelete: (id: string) => void;
}

export function CandidatesTable({ candidates, onDelete }: CandidatesTableProps) {
  const [search, setSearch] = useState("");
  const [archetypeFilter, setArchetypeFilter] = useState<Archetype | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return null;
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, degree, hometown..."
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
      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-card/50 hover:bg-card/50">
              <TableHead
                className="cursor-pointer select-none text-xs"
                onClick={() => toggleSort("name")}
              >
                <div className="flex items-center gap-1">
                  Name <SortIcon k="name" />
                </div>
              </TableHead>
              <TableHead className="hidden text-xs sm:table-cell">
                Degree / Batch
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-xs"
                onClick={() => toggleSort("archetype")}
              >
                <div className="flex items-center gap-1">
                  Archetype <SortIcon k="archetype" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-xs"
                onClick={() => toggleSort("score")}
              >
                <div className="flex items-center gap-1">
                  Score <SortIcon k="score" />
                </div>
              </TableHead>
              <TableHead className="hidden text-xs md:table-cell">
                Scores
              </TableHead>
              <TableHead
                className="hidden cursor-pointer select-none text-xs sm:table-cell"
                onClick={() => toggleSort("createdAt")}
              >
                <div className="flex items-center gap-1">
                  Added <SortIcon k="createdAt" />
                </div>
              </TableHead>
              <TableHead className="w-[80px] text-right text-xs">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  {candidates.length === 0
                    ? "No candidates yet — add your first one above."
                    : "No candidates match your filters."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((candidate) => {
                const total = calcTotalScore(candidate.scores);
                return (
                  <TableRow key={candidate.id} className="border-border group">
                    <TableCell className="font-medium">
                      <div>
                        <p className="text-sm font-semibold">{candidate.name}</p>
                        {candidate.hometown && (
                          <p className="text-[11px] text-muted-foreground">
                            {candidate.hometown}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div>
                        <p className="text-xs">{candidate.degree || "—"}</p>
                        {candidate.batch && (
                          <p className="text-[11px] text-muted-foreground">
                            {candidate.batch}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ArchetypeBadge archetype={candidate.archetype} size="sm" />
                    </TableCell>
                    <TableCell>
                      <ScoreRing score={total} size="sm" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        {(
                          [
                            ["T", candidate.scores.technicalDepth],
                            ["P", candidate.scores.personality],
                            ["C", candidate.scores.communication],
                            ["K", candidate.scores.khandaniPan],
                          ] as [string, number][]
                        ).map(([k, v]) => (
                          <div key={k} className="flex items-center gap-0.5">
                            <span className="text-[9px] text-muted-foreground">
                              {k}
                            </span>
                            <span
                              className={cn(
                                "text-xs font-semibold tabular-nums",
                                v >= 8
                                  ? "text-emerald-400"
                                  : v >= 5
                                  ? "text-amber-400"
                                  : "text-red-400"
                              )}
                            >
                              {v}
                            </span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(candidate.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <ButtonLink
                          href={`/candidates/${candidate.id}`}
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </ButtonLink>
                        <ButtonLink
                          href={`/candidates/${candidate.id}/edit`}
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </ButtonLink>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(candidate.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete candidate?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The candidate and all their scores
              will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
