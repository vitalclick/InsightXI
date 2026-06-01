/**
 * InsightXI Mobile — view-model helpers mapping the real API domain
 * (MatchView / MatchPrediction) onto the shapes the mobile screens render.
 */
import type { MatchPrediction, MatchView } from "../../lib/types";

/** Default competition used where a single league id is required (ratings). */
export const DEFAULT_LEAGUE = "epl";

/** The minimal match handle a detail screen is pushed with. */
export type MatchArg = Pick<
  MatchView,
  "id" | "homeTeamId" | "awayTeamId" | "homeTeamName" | "awayTeamName"
> &
  Partial<MatchView>;

export interface OutcomePct {
  hp: number;
  dp: number;
  ap: number;
}

/** Round a prediction's 1X2 outcome to whole-percent home/draw/away. */
export function outcomePct(p?: MatchPrediction): OutcomePct | null {
  if (!p) return null;
  return {
    hp: Math.round(p.outcome.homeWin * 100),
    dp: Math.round(p.outcome.draw * 100),
    ap: Math.round(p.outcome.awayWin * 100),
  };
}

/** Top-selection confidence as a whole percent, or null when no prediction. */
export function confPct(p?: MatchPrediction): number | null {
  return p ? Math.round(p.topSelection.probability * 100) : null;
}

export type PickCode = "1" | "X" | "2";

/** The model's leaned 1X2 pick. */
export function pickOf(p?: MatchPrediction): PickCode | null {
  if (!p) return null;
  const { homeWin, draw, awayWin } = p.outcome;
  if (homeWin >= draw && homeWin >= awayWin) return "1";
  if (awayWin >= draw) return "2";
  return "X";
}

export function pickClass(pick: PickCode): "h" | "d" | "a" {
  return pick === "1" ? "h" : pick === "2" ? "a" : "d";
}

/** First market whose label loosely matches `needle`, as a whole percent. */
export function findMarketPct(p: MatchPrediction | undefined, needle: string): number | null {
  if (!p) return null;
  const m = p.markets.find((x) => x.label.toLowerCase().includes(needle.toLowerCase()));
  return m ? Math.round(m.probability * 100) : null;
}

/** A short, date-bucket label for a fixture (Today / Tomorrow / weekday). */
export function dayLabel(utcDate: string, now = Date.now()): string {
  const d = new Date(utcDate);
  const startOf = (t: number) => {
    const x = new Date(t);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
  };
  const days = Math.round((startOf(d.getTime()) - startOf(now)) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "short" });
}

export function timeLabel(utcDate: string): string {
  return new Date(utcDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Curated, club-agnostic intelligence blurbs (no fabricated club data). */
export const AI_INSIGHTS = [
  {
    t: "Pressing edge detected",
    d: "Top side recovers the ball <b>14.2× per 90</b> — well above the league mean and their next opponent's build-up tolerance.",
    tag: "Tactical",
    cls: "blue",
  },
  {
    t: "xG overperformance flag",
    d: "A leader is scoring <b>1.4 goals above xG</b> over six games — finishing regression is the base-rate expectation.",
    tag: "Trend",
    cls: "amber",
  },
  {
    t: "Set-piece threat",
    d: "<b>41%</b> of a contender's goals arrive from set pieces; opponents concede 0.6 xG from corners on average.",
    tag: "Pattern",
    cls: "violet",
  },
  {
    t: "Away fragility",
    d: "A mid-table club concedes <b>1.9 xGA</b> on the road versus 1.0 at home — structure breaks down in transition.",
    tag: "Risk",
    cls: "red",
  },
];
