"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Candidate, Archetype, SCORE_DIMENSIONS, calcTotalScore, ARCHETYPE_META } from "@/lib/types";
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
import { AlertCircle, ArrowLeft, FileText, Loader2, Save, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CandidateFormProps {
  initial?: Candidate;
}

function submissionDegree(submission: Submission | null): string {
  if (!submission?.degree) return "";
  return `${submission.degree}${submission.university ? `, ${submission.university}` : ""}`;
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
  const [currentCity, setCurrentCity] = useState(initial?.currentCity ?? "");
  const [graduationLocationPlan, setGraduationLocationPlan] = useState(
    initial?.graduationLocationPlan ?? ""
  );
  const [degree, setDegree] = useState(initial?.degree ?? submissionDegree(submission));
  const [batch, setBatch] = useState(initial?.batch ?? submission?.batch ?? "");
  const [yearsOfExperience, setYearsOfExperience] = useState(
    initial?.yearsOfExperience ?? submission?.experience ?? ""
  );
  const [evaluators, setEvaluators] = useState(
    initial?.evaluators ?? (submission ? "Pre-filled" : "")
  );
  const [notes, setNotes] = useState(initial?.notes ?? submission?.personalitySummary ?? "");
  const [archetype, setArchetype] = useState<Archetype>(
    initial?.archetype ?? submission?.suggestedArchetype ?? "pilot"
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState({
    technicalDepth: initial?.scores.technicalDepth ?? submission?.suggestedScores?.technicalDepth ?? 5,
    personality: initial?.scores.personality ?? submission?.suggestedScores?.personality ?? 5,
    communication: initial?.scores.communication ?? submission?.suggestedScores?.communication ?? 5,
    khandaniPan: initial?.scores.khandaniPan ?? submission?.suggestedScores?.khandaniPan ?? 5,
  });

  const totalScore = calcTotalScore(scores);

  function setScore(key: keyof typeof scores, val: number) {
    setScores((prev) => ({ ...prev, [key]: val }));
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
    const evaluatorsTrimmed = evaluators.trim();
    const evaluatorsFinal = evaluatorsTrimmed === "Pre-filled" ? "" : evaluatorsTrimmed;

    const candidate: Candidate = {
      ...initial,
      id: candidateId,
      name: name.trim() || "Anonymous",
      email: email.trim(),
      phone: phone.trim(),
      hometown: hometown.trim(),
      currentCity: currentCity.trim(),
      graduationLocationPlan: graduationLocationPlan.trim(),
      degree: degree.trim(),
      batch: batch.trim(),
      yearsOfExperience: yearsOfExperience.trim(),
      evaluators: evaluatorsFinal,
      notes: notes.trim(),
      archetype,
      scores,
      status: initial?.status ?? "screening",
      source: initial?.source ?? "panel",
      sourceSubmissionId: submissionId ?? initial?.sourceSubmissionId,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
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
            <Label htmlFor="email" className="text-xs">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 bg-card text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs">
              Phone
            </Label>
            <Input
              id="phone"
              placeholder="+92..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
              placeholder="e.g. 2026, 8th Semester"
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
            <Label htmlFor="hometown" className="text-xs">
              Hometown <span className="text-destructive">*</span>
            </Label>
            <Input
              id="hometown"
              required
              placeholder="e.g. Lahore"
              value={hometown}
              onChange={(e) => setHometown(e.target.value)}
              className="h-9 bg-card text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="currentCity" className="text-xs">
              Current City
            </Label>
            <Input
              id="currentCity"
              placeholder="e.g. Islamabad"
              value={currentCity}
              onChange={(e) => setCurrentCity(e.target.value)}
              className="h-9 bg-card text-sm"
            />
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

      <Separator />

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

      <div className="flex items-center justify-between border-t border-border pt-6">
        <div className="flex items-center gap-3 sm:hidden">
          <p className="text-xs text-muted-foreground">Avg</p>
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
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Save Candidate"}
          </Button>
        </div>
      </div>
    </form>
  );
}
