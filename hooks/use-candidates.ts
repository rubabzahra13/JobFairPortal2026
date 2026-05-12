"use client";

import { useCallback, useEffect, useState } from "react";
import { Candidate } from "@/lib/types";
import { deleteCandidate, getCandidates } from "@/lib/store";

export function useCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setCandidates(await getCandidates());
    } catch (err) {
      setCandidates([]);
      setError(err instanceof Error ? err.message : "Failed to load candidates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    getCandidates()
      .then((nextCandidates) => {
        if (!active) return;
        setCandidates(nextCandidates);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setCandidates([]);
        setError(err instanceof Error ? err.message : "Failed to load candidates");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const remove = useCallback(
    async (id: string) => {
      setError(null);
      try {
        await deleteCandidate(id);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete candidate");
      }
    },
    [refresh]
  );

  return { candidates, loading, error, refresh, remove };
}
