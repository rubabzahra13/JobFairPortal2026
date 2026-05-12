import { Suspense } from "react";
import { CandidateForm } from "@/components/candidates/candidate-form";
import { Skeleton } from "@/components/ui/skeleton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Score Candidate — VECTOR AI Eval",
};

function FormSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-[300px] rounded-lg" />
      <Skeleton className="h-[400px] rounded-lg" />
    </div>
  );
}

export default function NewCandidatePage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <CandidateForm />
    </Suspense>
  );
}
