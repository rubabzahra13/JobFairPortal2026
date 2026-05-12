"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Candidate, ARCHETYPE_META, SCORE_DIMENSIONS, calcTotalScore } from "@/lib/types";
import { getCandidateById, deleteCandidate } from "@/lib/store";
import { getSubmissionById, getSubmissionByCandidateId } from "@/lib/submissions";
import { ViewCvButton } from "@/components/submissions/view-cv-button";
import { ArchetypeBadge, PriorityBadge } from "@/components/candidates/archetype-badge";
import { ScoreRing, ScoreBar } from "@/components/candidates/score-ring";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Separator } from "@/components/ui/separator";
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
import { ArrowLeft, Calendar, GraduationCap, MapPin, Pencil, Trash2, Users2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatTime } from "@/lib/date-utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CandidateDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    const c = getCandidateById(id);
    if (!c) {
      router.replace("/");
      return;
    }
    setCandidate(c);
  }, [id, router]);

  if (!candidate) return null;

  const meta = ARCHETYPE_META[candidate.archetype];
  const total = calcTotalScore(candidate.scores);

  const submissionForCv =
    (candidate.sourceSubmissionId
      ? getSubmissionById(candidate.sourceSubmissionId)
      : undefined) ?? getSubmissionByCandidateId(candidate.id);
  const cvSubmissionId = submissionForCv?.id;

  function handleDelete() {
    if (!candidate) return;
    deleteCandidate(candidate.id);
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 space-y-8">
      {/* Back */}
      <div className="flex items-center justify-between">
        <ButtonLink href="/" variant="ghost" size="sm" className="gap-2 h-8">
          <ArrowLeft className="h-3.5 w-3.5" />
          All Candidates
        </ButtonLink>
        <div className="flex items-center gap-2">
          {cvSubmissionId && (
            <ViewCvButton submissionId={cvSubmissionId} label="Submitted CV" variant="outline" className="h-8" />
          )}
          <ButtonLink href={`/candidates/${candidate.id}/edit`} variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </ButtonLink>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Hero */}
      <div className={cn("rounded-xl border p-6 space-y-4", meta.borderColor, meta.bgColor)}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{candidate.name}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <ArchetypeBadge archetype={candidate.archetype} size="lg" />
              <PriorityBadge archetype={candidate.archetype} />
            </div>
            <p className={cn("text-sm italic", meta.color)}>{meta.tagline}</p>
          </div>
          <div className="shrink-0 text-center">
            <ScoreRing score={total} size="lg" />
            <p className="text-[10px] text-muted-foreground mt-1">avg score</p>
          </div>
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-3 pt-2">
          {candidate.degree && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <GraduationCap className="h-3.5 w-3.5 shrink-0" />
              <span>{candidate.degree}{candidate.batch ? ` · ${candidate.batch}` : ""}</span>
            </div>
          )}
          {candidate.hometown && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{candidate.hometown}</span>
            </div>
          )}
          {candidate.yearsOfExperience && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users2 className="h-3.5 w-3.5 shrink-0" />
              <span>{candidate.yearsOfExperience}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>
              {formatDate(candidate.createdAt)} at {formatTime(candidate.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Scores */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Score Breakdown
        </h2>
        <div className="rounded-xl border border-border bg-card p-5 space-y-5">
          {/* Score rings row */}
          <div className="grid grid-cols-4 gap-4">
            {SCORE_DIMENSIONS.map((dim) => (
              <ScoreRing
                key={dim.key}
                score={candidate.scores[dim.key]}
                size="md"
                label={dim.label.split(" ")[0]}
              />
            ))}
          </div>

          <Separator />

          {/* Score bars */}
          <div className="space-y-4">
            {SCORE_DIMENSIONS.map((dim) => (
              <ScoreBar
                key={dim.key}
                score={candidate.scores[dim.key]}
                label={dim.label}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Archetype info */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Archetype Analysis
        </h2>
        <div className={cn("rounded-xl border p-5 space-y-3", meta.borderColor, meta.bgColor)}>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold border shrink-0",
                meta.borderColor,
                meta.color
              )}
            >
              {meta.icon}
            </div>
            <div>
              <p className={cn("font-semibold", meta.color)}>{meta.label}</p>
              <p className="text-xs text-muted-foreground">{meta.tagline}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{meta.description}</p>
        </div>
      </section>

      {/* Notes */}
      {candidate.notes && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Notes
          </h2>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {candidate.notes}
            </p>
          </div>
        </section>
      )}

      {/* Evaluators */}
      {candidate.evaluators && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Evaluated By
          </h2>
          <div className="rounded-xl border border-border bg-card px-5 py-3">
            <p className="text-sm">{candidate.evaluators}</p>
          </div>
        </section>
      )}

      {/* Delete dialog */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {candidate.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All scores and notes for this
              candidate will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
