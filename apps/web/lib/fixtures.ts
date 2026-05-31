import type { MatchView } from "./types";

/** Distinct matchdays present in a fixture list, ascending. */
export function distinctMatchdays(fixtures: MatchView[]): number[] {
  return [...new Set(fixtures.map((m) => m.matchday))].sort((a, b) => a - b);
}

/**
 * Filter fixtures to a single matchday. A `null` matchday means "all" and
 * returns the list unchanged, so callers can bind it directly to UI state.
 */
export function filterByMatchday(fixtures: MatchView[], matchday: number | null): MatchView[] {
  if (matchday === null) return fixtures;
  return fixtures.filter((m) => m.matchday === matchday);
}
