"use client";

import { use, useEffect, useState } from "react";
import { Candidate } from "@/lib/types";
import { getCandidate } from "@/lib/store";
import { CandidateForm } from "@/components/candidates/candidate-form";
import { Skeleton } from "@/components/ui/skeleton";
import { ButtonLink } from "@/components/ui/button-link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditCandidatePage({ params }: PageProps) {
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
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[300px] rounded-lg" />
        <Skeleton className="h-[400px] rounded-lg" />
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8 sm:px-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h1 className="text-lg font-semibold">Candidate not found</h1>
          <p className="mt-1 text-sm text-muted-foreground">{error || "This candidate is no longer available."}</p>
          <ButtonLink href="/" className="mt-4">
            Back to dashboard
          </ButtonLink>
        </div>
      </div>
    );
  }

  return <CandidateForm initial={candidate} />;
}
