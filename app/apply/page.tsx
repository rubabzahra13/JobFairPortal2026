"use client";

import { FormEvent, useState } from "react";
import { AlertCircle, CheckCircle2, FileText, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ACADEMIC_BATCH_OPTIONS, DEGREE_GROUPS } from "@/lib/academic-options";
import { VectorLogo } from "@/components/brand/vector-logo";

type ApplyResponse = {
  candidate?: {
    name?: string;
    resumeUrl?: string;
  };
  warnings?: string[];
  error?: string;
};

export default function ApplyPage() {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [submittedName, setSubmittedName] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setWarnings([]);
    setSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    if (file) {
      formData.set("file", file);
    } else {
      formData.delete("file");
    }

    try {
      const response = await fetch("/api/apply", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json().catch(() => ({}))) as ApplyResponse;

      if (!response.ok) throw new Error(data.error || "Submission failed");

      setWarnings(data.warnings ?? []);
      setSubmittedName(data.candidate?.name || "Candidate");
      form.reset();
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (submittedName) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-xl items-center px-4 py-8 sm:px-6">
        <div className="w-full space-y-6 rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Submitted</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Thanks, {submittedName}. The VECTOR panel has your record.
              </p>
            </div>
          </div>

          {warnings.length > 0 ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
              <p className="font-medium">Saved with warnings</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <Button type="button" variant="outline" className="w-full" onClick={() => setSubmittedName("")}>
            Submit another candidate
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-5 sm:px-6 sm:py-8">
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <div className="space-y-3">
          <div className="flex h-12 w-40 items-center justify-center rounded-xl bg-primary px-3 sm:h-14 sm:w-44">
            <VectorLogo className="h-7 max-w-full" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-primary">
              FAST Islamabad Job Fair
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">VECTOR Candidate Form</h1>
          </div>
        </div>

        {error ? (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <section className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Contact
          </h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input id="name" name="name" required className="h-11 bg-card text-base sm:text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input id="email" name="email" type="email" required className="h-11 bg-card text-base sm:text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs">
                Phone <span className="text-destructive">*</span>
              </Label>
              <Input id="phone" name="phone" required className="h-11 bg-card text-base sm:text-sm" />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Academic Profile
          </h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="degree" className="text-xs">
                Degree / Major <span className="text-destructive">*</span>
              </Label>
              <select
                id="degree"
                name="degree"
                required
                defaultValue=""
                className="h-11 w-full rounded-lg border border-input bg-card px-3 text-base text-foreground outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 sm:text-sm"
              >
                <option value="" disabled>
                  Select degree / major
                </option>
                {DEGREE_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((degree) => (
                      <option key={degree} value={degree}>
                        {degree}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="batch" className="text-xs">
                Batch <span className="text-destructive">*</span>
              </Label>
              <select
                id="batch"
                name="batch"
                required
                defaultValue=""
                className="h-11 w-full rounded-lg border border-input bg-card px-3 text-base text-foreground outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 sm:text-sm"
              >
                <option value="" disabled>
                  Select batch
                </option>
                {ACADEMIC_BATCH_OPTIONS.map((batch) => (
                  <option key={batch} value={batch}>
                    {batch}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hometown" className="text-xs">
                Hometown <span className="text-destructive">*</span>
              </Label>
              <Input id="hometown" name="hometown" required className="h-11 bg-card text-base sm:text-sm" />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Resume
          </h2>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background/40 px-4 py-8 text-center hover:border-primary/60">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <span className="mt-3 max-w-full truncate text-sm font-medium">
              {file ? file.name : "Upload PDF resume"}
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Optional"}
            </span>
            <input
              name="file"
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
        </section>

        <Button type="submit" size="lg" className="h-11 w-full gap-2" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {submitting ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </div>
  );
}
