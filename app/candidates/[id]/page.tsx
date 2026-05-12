"use client";

import { use, useEffect, useState } from "react";
import { Candidate, ARCHETYPE_META, PANEL_EVALUATORS, SCORE_DIMENSIONS, calcTotalScore } from "@/lib/types";
import { getCandidate } from "@/lib/store";
import { getSubmissionByCandidateId, getSubmissionById } from "@/lib/submissions";
import { ViewCvButton } from "@/components/submissions/view-cv-button";
import { ArchetypeBadge, PriorityBadge } from "@/components/candidates/archetype-badge";
import { ScoreRing, ScoreBar } from "@/components/candidates/score-ring";
import { ButtonLink } from "@/components/ui/button-link";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, FileText, GraduationCap, MapPin, Pencil, Users2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatTime } from "@/lib/date-utils";
import { parseCandidateGeminiInsight } from "@/lib/candidate-record";

interface PageProps {
  params: Promise<{ id: string }>;
}

type CandidateInsight = {
  summary?: string;
  suggestedScores?: Partial<Record<keyof Candidate["scores"], number>> | null;
  scoreReasons?: Partial<Record<keyof Candidate["scores"], string>>;
  interviewPrompts?: string[];
  risks?: string[];
  locationFit?: string;
};

export default function CandidateDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCandidate() {
      setLoading(true);
      setError(null);
      try {
        const loaded = await getCandidate(id);
        if (!cancelled) setCandidate(loaded);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load candidate");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadCandidate();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8 sm:px-6">
        <ButtonLink href="/" variant="ghost" size="sm" className="h-8 gap-2">
          <ArrowLeft className="h-3.5 w-3.5" />
          All Candidates
        </ButtonLink>
        <div className="rounded-xl border border-border bg-card p-6">
          <h1 className="text-lg font-semibold">Candidate not found</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {error || "This candidate is no longer available."}
          </p>
        </div>
      </div>
    );
  }

  const meta = ARCHETYPE_META[candidate.archetype];
  const total = calcTotalScore(candidate.scores);
  const submissionForCv =
    (candidate.sourceSubmissionId ? getSubmissionById(candidate.sourceSubmissionId) : undefined) ??
    getSubmissionByCandidateId(candidate.id);
  const cvSubmissionId = submissionForCv?.id;
  const geminiInsight = parseCandidateGeminiInsight(candidate.geminiInsight) as CandidateInsight | null;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <ButtonLink href="/" variant="ghost" size="sm" className="h-8 gap-2">
          <ArrowLeft className="h-3.5 w-3.5" />
          All Candidates
        </ButtonLink>
        <div className="flex items-center gap-2">
          {candidate.resumeUrl ? (
            <a
              href={candidate.resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              <FileText className="h-3.5 w-3.5" />
              Resume
            </a>
          ) : cvSubmissionId ? (
            <ViewCvButton submissionId={cvSubmissionId} label="Submitted CV" variant="outline" className="h-8" />
          ) : null}
          <ButtonLink href={`/candidates/${candidate.id}/edit`} variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </ButtonLink>
        </div>
      </div>

      <div className={cn("space-y-4 rounded-xl border p-6", meta.borderColor, meta.bgColor)}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{candidate.name}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <ArchetypeBadge archetype={candidate.archetype} size="lg" />
              <PriorityBadge archetype={candidate.archetype} />
              <span className="rounded border border-border bg-background/40 px-2 py-1 text-xs capitalize text-muted-foreground">
                {candidate.status ?? "screening"} · {candidate.source ?? "panel"}
              </span>
            </div>
            <p className={cn("text-sm italic", meta.color)}>{meta.tagline}</p>
          </div>
          <div className="shrink-0 text-center">
            <ScoreRing score={total} size="lg" />
            <p className="mt-1 text-[10px] text-muted-foreground">avg score</p>
          </div>
        </div>

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
            <span>{formatDate(candidate.createdAt)} at {formatTime(candidate.createdAt)}</span>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Aggregate Score Breakdown
        </h2>
        <div className="space-y-5 rounded-xl border border-border bg-card p-5">
          <div className="grid grid-cols-4 gap-4">
            {SCORE_DIMENSIONS.map((dim) => (
              <ScoreRing key={dim.key} score={candidate.scores[dim.key]} size="md" label={dim.label.split(" ")[0]} />
            ))}
          </div>
          <Separator />
          <div className="space-y-4">
            {SCORE_DIMENSIONS.map((dim) => (
              <ScoreBar key={dim.key} score={candidate.scores[dim.key]} label={dim.label} />
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Panel Scorecards
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {PANEL_EVALUATORS.map((evaluator) => {
            const scorecard = candidate.evaluatorScorecards?.[evaluator.id];

            return (
              <div key={evaluator.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{evaluator.displayName}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {scorecard?.updatedAt
                        ? `Scored ${formatDate(scorecard.updatedAt)}`
                        : "Not scored yet"}
                    </p>
                  </div>
                  {scorecard ? (
                    <span className="rounded border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                      {calcTotalScore(scorecard.scores)}/10
                    </span>
                  ) : null}
                </div>
                {scorecard ? (
                  <div className="mt-3 space-y-2">
                    {SCORE_DIMENSIONS.map((dim) => (
                      <div key={dim.key} className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-muted-foreground">{dim.label}</span>
                        <span className="font-semibold tabular-nums text-foreground">
                          {scorecard.scores[dim.key]}/10
                        </span>
                      </div>
                    ))}
                    {scorecard.notes ? (
                      <p className="border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
                        {scorecard.notes}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {candidate.graduationLocationPlan || geminiInsight ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Intake Notes
          </h2>
          <div className="space-y-4 rounded-xl border border-border bg-card p-5">
            {candidate.graduationLocationPlan ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Plan after graduation</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{candidate.graduationLocationPlan}</p>
              </div>
            ) : null}
            {geminiInsight ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Gemini insight</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {geminiInsight.summary || "No summary returned."}
                  </p>
                </div>
                {geminiInsight.suggestedScores ? (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Suggested scores</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {SCORE_DIMENSIONS.map((dim) => {
                        const score = geminiInsight.suggestedScores?.[dim.key];
                        if (!score) return null;
                        return (
                          <div key={dim.key} className="rounded-lg border border-border bg-background/40 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-xs font-medium text-foreground">{dim.label}</p>
                              <p className="text-sm font-semibold tabular-nums text-primary">{score}/10</p>
                            </div>
                            {geminiInsight.scoreReasons?.[dim.key] ? (
                              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                                {geminiInsight.scoreReasons[dim.key]}
                              </p>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                {geminiInsight.interviewPrompts?.length ? (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Interview prompts</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                      {geminiInsight.interviewPrompts.map((prompt) => (
                        <li key={prompt}>{prompt}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {geminiInsight.locationFit ? (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Location fit</p>
                    <p className="mt-1 text-sm text-muted-foreground">{geminiInsight.locationFit}</p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {candidate.notes ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Notes</h2>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{candidate.notes}</p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
