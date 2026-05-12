"use client";

import { useCallback, useEffect, useState } from "react";
import { Candidate } from "@/lib/types";
import { getCandidates, deleteCandidate } from "@/lib/store";

export function useCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setCandidates(getCandidates());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const remove = useCallback(
    (id: string) => {
      deleteCandidate(id);
      refresh();
    },
    [refresh]
  );

  return { candidates, loading, refresh, remove };
}
