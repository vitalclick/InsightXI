import { api } from "../services/api-client";
import { compareRows } from "./team-strength";
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
  { label: "Compare two teams", query: "compare teams" },
];

/** Find a team mentioned in the query. */
function matchTeam(query: string, teams: Team[]): Team | undefined {
  const q = query.toLowerCase();
  return teams.find((t) => q.includes(t.name.toLowerCase()) || q.includes(t.shortName.toLowerCase()));
}

/**
 * Find up to `limit` distinct teams named in the query, in the order they
 * appear, so "compare Arsenal and Spurs" resolves both sides deterministically.
 */
function matchTeams(query: string, teams: Team[], limit = 2): Team[] {
  const q = query.toLowerCase();
  const hits = teams
    .map((t) => {
      const idx = Math.min(
        ...[t.name.toLowerCase(), t.shortName.toLowerCase()]
          .map((token) => q.indexOf(token))
          .filter((i) => i >= 0),
      );
      return { t, idx };
    })
    .filter((h) => Number.isFinite(h.idx))
    .sort((a, b) => a.idx - b.idx);
  const seen = new Set<string>();
  const out: Team[] = [];
  for (const h of hits) {
    if (seen.has(h.t.id)) continue;
    seen.add(h.t.id);
    out.push(h.t);
    if (out.length === limit) break;
  }
  return out;
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

  // --- Tactical matchup ("how do X and Y match up tactically?") ----------
  // Checked before the generic comparison so a tactical question routes to the
  // matchup engine (formations, press, edge) rather than the ratings tally.
  const isTactical = /\btactic(s|al|ally)?\b|\bmatch\s?up\b|\bformation/.test(q);
  if (isTactical) {
    const pair = matchTeams(query, teams, 2);
    if (pair.length === 2) {
      const [ta, tb] = pair;
      try {
        const m = await api.tacticalMatchup(ta.id, tb.id);
        const edge = m.tacticalEdge;
        const verdict =
          Math.abs(edge) <= 4
            ? "Evenly matched tactical profiles — fine margins expected."
            : `${edge > 0 ? ta.name : tb.name} holds the tactical edge (${edge > 0 ? "+" : ""}${edge}).`;
        return {
          title: `${ta.name} vs ${tb.name} — tactical`,
          lines: [
            verdict,
            `${ta.name}: ${m.home.formation}, ${m.home.possession}% poss, press ${m.home.pressingIntensity} · ${tb.name}: ${m.away.formation}, ${m.away.possession}% poss, press ${m.away.pressingIntensity}`,
            ...m.insights.slice(0, 2),
          ],
          href: `/compare?a=${ta.id}&b=${tb.id}`,
          hrefLabel: "Open tactical matchup →",
        };
      } catch {
        return { title: `${ta.name} vs ${tb.name} — tactical`, lines: [], note: "Tactical data is temporarily unavailable." };
      }
    }
    if (pair.length === 0) {
      return {
        title: "Tactical matchup",
        lines: [],
        href: "/compare",
        hrefLabel: "Open Team Comparison →",
        note: "Name two teams, e.g. “how do Arsenal and Manchester City match up tactically?”.",
      };
    }
    // Exactly one team named — fall through to the single-team ratings answer.
  }

  // --- Comparison ("compare X and Y", "X vs Y") --------------------------
  // Runs before the single-team branch so a two-team query isn't swallowed by
  // the first team it matches. Built from ratings only (no prediction slate).
  const isCompare = /\b(compare|versus|vs\.?)\b/.test(q);
  if (isCompare) {
    const pair = matchTeams(query, teams, 2);
    if (pair.length === 2) {
      const [ta, tb] = pair;
      try {
        const [ra, rb] = await Promise.all([api.teamRatings(ta.id), api.teamRatings(tb.id)]);
        const rows = compareRows(ra, rb);
        let aWins = 0;
        let bWins = 0;
        rows.forEach((row) => (row.better === "a" ? aWins++ : row.better === "b" ? bWins++ : null));
        const verdict =
          aWins === bWins
            ? `Level on the rating metrics (${aWins}-${bWins}).`
            : `${aWins > bWins ? ta.name : tb.name} leads the rating metrics ${Math.max(aWins, bWins)}-${Math.min(aWins, bWins)}.`;
        return {
          title: `${ta.name} vs ${tb.name}`,
          lines: [
            verdict,
            `Elo ${Math.round(ra.elo)} vs ${Math.round(rb.elo)} · form ${ra.recentFormPoints}/15 vs ${rb.recentFormPoints}/15`,
            `Attack ${ra.attackStrength.toFixed(2)} vs ${rb.attackStrength.toFixed(2)} · xG against ${ra.avgXgAgainst.toFixed(2)} vs ${rb.avgXgAgainst.toFixed(2)}`,
          ],
          href: `/compare?a=${ta.id}&b=${tb.id}`,
          hrefLabel: "Open full comparison →",
        };
      } catch {
        return { title: `${ta.name} vs ${tb.name}`, lines: [], note: "Ratings are temporarily unavailable." };
      }
    }
    // Asked to compare but we couldn't pin down two teams.
    return {
      title: "Comparison",
      lines: [],
      href: "/compare",
      hrefLabel: "Open Team Comparison →",
      note: "Name two teams to compare, e.g. “compare Arsenal and Manchester City”.",
    };
  }

  // --- Team-specific question --------------------------------------------
  // Resolve this path from ratings first and only the team's next-fixture
  // prediction. Fanning predictions out across the whole slate up front would
  // make a team query wait on every /predictions call (each ~5s when the AI
  // service is offline) before the available ratings could be shown.
  const team = matchTeam(query, teams);
  if (team) {
    try {
      const r = await api.teamRatings(team.id);
      const lines = [
        `Elo ${Math.round(r.elo)} · recent form ${r.recentFormPoints}/15`,
        `Attack strength ${r.attackStrength.toFixed(2)} · defense ${r.defenseStrength.toFixed(2)} (1.0 = league average)`,
        `Avg xG ${r.avgXgFor.toFixed(2)} for / ${r.avgXgAgainst.toFixed(2)} against`,
      ];
      const nextFixture = fixtures.find((m) => m.homeTeamId === team.id || m.awayTeamId === team.id);
      if (nextFixture) {
        const p = await api.prediction(nextFixture.id).catch(() => undefined);
        if (p) {
          const isHome = nextFixture.homeTeamId === team.id;
          const winP = isHome ? p.outcome.homeWin : p.outcome.awayWin;
          const opp = isHome ? nextFixture.awayTeamName : nextFixture.homeTeamName;
          lines.push(`Next up vs ${opp}: model gives ${team.name} a ${pct(winP)} win probability (${p.confidenceLevel}).`);
        }
      }
      return {
        title: team.name,
        lines,
        href: nextFixture ? `/matches/${nextFixture.id}` : `/teams/${team.id}`,
        hrefLabel: nextFixture ? "Open match intel →" : "Team profile →",
      };
    } catch {
      return { title: team.name, lines: [], note: "Ratings are temporarily unavailable." };
    }
  }

  // --- Slate-level questions: now fan predictions out across the fixtures.
  const preds = await Promise.all(
    fixtures.map((m) =>
      api
        .prediction(m.id)
        .then((p) => ({ m, p }))
        .catch(() => ({ m, p: undefined })),
    ),
  );
  const withPred = preds.filter((x): x is { m: MatchView; p: NonNullable<typeof x.p> } => Boolean(x.p));

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
