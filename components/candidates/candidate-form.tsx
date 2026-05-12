"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Candidate, Archetype, SCORE_DIMENSIONS, calcTotalScore, ARCHETYPE_META } from "@/lib/types";
import { saveCandidate, generateId } from "@/lib/store";
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
import { ArrowLeft, Save, UserPlus, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface CandidateFormProps {
  initial?: Candidate;
}

export function CandidateForm({ initial }: CandidateFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const submissionId = searchParams.get("submission");
  const isEdit = !!initial;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [name, setName] = useState(initial?.name ?? "");
  const [hometown, setHometown] = useState(initial?.hometown ?? "");
  const [degree, setDegree] = useState(initial?.degree ?? "");
  const [batch, setBatch] = useState(initial?.batch ?? "");
  const [yearsOfExperience, setYearsOfExperience] = useState(initial?.yearsOfExperience ?? "");
  const [evaluators, setEvaluators] = useState(initial?.evaluators ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [archetype, setArchetype] = useState<Archetype>(initial?.archetype ?? "pilot");
  const [scores, setScores] = useState({
    technicalDepth: initial?.scores.technicalDepth ?? 5,
    personality: initial?.scores.personality ?? 5,
    communication: initial?.scores.communication ?? 5,
    khandaniPan: initial?.scores.khandaniPan ?? 5,
  });

  // Load submission data if submissionId is present
  useEffect(() => {
    if (submissionId && !isEdit) {
      const sub = getSubmissionById(submissionId);
      if (sub) {
        setSubmission(sub);
        // Pre-fill form with submission data
        setName(sub.name || "");
        setDegree(sub.degree ? `${sub.degree}${sub.university ? `, ${sub.university}` : ""}` : "");
        setBatch(sub.batch || "");
        setYearsOfExperience(sub.experience || "");
        setHometown(sub.hometown || "");
        setEvaluators("Pre-filled");
        if (sub.suggestedArchetype) {
          setArchetype(sub.suggestedArchetype);
        }
        if (sub.suggestedScores) {
          setScores({ ...sub.suggestedScores });
        }
        if (sub.personalitySummary) {
          setNotes(sub.personalitySummary);
        }
      }
    }
  }, [submissionId, isEdit]);

  useEffect(() => {
    if (isEdit && initial?.sourceSubmissionId) {
      const sub = getSubmissionById(initial.sourceSubmissionId);
      if (sub) setSubmission(sub);
    }
  }, [isEdit, initial?.sourceSubmissionId]);

  const totalScore = calcTotalScore(scores);

  function setScore(key: keyof typeof scores, val: number) {
    setScores((prev) => ({ ...prev, [key]: val }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const candidateId = initial?.id ?? generateId();
    const evaluatorsTrimmed = evaluators.trim();
    const evaluatorsFinal =
      evaluatorsTrimmed === "Pre-filled" ? "" : evaluatorsTrimmed;

    const candidate: Candidate = {
      id: candidateId,
      name: name.trim() || "Anonymous",
      hometown,
      degree,
      batch,
      yearsOfExperience,
      evaluators: evaluatorsFinal,
      notes,
      archetype,
      scores,
      sourceSubmissionId: submissionId ?? initial?.sourceSubmissionId,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    };
    saveCandidate(candidate);

    // Update submission status if this came from a submission
    if (submissionId) {
      updateSubmissionStatus(submissionId, "evaluated", candidateId);
    }

    router.push("/");
    router.refresh();
  }

  const totalColor =
    totalScore >= 8
      ? "text-emerald-400"
      : totalScore >= 5
      ? "text-amber-400"
      : "text-red-400";

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
      {/* Header */}
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
              {submission ? `From CV: ${submission.cvFileName}` : "Fill in scores while impression is fresh"}
            </p>
          </div>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Avg Score
            </p>
            <p className={cn("text-2xl font-bold tabular-nums", totalColor)}>
              {totalScore}
              <span className="text-xs font-normal text-muted-foreground">/10</span>
            </p>
          </div>
        </div>
      </div>

      {/* CV Info Banner */}
      {submission && (
        <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center">
          <FileText className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">CV Pre-filled</p>
            <p className="text-xs text-muted-foreground truncate">
              {submission.email || submission.phone || "Review and adjust the extracted info below"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 truncate">{submission.cvFileName}</p>
            {(submission.suggestedArchetype || submission.suggestedScores) && (
              <p className="text-xs text-primary/95 mt-2 leading-relaxed">
                <span className="font-semibold">AI starting point (CV only): </span>
                {[
                  submission.suggestedArchetype
                    ? ARCHETYPE_META[submission.suggestedArchetype].label
                    : null,
                  submission.suggestedScores
                    ? `scores ~${calcTotalScore(submission.suggestedScores)}/10 avg — confirm after conversation`
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

      {/* Section: Identity */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Candidate Info
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs">
              Full Name
            </Label>
            <Input
              id="name"
              placeholder="e.g. Ali Hassan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 bg-card text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="degree" className="text-xs">
              Degree & Major
            </Label>
            <Input
              id="degree"
              placeholder="e.g. CS, FAST NUCES"
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              className="h-9 bg-card text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="batch" className="text-xs">
              Batch / Year
            </Label>
            <Input
              id="batch"
              placeholder="e.g. 2025, 7th Semester"
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              className="h-9 bg-card text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="experience" className="text-xs">
              Experience
            </Label>
            <Input
              id="experience"
              placeholder="e.g. 0 years, 1 internship"
              value={yearsOfExperience}
              onChange={(e) => setYearsOfExperience(e.target.value)}
              className="h-9 bg-card text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location" className="text-xs">
              Location
            </Label>
            <Input
              id="location"
              placeholder="e.g. Lahore"
              value={hometown}
              onChange={(e) => setHometown(e.target.value)}
              className="h-9 bg-card text-sm"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="evaluators" className="text-xs">
              Evaluators
            </Label>
            <Input
              id="evaluators"
              placeholder="e.g. Usman, Sarah"
              value={evaluators}
              onChange={(e) => setEvaluators(e.target.value)}
              className="h-9 bg-card text-sm"
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Section: Scores */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          The Four Dimensions
        </h2>
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
      </section>

      <Separator />

      {/* Section: Archetype */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Archetype Tag
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            The scores tell you how good — the tag tells you who they are.
          </p>
        </div>

        {/* AI Archetype Suggestion */}
        {submission?.evaluationSuggestionNote ? (
          <div className="rounded-md border border-primary/25 bg-primary/5 px-3 py-2.5 space-y-1.5">
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

      <Separator />

      {/* Section: Notes */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Notes
        </h2>
        <Textarea
          placeholder="Key impressions, standout moments, red flags, anything worth capturing while fresh..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-24 resize-none bg-card text-sm"
        />
      </section>

      {/* Submit */}
      <div className="flex items-center justify-between border-t border-border pt-6">
        <div className="flex items-center gap-3 sm:hidden">
          <p className="text-xs text-muted-foreground">Avg</p>
          <p className={cn("text-xl font-bold tabular-nums", totalColor)}>
            {totalScore}/10
          </p>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <ButtonLink href={submissionId ? "/submissions" : "/"} variant="ghost" size="sm">
            Cancel
          </ButtonLink>
          <Button type="submit" size="sm" className="gap-2">
            <Save className="h-3.5 w-3.5" />
            {isEdit ? "Save Changes" : "Save Candidate"}
          </Button>
        </div>
      </div>
    </form>
  );
}
