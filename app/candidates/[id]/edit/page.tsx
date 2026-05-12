"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Candidate } from "@/lib/types";
import { getCandidateById } from "@/lib/store";
import { CandidateForm } from "@/components/candidates/candidate-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditCandidatePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [candidate, setCandidate] = useState<Candidate | null | undefined>(undefined);

  useEffect(() => {
    const c = getCandidateById(id);
    if (!c) {
      router.replace("/");
      return;
    }
    setCandidate(c);
  }, [id, router]);

  if (candidate === undefined) return null;
  if (!candidate) return null;

  return <CandidateForm initial={candidate} />;
}
