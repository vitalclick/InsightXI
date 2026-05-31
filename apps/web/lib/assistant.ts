import { api } from "../services/api-client";
import type { MatchView, Team } from "./types";

export interface AssistantAnswer {
  /** Short headline answer. */
  title: string;
  /** Explainable supporting lines (model reasoning / stats). */
  lines: string[];
  /** Optional deep-link into the app for the full view. */
  href?: string;
  hrefLabel?: string;
  /** Whether this came back empty / needs the AI service. */
  note?: string;
}

export type Suggestion = { label: string; query: string };

export const SUGGESTIONS: Suggestion[] = [
  { label: "Top pick today", query: "top pick today" },
  { label: "Most likely upset", query: "biggest upset" },
  { label: "Highest-scoring fixture", query: "most goals expected" },
];

/** Find a team mentioned in the query. */
function matchTeam(query: string, teams: Team[]): Team | undefined {
  const q = query.toLowerCase();
  return teams.find((t) => q.includes(t.name.toLowerCase()) || q.includes(t.shortName.toLowerCase()));
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

/**
 * Grounded assistant: every answer is derived from real API data (ratings,
 * predictions, H2H) — it never invents numbers. Predictions are framed as
 * probabilities, consistent with the platform's statistical-integrity rules.
 */
export async function answerQuery(query: string): Promise<AssistantAnswer> {
  const q = query.trim().toLowerCase();
  if (!q) return { title: "Ask about a team, fixture or today's picks.", lines: [] };

  const [teams, fixtures] = await Promise.all([api.teams(), api.fixtures()]);

  // Predictions for the upcoming slate (parallel, tolerant of an offline AI).
  const preds = await Promise.all(
    fixtures.map((m) =>
      api
        .prediction(m.id)
        .then((p) => ({ m, p }))
        .catch(() => ({ m, p: undefined })),
    ),
  );
  const withPred = preds.filter((x): x is { m: MatchView; p: NonNullable<typeof x.p> } => Boolean(x.p));

  // --- Team-specific question --------------------------------------------
  const team = matchTeam(query, teams);
  if (team) {
    const next = withPred.find((x) => x.m.homeTeamId === team.id || x.m.awayTeamId === team.id);
    try {
      const r = await api.teamRatings(team.id);
      const lines = [
        `Elo ${Math.round(r.elo)} · recent form ${r.recentFormPoints}/15`,
        `Attack strength ${r.attackStrength.toFixed(2)} · defense ${r.defenseStrength.toFixed(2)} (1.0 = league average)`,
        `Avg xG ${r.avgXgFor.toFixed(2)} for / ${r.avgXgAgainst.toFixed(2)} against`,
      ];
      if (next) {
        const isHome = next.m.homeTeamId === team.id;
        const winP = isHome ? next.p.outcome.homeWin : next.p.outcome.awayWin;
        const opp = isHome ? next.m.awayTeamName : next.m.homeTeamName;
        lines.push(`Next up vs ${opp}: model gives ${team.name} a ${pct(winP)} win probability (${next.p.confidenceLevel}).`);
      }
      return {
        title: team.name,
        lines,
        href: next ? `/matches/${next.m.id}` : `/teams/${team.id}`,
        hrefLabel: next ? "Open match intel →" : "Team profile →",
      };
    } catch {
      return { title: team.name, lines: [], note: "Ratings are temporarily unavailable." };
    }
  }

  if (withPred.length === 0) {
    return {
      title: "No model output yet",
      lines: [],
      note: "Predictions appear once the AI service is reachable. Try asking about a team's ratings instead.",
    };
  }

  // --- Highest-scoring fixture -------------------------------------------
  if (/(most|highest).*(goal|scor)|goals expected|over/.test(q)) {
    const top = [...withPred].sort(
      (a, b) =>
        b.p.expectedGoals.home + b.p.expectedGoals.away - (a.p.expectedGoals.home + a.p.expectedGoals.away),
    )[0];
    const total = top.p.expectedGoals.home + top.p.expectedGoals.away;
    return {
      title: `Highest-scoring projection: ${top.m.homeTeamName} v ${top.m.awayTeamName}`,
      lines: [
        `Combined expected goals ${total.toFixed(2)} (${top.p.expectedGoals.home.toFixed(2)} – ${top.p.expectedGoals.away.toFixed(2)}).`,
        ...top.p.markets.filter((m) => /over|both teams/i.test(m.label)).slice(0, 3).map((m) => `${m.label}: ${pct(m.probability)}`),
      ],
      href: `/matches/${top.m.id}`,
      hrefLabel: "Open match intel →",
    };
  }

  // --- Biggest upset (low-confidence favourite / away-leaning) -----------
  if (/upset|surprise|underdog/.test(q)) {
    const upset = [...withPred].sort((a, b) => b.p.outcome.awayWin - a.p.outcome.awayWin)[0];
    return {
      title: `Most upset-prone: ${upset.m.homeTeamName} v ${upset.m.awayTeamName}`,
      lines: [
        `Away win probability ${pct(upset.p.outcome.awayWin)} — the strongest away lean on the slate.`,
        `Home ${pct(upset.p.outcome.homeWin)} · Draw ${pct(upset.p.outcome.draw)} · Away ${pct(upset.p.outcome.awayWin)}.`,
      ],
      href: `/matches/${upset.m.id}`,
      hrefLabel: "Open match intel →",
    };
  }

  // --- Default: top confidence pick --------------------------------------
  const top = [...withPred].sort((a, b) => b.p.topSelection.probability - a.p.topSelection.probability)[0];
  return {
    title: `Top pick: ${top.m.homeTeamName} v ${top.m.awayTeamName}`,
    lines: [
      `${top.p.topSelection.label} at ${pct(top.p.topSelection.probability)} (${top.p.confidenceLevel}).`,
      ...top.p.explanations.slice(0, 3),
    ],
    href: `/matches/${top.m.id}`,
    hrefLabel: "Open match intel →",
  };
}
