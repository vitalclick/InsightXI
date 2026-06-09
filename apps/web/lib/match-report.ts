/**
 * Transparent match-report generator (rule-based NLG).
 *
 * Composes a short, readable preview from the model's own outputs — outcome
 * probabilities, expected goals, markets, form, head-to-head and tactical edge.
 * It never invents data and never claims certainty: every line is grounded in a
 * figure the engine produced, in keeping with InsightXI's explainability and
 * statistical-integrity rules. Pure and deterministic, so it unit-tests cleanly
 * and renders identically on web and mobile.
 */
import type { H2HSummary, MatchPrediction } from "./types";

export interface MatchReportInput {
  homeName: string;
  awayName: string;
  pred: MatchPrediction;
  /** Recent form (most-recent-first or chronological — only W/D/L counts). */
  homeForm?: string[];
  awayForm?: string[];
  h2h?: H2HSummary;
  /** Tactical edge (positive favours home), if a tactical read is available. */
  tacticalEdge?: number;
}

export interface MatchReport {
  headline: string;
  summary: string;
  paragraphs: string[];
  keyPoints: string[];
  disclaimer: string;
}

function pct(p: number): number {
  return Math.round(p * 100);
}

function formPoints(form: string[]): number {
  return form.reduce((s, r) => s + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
}

function marketPct(pred: MatchPrediction, needle: string): number | null {
  const m = pred.markets.find((x) => x.label.toLowerCase().includes(needle.toLowerCase()));
  return m ? pct(m.probability) : null;
}

type Lean = "home" | "away" | "draw";
function leanOf(pred: MatchPrediction): Lean {
  const { homeWin, draw, awayWin } = pred.outcome;
  if (homeWin >= draw && homeWin >= awayWin) return "home";
  if (awayWin >= draw) return "away";
  return "draw";
}

/**
 * Build the report. Returns null when there is no prediction to ground it in
 * (callers should fall back to "report unavailable").
 */
export function buildMatchReport(input: MatchReportInput): MatchReport {
  const { homeName, awayName, pred, homeForm, awayForm, h2h, tacticalEdge } = input;
  const lean = leanOf(pred);
  const conf = pct(pred.topSelection.probability);
  const h = pct(pred.outcome.homeWin);
  const d = pct(pred.outcome.draw);
  const a = pct(pred.outcome.awayWin);
  const favName = lean === "home" ? homeName : lean === "away" ? awayName : null;
  const xgH = pred.expectedGoals.home;
  const xgA = pred.expectedGoals.away;

  // ── Headline ──────────────────────────────────────────────────────────
  const tight = Math.abs(h - a) <= 8 && d >= 24;
  const headline = tight
    ? "A finely balanced contest"
    : favName
      ? `${favName} hold the edge`
      : "Honours likely even";

  // ── Summary ───────────────────────────────────────────────────────────
  const summary =
    `The ensemble's strongest read is ${pred.topSelection.label} at ${conf}% — a ` +
    `${pred.confidenceLevel.toLowerCase()} call. Win probabilities split ${h}/${d}/${a} ` +
    `(home/draw/away), with expected goals of ${xgH.toFixed(1)}–${xgA.toFixed(1)}.`;

  // ── Narrative paragraphs ──────────────────────────────────────────────
  const paragraphs: string[] = [];

  const total = xgH + xgA;
  const o25 = marketPct(pred, "Over 2.5");
  const btts = marketPct(pred, "Both Teams") ?? marketPct(pred, "BTTS");
  const goalsBits: string[] = [];
  if (o25 != null) goalsBits.push(`Over 2.5 goals lands at ${o25}%`);
  if (btts != null) goalsBits.push(`both teams to score at ${btts}%`);
  paragraphs.push(
    `The expected-goals model projects roughly ${total.toFixed(1)} goals in the game` +
      (goalsBits.length ? ` — ${goalsBits.join(", ")}.` : ".") +
      (total >= 2.8
        ? " That points to an open, chance-heavy match."
        : total <= 2.0
          ? " That suggests a cagey, lower-scoring affair."
          : " A middling goal expectation, neither end of the spectrum."),
  );

  if (homeForm?.length && awayForm?.length) {
    const hp = formPoints(homeForm);
    const ap = formPoints(awayForm);
    const span = Math.min(homeForm.length, awayForm.length);
    const momentum =
      hp > ap
        ? `${homeName} carry the better recent form (${hp} vs ${ap} points over the last ${span})`
        : ap > hp
          ? `${awayName} arrive in stronger form (${ap} vs ${hp} points over the last ${span})`
          : `both sides are level on recent form (${hp} points apiece over the last ${span})`;
    paragraphs.push(`On momentum, ${momentum}.`);
  }

  if (h2h && h2h.played > 0) {
    const edge =
      h2h.teamAWins > h2h.teamBWins
        ? `${homeName} have shaded this fixture historically`
        : h2h.teamBWins > h2h.teamAWins
          ? `${awayName} have had the better of recent meetings`
          : "the head-to-head is evenly poised";
    paragraphs.push(
      `Across ${h2h.played} past meetings ${edge} (${h2h.teamAWins}–${h2h.draws}–${h2h.teamBWins}), ` +
        `averaging ${h2h.avgGoalsPerGame.toFixed(1)} goals with both scoring in ${pct(h2h.bttsRate)}% of games.`,
    );
  }

  if (typeof tacticalEdge === "number" && tacticalEdge !== 0) {
    const side = tacticalEdge > 0 ? homeName : awayName;
    paragraphs.push(
      `Tactically the matchup tilts toward ${side} (edge ${tacticalEdge > 0 ? "+" : ""}${tacticalEdge}), ` +
        "though tactical reads shift with team selection.",
    );
  }

  // ── Key points ────────────────────────────────────────────────────────
  const keyPoints: string[] = [
    `Model pick: ${pred.topSelection.label} (${conf}% · ${pred.confidenceLevel})`,
    `Expected scoreline ≈ ${Math.round(xgH)}–${Math.round(xgA)} (xG ${xgH.toFixed(1)}–${xgA.toFixed(1)})`,
  ];
  if (o25 != null) keyPoints.push(`Over 2.5 goals: ${o25}%`);
  if (btts != null) keyPoints.push(`Both teams to score: ${btts}%`);
  // Surface the single strongest model explanation, if any.
  if (pred.explanations[0]) keyPoints.push(pred.explanations[0]);

  return {
    headline,
    summary,
    paragraphs,
    keyPoints,
    disclaimer:
      "Generated from the model's probabilities and expected goals — a statistical preview, " +
      "not a guaranteed outcome or betting advice.",
  };
}
