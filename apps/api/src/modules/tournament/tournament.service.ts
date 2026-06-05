import { Injectable } from "@nestjs/common";
import {
  WcRatedTeam,
  WORLD_CUP_GROUPS,
  worldCupLeagueId,
  worldCupTeams,
} from "../../data/world-cup";

/**
 * FIFA World Cup 2026 — projected knockout bracket.
 *
 * Every group match is still in the future, so there are no real results to
 * build a bracket from. Instead this service PROJECTS the tournament with a
 * transparent, deterministic model and presents it as exactly that: a
 * model projection, never a guarantee.
 *
 * Why a self-contained model? The per-group Elo/strength ratings the main
 * Intelligence Engine learns are only comparable *within* a group (each nation
 * has only played its group rivals). A knockout bracket is inherently
 * cross-group, so it needs a single, globally-comparable strength scale. We use
 * a global Poisson model driven by the same hand-tuned attack/defense priors
 * that seed the data — so the bracket needs no live AI service and is fully
 * reproducible.
 *
 * Pipeline:
 *   1. Project each group table from expected points (pairwise Poisson).
 *   2. Qualify the top two of every group + the eight best third-placed teams
 *      (the real 48-team format: 24 + 8 = 32).
 *   3. Seed the 32 by model strength into a standard single-elimination bracket
 *      (strongest sides kept apart) and project every tie through to the final.
 *
 * The R32 slotting follows standard strength seeding rather than FIFA's
 * official third-place combination table; swap `bracketSeedOrder` / the
 * seeding step for the official template without touching the projector.
 */

export interface ProjectedStanding {
  teamId: string;
  name: string;
  shortName: string;
  group: string;
  position: number;
  expectedPoints: number;
  expectedGoalDiff: number;
  finish: "winner" | "runner-up" | "third" | "eliminated";
  /** True for the eight third-placed sides that advance. */
  qualified: boolean;
}

export interface ProjectedGroup {
  code: string;
  leagueId: string;
  table: ProjectedStanding[];
}

export interface BracketTeam {
  teamId: string;
  name: string;
  shortName: string;
  group: string;
  /** Global strength seed, 1 (strongest) … 32. */
  seed: number;
  /** How the side reached the knockouts, e.g. "Winner Group C". */
  source: string;
}

export interface BracketTie {
  id: string;
  round: string;
  home: BracketTeam | null;
  away: BracketTeam | null;
  /** Probability each side advances (draws resolved via extra time / penalties). */
  homeAdvance: number;
  awayAdvance: number;
  expectedGoals: { home: number; away: number };
  winnerId: string | null;
  note: string;
}

export interface BracketRound {
  name: string;
  ties: BracketTie[];
}

export interface TournamentBracket {
  groups: ProjectedGroup[];
  thirdPlaceRanking: ProjectedStanding[];
  qualifiers: BracketTeam[];
  rounds: BracketRound[];
  thirdPlacePlayoff: BracketTie;
  champion: BracketTeam | null;
  model: string;
  disclaimer: string;
}

/** Neutral-venue goal expectation; ~2.5 total goals across the field. */
const NEUTRAL_SCALE = 1.05;
const MAX_GOALS = 8;

const ROUND_NAMES: Record<number, string> = {
  32: "Round of 32",
  16: "Round of 16",
  8: "Quarter-finals",
  4: "Semi-finals",
  2: "Final",
};

@Injectable()
export class TournamentService {
  private cache: TournamentBracket | null = null;

  bracket(): TournamentBracket {
    if (this.cache) return this.cache;

    const groups = this.projectGroups();
    const thirds = this.rankThirds(groups);
    const qualifiers = this.seedQualifiers(groups, thirds);
    const { rounds, semiFinalLosers, champion } = this.projectKnockouts(qualifiers);

    const thirdPlacePlayoff = this.projectTie(
      semiFinalLosers[0] ?? null,
      semiFinalLosers[1] ?? null,
      "Third-place play-off",
      1,
    );

    this.cache = {
      groups,
      thirdPlaceRanking: thirds,
      qualifiers,
      rounds,
      thirdPlacePlayoff,
      champion,
      model:
        "Global Poisson strength model over hand-tuned national-team priors. " +
        "Group tables from expected points; knockout ties resolve draws via a " +
        "strength-weighted extra-time/penalties split.",
      disclaimer:
        "Projection only — a probabilistic read of how the tournament could " +
        "unfold, not a prediction of results or a betting guarantee.",
    };
    return this.cache;
  }

  // ---- Group stage ---------------------------------------------------------

  private projectGroups(): ProjectedGroup[] {
    return WORLD_CUP_GROUPS.map((group) => {
      const teams = group.teams.map((t) => ({ ...t, group: group.code }));
      const xPoints = new Map<string, number>();
      const xGoalDiff = new Map<string, number>();
      for (const t of teams) {
        xPoints.set(t.id, 0);
        xGoalDiff.set(t.id, 0);
      }

      // Single round-robin: every pair meets once.
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          const a = teams[i];
          const b = teams[j];
          const o = this.matchOutcome(a, b);
          xPoints.set(a.id, (xPoints.get(a.id) ?? 0) + 3 * o.pHome + o.pDraw);
          xPoints.set(b.id, (xPoints.get(b.id) ?? 0) + 3 * o.pAway + o.pDraw);
          xGoalDiff.set(a.id, (xGoalDiff.get(a.id) ?? 0) + o.xgHome - o.xgAway);
          xGoalDiff.set(b.id, (xGoalDiff.get(b.id) ?? 0) + o.xgAway - o.xgHome);
        }
      }

      const ranked = [...teams].sort(
        (a, b) =>
          (xPoints.get(b.id) ?? 0) - (xPoints.get(a.id) ?? 0) ||
          (xGoalDiff.get(b.id) ?? 0) - (xGoalDiff.get(a.id) ?? 0) ||
          power(b) - power(a) ||
          a.name.localeCompare(b.name),
      );

      const finishes: ProjectedStanding["finish"][] = [
        "winner",
        "runner-up",
        "third",
        "eliminated",
      ];

      const table: ProjectedStanding[] = ranked.map((t, idx) => ({
        teamId: t.id,
        name: t.name,
        shortName: t.shortName,
        group: group.code,
        position: idx + 1,
        expectedPoints: round2(xPoints.get(t.id) ?? 0),
        expectedGoalDiff: round2(xGoalDiff.get(t.id) ?? 0),
        finish: finishes[idx] ?? "eliminated",
        qualified: idx < 2, // top two always advance; thirds decided later
      }));

      return { code: group.code, leagueId: worldCupLeagueId(group.code), table };
    });
  }

  /** Rank the 12 third-placed sides; the best eight advance. */
  private rankThirds(groups: ProjectedGroup[]): ProjectedStanding[] {
    const thirds = groups
      .map((g) => g.table.find((r) => r.finish === "third"))
      .filter((r): r is ProjectedStanding => Boolean(r));

    const ranked = [...thirds].sort(
      (a, b) =>
        b.expectedPoints - a.expectedPoints ||
        b.expectedGoalDiff - a.expectedGoalDiff ||
        a.name.localeCompare(b.name),
    );
    return ranked.map((r, idx) => ({ ...r, qualified: idx < 8 }));
  }

  // ---- Knockouts -----------------------------------------------------------

  private seedQualifiers(
    groups: ProjectedGroup[],
    thirds: ProjectedStanding[],
  ): BracketTeam[] {
    const byId = teamIndex();
    const pool: Array<{ team: WcRatedTeam; source: string }> = [];

    for (const g of groups) {
      const winner = g.table[0];
      const runnerUp = g.table[1];
      pool.push({ team: byId.get(winner.teamId)!, source: `Winner Group ${g.code}` });
      pool.push({ team: byId.get(runnerUp.teamId)!, source: `Runner-up Group ${g.code}` });
    }
    for (const t of thirds.filter((r) => r.qualified)) {
      pool.push({ team: byId.get(t.teamId)!, source: `3rd place (Group ${t.group})` });
    }

    // Seed by global model strength, strongest first.
    pool.sort((a, b) => power(b.team) - power(a.team) || a.team.name.localeCompare(b.team.name));

    return pool.map(({ team, source }, idx) => ({
      teamId: team.id,
      name: team.name,
      shortName: team.shortName,
      group: team.group,
      seed: idx + 1,
      source,
    }));
  }

  private projectKnockouts(qualifiers: BracketTeam[]): {
    rounds: BracketRound[];
    semiFinalLosers: BracketTeam[];
    champion: BracketTeam | null;
  } {
    // Place the 32 seeds into standard bracket slots so the strongest sides
    // can only meet in the final.
    const order = bracketSeedOrder(qualifiers.length);
    const bySeed = new Map(qualifiers.map((q) => [q.seed, q]));
    let current: BracketTeam[] = order.map((seed) => bySeed.get(seed)!);

    const rounds: BracketRound[] = [];
    const semiFinalLosers: BracketTeam[] = [];

    while (current.length >= 2) {
      const name = ROUND_NAMES[current.length] ?? `Round of ${current.length}`;
      const ties: BracketTie[] = [];
      const winners: BracketTeam[] = [];

      for (let i = 0; i < current.length; i += 2) {
        const home = current[i];
        const away = current[i + 1];
        const tie = this.projectTie(home, away, name, i / 2 + 1);
        ties.push(tie);
        const winner = tie.winnerId === home.teamId ? home : away;
        const loser = tie.winnerId === home.teamId ? away : home;
        winners.push(winner);
        if (name === "Semi-finals") semiFinalLosers.push(loser);
      }

      rounds.push({ name, ties });
      current = winners;
    }

    return { rounds, semiFinalLosers, champion: current[0] ?? null };
  }

  private projectTie(
    home: BracketTeam | null,
    away: BracketTeam | null,
    round: string,
    index: number,
  ): BracketTie {
    const slug = round.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const id = `${slug}-m${index}`;

    if (!home || !away) {
      return {
        id,
        round,
        home,
        away,
        homeAdvance: 0,
        awayAdvance: 0,
        expectedGoals: { home: 0, away: 0 },
        winnerId: null,
        note: "Awaiting both sides.",
      };
    }

    const o = this.matchOutcome(byIdOrThrow(home.teamId), byIdOrThrow(away.teamId));
    // Knockout: no draws — split the draw mass by relative win strength
    // (a proxy for extra time and penalties).
    const decisive = o.pHome + o.pAway || 1;
    const homeAdvance = o.pHome + o.pDraw * (o.pHome / decisive);
    const awayAdvance = 1 - homeAdvance;
    const winnerId = homeAdvance >= awayAdvance ? home.teamId : away.teamId;
    const favourite = homeAdvance >= awayAdvance ? home : away;
    const edge = Math.round(Math.abs(homeAdvance - awayAdvance) * 100);

    return {
      id,
      round,
      home,
      away,
      homeAdvance: round3(homeAdvance),
      awayAdvance: round3(awayAdvance),
      expectedGoals: { home: round2(o.xgHome), away: round2(o.xgAway) },
      winnerId,
      note:
        edge <= 8
          ? `${favourite.name} edge a coin-flip tie (${Math.round(Math.max(homeAdvance, awayAdvance) * 100)}%).`
          : `${favourite.name} projected through (${Math.round(Math.max(homeAdvance, awayAdvance) * 100)}%).`,
    };
  }

  // ---- Match model ---------------------------------------------------------

  /** Neutral-venue Poisson outcome for two rated teams. */
  private matchOutcome(
    a: { attack: number; defense: number },
    b: { attack: number; defense: number },
  ): { pHome: number; pDraw: number; pAway: number; xgHome: number; xgAway: number } {
    const la = clamp((a.attack / b.defense) * NEUTRAL_SCALE, 0.15, 5);
    const lb = clamp((b.attack / a.defense) * NEUTRAL_SCALE, 0.15, 5);

    const pa = poissonPmf(la);
    const pb = poissonPmf(lb);

    let pHome = 0;
    let pDraw = 0;
    let pAway = 0;
    for (let i = 0; i <= MAX_GOALS; i++) {
      for (let j = 0; j <= MAX_GOALS; j++) {
        const p = pa[i] * pb[j];
        if (i > j) pHome += p;
        else if (i === j) pDraw += p;
        else pAway += p;
      }
    }
    const total = pHome + pDraw + pAway || 1;
    return {
      pHome: pHome / total,
      pDraw: pDraw / total,
      pAway: pAway / total,
      xgHome: la,
      xgAway: lb,
    };
  }

  /** Clear the cached projection (e.g. after a data refresh). */
  invalidate(): void {
    this.cache = null;
  }
}

// ---- Pure helpers ----------------------------------------------------------

let cachedIndex: Map<string, WcRatedTeam> | null = null;
function teamIndex(): Map<string, WcRatedTeam> {
  if (!cachedIndex) {
    cachedIndex = new Map(worldCupTeams().map((t) => [t.id, t]));
  }
  return cachedIndex;
}

function byIdOrThrow(id: string): WcRatedTeam {
  const t = teamIndex().get(id);
  if (!t) throw new Error(`Unknown World Cup team: ${id}`);
  return t;
}

/** Transparent composite strength: higher attack and stingier defense both help. */
function power(t: { attack: number; defense: number }): number {
  return t.attack + t.defense;
}

/** Poisson pmf for k = 0..MAX_GOALS. */
function poissonPmf(lambda: number): number[] {
  const out: number[] = [];
  const base = Math.exp(-lambda);
  let term = base;
  for (let k = 0; k <= MAX_GOALS; k++) {
    out.push(term);
    term = (term * lambda) / (k + 1);
  }
  return out;
}

/**
 * Standard single-elimination seed order for a bracket of `size` (a power of
 * two): consecutive pairs are the matchups, and seeds 1 and 2 can only meet in
 * the final.
 */
export function bracketSeedOrder(size: number): number[] {
  let seeds = [1];
  while (seeds.length < size) {
    const round = seeds.length * 2;
    const next: number[] = [];
    for (const s of seeds) {
      next.push(s);
      next.push(round + 1 - s);
    }
    seeds = next;
  }
  return seeds;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
