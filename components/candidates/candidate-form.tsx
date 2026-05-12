"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ARCHETYPE_META,
  Candidate,
  Archetype,
  PANEL_EVALUATORS,
  SCORE_DIMENSIONS,
  calcTotalScore,
  type EvaluatorScorecards,
  type PanelEvaluatorId,
  type Scores,
} from "@/lib/types";
import {
  aggregateEvaluatorScores,
  evaluatorDisplayName,
  evaluatorDisplayNames,
  setEvaluatorScorecard,
} from "@/lib/evaluator-scorecards";
import {
  ACADEMIC_BATCH_OPTIONS,
  DEGREE_GROUPS,
  isKnownAcademicBatch,
  isKnownDegree,
} from "@/lib/academic-options";
import { generateId, saveCandidate } from "@/lib/store";
import { getSubmissionById, updateSubmissionStatus, Submission } from "@/lib/submissions";
import { ViewCvButton } from "@/components/submissions/view-cv-button";
import { ScoreSlider } from "./score-slider";
import { ArchetypePicker } from "./archetype-picker";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, ArrowLeft, CircleSlash2, FileText, Loader2, Save, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CandidateFormProps {
  initial?: Candidate;
}

const DEFAULT_SCORES: Scores = {
  technicalDepth: 5,
  personality: 5,
  communication: 5,
  khandaniPan: 5,
};

function submissionDegree(submission: Submission | null): string {
  if (!submission?.degree) return "";
  return submission.degree;
}

function firstEvaluatorId(scorecards: EvaluatorScorecards | undefined): PanelEvaluatorId {
  return (
    PANEL_EVALUATORS.find((evaluator) => scorecards?.[evaluator.id]?.updatedAt)?.id ??
    PANEL_EVALUATORS[0].id
  );
}

export function CandidateForm({ initial }: CandidateFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const submissionId = searchParams.get("submission");
  const isEdit = !!initial;
  const submission: Submission | null =
    (!isEdit && submissionId ? getSubmissionById(submissionId) : null) ??
    (isEdit && initial?.sourceSubmissionId
      ? getSubmissionById(initial.sourceSubmissionId)
      : null) ??
    null;

  const [name, setName] = useState(initial?.name ?? submission?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? submission?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? submission?.phone ?? "");
  const [hometown, setHometown] = useState(initial?.hometown ?? submission?.hometown ?? "");
  const [graduationLocationPlan, setGraduationLocationPlan] = useState(
    initial?.graduationLocationPlan ?? ""
  );
  const [degree, setDegree] = useState(initial?.degree ?? submissionDegree(submission));
  const [batch, setBatch] = useState(initial?.batch ?? submission?.batch ?? "");
  const [yearsOfExperience, setYearsOfExperience] = useState(
    initial?.yearsOfExperience ?? submission?.experience ?? ""
  );
  const [archetype, setArchetype] = useState<Archetype>(
    initial?.archetype ?? submission?.suggestedArchetype ?? "pilot"
  );
  const [activeEvaluatorId, setActiveEvaluatorId] = useState<PanelEvaluatorId>(() =>
    firstEvaluatorId(initial?.evaluatorScorecards)
  );
  const [scorecards, setScorecards] = useState<EvaluatorScorecards>(
    initial?.evaluatorScorecards ?? {}
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseScores: Scores = useMemo(
    () => ({
      technicalDepth:
        initial?.scores.technicalDepth ??
        submission?.suggestedScores?.technicalDepth ??
        DEFAULT_SCORES.technicalDepth,
      personality:
        initial?.scores.personality ??
        submission?.suggestedScores?.personality ??
        DEFAULT_SCORES.personality,
      communication:
        initial?.scores.communication ??
        submission?.suggestedScores?.communication ??
        DEFAULT_SCORES.communication,
      khandaniPan:
        initial?.scores.khandaniPan ??
        submission?.suggestedScores?.khandaniPan ??
        DEFAULT_SCORES.khandaniPan,
    }),
    [initial?.scores, submission?.suggestedScores]
  );
  const activeScorecard = scorecards[activeEvaluatorId];
  const scores = activeScorecard?.updatedAt ? activeScorecard.scores : null;
  const evaluatorNotes = activeScorecard?.notes ?? "";
  const aggregateScores = aggregateEvaluatorScores(scorecards, baseScores);
  const customDegree = degree && !isKnownDegree(degree) ? degree : "";
  const customBatch = batch && !isKnownAcademicBatch(batch) ? batch : "";
  const submittedEvaluatorCount = PANEL_EVALUATORS.filter(
    (evaluator) => scorecards[evaluator.id]?.updatedAt
  ).length;
  const totalScore = calcTotalScore(aggregateScores);

  function updateActiveScorecard(nextScores: Scores | null, nextNotes = evaluatorNotes) {
    setScorecards((prev) =>
      setEvaluatorScorecard(
        prev,
        activeEvaluatorId,
        nextScores,
        nextNotes,
        prev[activeEvaluatorId]?.updatedAt ?? new Date().toISOString()
      )
    );
  }

  function startActiveScorecard() {
    updateActiveScorecard(baseScores, evaluatorNotes);
  }

  function clearActiveScorecard() {
    updateActiveScorecard(null, "");
  }

  function setScore(key: keyof Scores, val: number) {
    updateActiveScorecard({ ...(scores ?? baseScores), [key]: val });
  }

  function setEvaluatorNotes(notes: string) {
    if (scores) updateActiveScorecard(scores, notes);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!hometown.trim() || !graduationLocationPlan.trim()) {
      setError("Hometown and plan after graduation are required.");
      return;
    }

    setSaving(true);
    const candidateId = initial?.id ?? generateId();
    const now = new Date().toISOString();
    const nextScorecards: EvaluatorScorecards = scores
      ? setEvaluatorScorecard(
          scorecards,
          activeEvaluatorId,
          scores,
          evaluatorNotes.trim(),
          scorecards[activeEvaluatorId]?.updatedAt ?? now
        )
      : scorecards;
    const nextAggregateScores = aggregateEvaluatorScores(nextScorecards, baseScores);

    const candidate: Candidate = {
      ...initial,
      id: candidateId,
      name: name.trim() || "Anonymous",
      email: email.trim(),
      phone: phone.trim(),
      hometown: hometown.trim(),
      currentCity: initial?.currentCity ?? "",
      graduationLocationPlan: graduationLocationPlan.trim(),
      degree: degree.trim(),
      batch: batch.trim(),
      yearsOfExperience: yearsOfExperience.trim(),
      evaluators: evaluatorDisplayNames(nextScorecards),
      notes: initial?.notes ?? "",
      archetype,
      scores: nextAggregateScores,
      evaluatorScorecards: nextScorecards,
      status: initial?.status ?? "screening",
      source: initial?.source ?? "panel",
      sourceSubmissionId: submissionId ?? initial?.sourceSubmissionId,
      createdAt: initial?.createdAt ?? now,
    };

    try {
      await saveCandidate(candidate);
      if (submissionId) updateSubmissionStatus(submissionId, "evaluated", candidateId);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save candidate");
    } finally {
      setSaving(false);
    }
  }

  const totalColor =
    totalScore >= 8
      ? "text-emerald-400"
      : totalScore >= 5
        ? "text-amber-400"
        : "text-red-400";

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ButtonLink href={submissionId ? "/submissions" : "/"} variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </ButtonLink>
          <div>
            <h1 className="text-lg font-semibold">
              {isEdit ? "Edit Candidate" : "Score New Candidate"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {submission ? `From CV: ${submission.cvFileName}` : "Select evaluator tab, score, then save"}
            </p>
          </div>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Aggregate
            </p>
            <p className={cn("text-2xl font-bold tabular-nums", totalColor)}>
              {totalScore}
              <span className="text-xs font-normal text-muted-foreground">/10</span>
            </p>
          </div>
        </div>
      </div>

      {submission && (
        <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center">
          <FileText className="h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">CV Pre-filled</p>
            <p className="truncate text-xs text-muted-foreground">
              {submission.email || submission.phone || "Review and adjust the extracted info below"}
            </p>
            <p className="mt-1 truncate text-[11px] text-muted-foreground">{submission.cvFileName}</p>
            {(submission.suggestedArchetype || submission.suggestedScores) && (
              <p className="mt-2 text-xs leading-relaxed text-primary/95">
                <span className="font-semibold">AI starting point (CV only): </span>
                {[
                  submission.suggestedArchetype
                    ? ARCHETYPE_META[submission.suggestedArchetype].label
                    : null,
                  submission.suggestedScores
                    ? `scores ~${calcTotalScore(submission.suggestedScores)}/10 avg - confirm after conversation`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </div>
          <ViewCvButton submissionId={submission.id} variant="outline" className="shrink-0" />
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Candidate Info
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs">Full Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-9 bg-card text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-9 bg-card text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs">Phone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-9 bg-card text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="degree" className="text-xs">Degree & Major</Label>
            <select
              id="degree"
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
            >
              <option value="">Select degree / major</option>
              {customDegree && <option value={customDegree}>{customDegree}</option>}
              {DEGREE_GROUPS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="batch" className="text-xs">Batch / Year</Label>
            <select
              id="batch"
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
            >
              <option value="">Select batch</option>
              {customBatch && <option value={customBatch}>{customBatch}</option>}
              {ACADEMIC_BATCH_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="experience" className="text-xs">Experience</Label>
            <Input id="experience" value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value)} className="h-9 bg-card text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hometown" className="text-xs">
              Hometown <span className="text-destructive">*</span>
            </Label>
            <Input id="hometown" required value={hometown} onChange={(e) => setHometown(e.target.value)} className="h-9 bg-card text-sm" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="graduationLocationPlan" className="text-xs">
              Plan After Graduation <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="graduationLocationPlan"
              required
              placeholder="Where do they plan to work/live after graduation?"
              value={graduationLocationPlan}
              onChange={(e) => setGraduationLocationPlan(e.target.value)}
              className="min-h-20 resize-none bg-card text-sm"
            />
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="space-y-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Evaluator Scorecards
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Select your name before scoring. Aggregate uses submitted tabs only.
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              {submittedEvaluatorCount} of {PANEL_EVALUATORS.length} scored
            </div>
          </div>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {PANEL_EVALUATORS.map((evaluator) => {
              const isActive = activeEvaluatorId === evaluator.id;
              const hasSubmitted = Boolean(scorecards[evaluator.id]?.updatedAt);

              return (
                <button
                  key={evaluator.id}
                  type="button"
                  onClick={() => setActiveEvaluatorId(evaluator.id)}
                  className={cn(
                    "shrink-0 rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span className="block font-semibold">{evaluator.displayName}</span>
                  <span className="mt-0.5 block text-[10px] opacity-80">
                    {hasSubmitted ? "Score saved" : "Not scored"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {scores ? (
          <>
            <div className="space-y-3">
              {SCORE_DIMENSIONS.map((dim) => (
                <ScoreSlider
                  key={dim.key}
                  label={dim.label}
                  description={dim.description}
                  lowLabel={dim.lowLabel}
                  highLabel={dim.highLabel}
                  value={scores[dim.key]}
                  onChange={(val) => setScore(dim.key, val)}
                  aiReason={submission?.suggestedScoreReasons?.[dim.key]}
                />
              ))}
            </div>

            <div className="space-y-3">
              <Textarea
                placeholder={`Notes from ${evaluatorDisplayName(activeEvaluatorId)}...`}
                value={evaluatorNotes}
                onChange={(e) => setEvaluatorNotes(e.target.value)}
                className="min-h-24 resize-none bg-card text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={clearActiveScorecard}
              >
                <CircleSlash2 className="h-4 w-4" />
                Clear score
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-start gap-4 rounded-lg border border-dashed border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <CircleSlash2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  No score for {evaluatorDisplayName(activeEvaluatorId)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  This tab is excluded from the aggregate.
                </p>
              </div>
            </div>
            <Button type="button" size="sm" onClick={startActiveScorecard}>
              Start scoring
            </Button>
          </div>
        )}
      </section>

      <Separator />

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Archetype Tag
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            The scores tell you how good - the tag tells you who they are.
          </p>
        </div>

        {submission?.evaluationSuggestionNote ? (
          <div className="space-y-1.5 rounded-md border border-primary/25 bg-primary/5 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary/90">
              AI suggestion (from CV only)
            </p>
            <p className="text-sm leading-relaxed text-foreground/90">
              {submission.evaluationSuggestionNote}
            </p>
          </div>
        ) : null}

        <ArchetypePicker value={archetype} onChange={setArchetype} />
      </section>

      <div className="flex items-center justify-between border-t border-border pt-6">
        <div className="flex items-center gap-3 sm:hidden">
          <p className="text-xs text-muted-foreground">Aggregate</p>
          <p className={cn("text-xl font-bold tabular-nums", totalColor)}>
            {totalScore}/10
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <ButtonLink href={submissionId ? "/submissions" : "/"} variant="ghost" size="sm">
            Cancel
          </ButtonLink>
          <Button type="submit" size="sm" className="gap-2" disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "Saving..." : isEdit ? "Save Evaluation" : "Save Candidate"}
          </Button>
        </div>
      </div>
    </form>
  );
}
