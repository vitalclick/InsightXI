"use client";

import { useQueries } from "@tanstack/react-query";
import { api } from "../services/api-client";
import type { MatchPrediction } from "../lib/types";

/**
 * Fetch predictions for a set of matches in parallel. Gracefully degrades:
 * matches whose prediction fails (AI service offline) simply map to undefined.
 */
export function usePredictions(matchIds: string[]): Record<string, MatchPrediction | undefined> {
  const results = useQueries({
    queries: matchIds.map((id) => ({
      queryKey: ["prediction", id],
      queryFn: () => api.prediction(id),
      retry: 0,
      staleTime: 5 * 60_000,
    })),
  });
  const map: Record<string, MatchPrediction | undefined> = {};
  matchIds.forEach((id, i) => {
    map[id] = results[i]?.data;
  });
  return map;
}

/** Confidence colour buckets used across the UI. */
export function confColor(pct: number): string {
  if (pct >= 70) return "var(--green)";
  if (pct >= 60) return "var(--blue-2)";
  return "var(--gold)";
}
