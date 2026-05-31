import type { MatchPrediction, MatchView } from "./types";

export type PickCode = "1" | "X" | "2";

/** The model's leaned 1X2 outcome. */
export function pickCode(p: MatchPrediction): PickCode {
  const { homeWin, draw, awayWin } = p.outcome;
  if (homeWin >= draw && homeWin >= awayWin) return "1";
  if (awayWin >= draw) return "2";
  return "X";
}

export interface BoardEntry {
  m: MatchView;
  p?: MatchPrediction;
}

export interface BoardFilter {
  /** Minimum displayed probability as a percentage (0 = show all). */
  minConfidence: number;
  /** Market key to rank/filter by, or null for the model's top selection. */
  market: string | null;
}

export interface BoardView {
  m: MatchView;
  p: MatchPrediction;
  /** Displayed probability (0..1) under the active filter. */
  prob: number;
  label: string;
  pick: PickCode;
}

/** Distinct markets across the predictions, in first-seen order. */
export function availableMarkets(entries: BoardEntry[]): { key: string; label: string }[] {
  const seen = new Map<string, string>();
  for (const { p } of entries) {
    if (!p) continue;
    for (const mk of p.markets) if (!seen.has(mk.market)) seen.set(mk.market, mk.label);
  }
  return [...seen].map(([key, label]) => ({ key, label }));
}

/**
 * Apply the board filters, attaching the display probability/label and sorting
 * by probability descending. When a market is selected, fixtures missing that
 * market are dropped; otherwise the model's top selection is used.
 */
export function boardViews(entries: BoardEntry[], filter: BoardFilter): BoardView[] {
  const out: BoardView[] = [];
  for (const { m, p } of entries) {
    if (!p) continue;
    let prob: number;
    let label: string;
    if (filter.market) {
      const mk = p.markets.find((x) => x.market === filter.market);
      if (!mk) continue;
      prob = mk.probability;
      label = mk.label;
    } else {
      prob = p.topSelection.probability;
      label = p.topSelection.label;
    }
    if (prob * 100 < filter.minConfidence) continue;
    out.push({ m, p, prob, label, pick: pickCode(p) });
  }
  return out.sort((a, b) => b.prob - a.prob);
}
