import { Injectable } from "@nestjs/common";
import {
  BracketSlot,
  KnockoutFixture,
  Match,
  TournamentStage,
} from "../../common/domain";
import { FootballRepository } from "../../repositories/football.repository";
import { CURRENT_SEASON } from "../../data/seed";
import { WORLD_CUP_TOURNAMENT_ID } from "../../data/tournament";
import {
  WcRatedTeam,
  WORLD_CUP_GROUPS,
  worldCupLeagueId,
  worldCupTeams,
} from "../../data/world-cup";

/**
 * FIFA World Cup 2026 — structural tournament engine.
 *
 * Resolves the persisted knockout bracket template (a tree of slot references)
 * into a concrete, projected bracket:
 *
 *   1. Build each group's table from its CURRENT_SEASON fixtures — actual
 *      points where a match has been played, projected expected points (a
 *      global Poisson model over the national priors) where it hasn't. So the
 *      same code yields a pure projection now and a real table once results
 *      arrive.
 *   2. Rank the third-placed teams; the best eight qualify.
 *   3. Walk the knockout template stage by stage, resolving each slot from the
 *      group standings or an earlier tie's winner/loser, and projecting each
 *      tie (draws resolved by a strength-weighted extra-time/penalties split).
 *
 * The bracket is a transparent probabilistic projection, never a guaranteed
 * result.
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
  seed: number;
  source: string;
}

export interface BracketTie {
  id: string;
  round: string;
  stage: TournamentStage;
  utcDate: string;
  home: BracketTeam | null;
  away: BracketTeam | null;
  homeAdvance: number;
  awayAdvance: number;
  expectedGoals: { home: number; away: number };
  winnerId: string | null;
  note: string;
}

export interface BracketRound {
  name: string;
  stage: TournamentStage;
  ties: BracketTie[];
}

export interface TournamentBracket {
  groups: ProjectedGroup[];
  thirdPlaceRanking: ProjectedStanding[];
  qualifiers: BracketTeam[];
  rounds: BracketRound[];
  thirdPlacePlayoff: BracketTie | null;
  champion: BracketTeam | null;
  model: string;
  disclaimer: string;
}

const NEUTRAL_SCALE = 1.05;
const MAX_GOALS = 8;

const STAGE_ORDER: Record<TournamentStage, number> = {
  GROUP: 0,
  R32: 1,
  R16: 2,
  QF: 3,
  SF: 4,
  THIRD_PLACE: 5,
  FINAL: 6,
};

const ROUND_NAMES: Record<string, string> = {
  R32: "Round of 32",
  R16: "Round of 16",
  QF: "Quarter-finals",
  SF: "Semi-finals",
  FINAL: "Final",
};

/** Stages that form the main bracket tree, in order (third place is separate). */
const BRACKET_STAGES: TournamentStage[] = ["R32", "R16", "QF", "SF", "FINAL"];

@Injectable()
export class TournamentService {
  constructor(private readonly repo: FootballRepository) {}

  private cache: TournamentBracket | null = null;

  bracket(): TournamentBracket {
    if (this.cache) return this.cache;

    const groups = this.projectGroups();
    const thirds = this.rankThirds(groups);
    const standby = this.standingIndex(groups, thirds);
    const qualifiers = this.seedQualifiers(groups, thirds);
    const sourceById = new Map(qualifiers.map((q) => [q.teamId, q.source]));
    const seedById = new Map(qualifiers.map((q) => [q.teamId, q.seed]));

    const { ties, champion, thirdPlacePlayoff } = this.resolveKnockouts(
      standby,
      sourceById,
      seedById,
    );

    const rounds: BracketRound[] = BRACKET_STAGES.map((stage) => ({
      name: ROUND_NAMES[stage],
      stage,
      ties: ties.filter((t) => t.stage === stage),
    })).filter((r) => r.ties.length > 0);

    this.cache = {
      groups,
      thirdPlaceRanking: thirds,
      qualifiers,
      rounds,
      thirdPlacePlayoff,
      champion,
      model:
        "Structural bracket resolved from group standings (actual points where " +
        "played, projected expected points otherwise) via a global Poisson " +
        "model over national-team priors; knockout draws split by relative strength.",
      disclaimer:
        "Projection only — a probabilistic read of how the tournament could " +
        "unfold, not a prediction of results or a betting guarantee.",
    };
    return this.cache;
  }

  /** Clear the cached projection (e.g. after a data refresh / new results). */
  invalidate(): void {
    this.cache = null;
  }

  // ---- Group stage ---------------------------------------------------------

  private projectGroups(): ProjectedGroup[] {
    return WORLD_CUP_GROUPS.map((group) => {
      const leagueId = worldCupLeagueId(group.code);
      const teams = this.repo.getTeams(leagueId);
      const matches = this.repo.getMatches({ leagueId, season: CURRENT_SEASON });

      const xPoints = new Map<string, number>();
      const xGoalDiff = new Map<string, number>();
      for (const t of teams) {
        xPoints.set(t.id, 0);
        xGoalDiff.set(t.id, 0);
      }

      for (const m of matches) {
        const { homePts, awayPts, homeGd, awayGd } = this.matchPoints(m);
        xPoints.set(m.homeTeamId, (xPoints.get(m.homeTeamId) ?? 0) + homePts);
        xPoints.set(m.awayTeamId, (xPoints.get(m.awayTeamId) ?? 0) + awayPts);
        xGoalDiff.set(m.homeTeamId, (xGoalDiff.get(m.homeTeamId) ?? 0) + homeGd);
        xGoalDiff.set(m.awayTeamId, (xGoalDiff.get(m.awayTeamId) ?? 0) + awayGd);
      }

      const ranked = [...teams].sort(
        (a, b) =>
          (xPoints.get(b.id) ?? 0) - (xPoints.get(a.id) ?? 0) ||
          (xGoalDiff.get(b.id) ?? 0) - (xGoalDiff.get(a.id) ?? 0) ||
          power(b.id) - power(a.id) ||
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
        shortName: teamIndex().get(t.id)?.shortName ?? t.shortName,
        group: group.code,
        position: idx + 1,
        expectedPoints: round2(xPoints.get(t.id) ?? 0),
        expectedGoalDiff: round2(xGoalDiff.get(t.id) ?? 0),
        finish: finishes[idx] ?? "eliminated",
        qualified: idx < 2,
      }));

      return { code: group.code, leagueId, table };
    });
  }

  /** Points + goal-diff contribution from one match: actual if played, else projected. */
  private matchPoints(m: Match): {
    homePts: number;
    awayPts: number;
    homeGd: number;
    awayGd: number;
  } {
    if (m.status === "FINISHED" && m.homeGoals !== null && m.awayGoals !== null) {
      const hg = m.homeGoals;
      const ag = m.awayGoals;
      return {
        homePts: hg > ag ? 3 : hg === ag ? 1 : 0,
        awayPts: ag > hg ? 3 : hg === ag ? 1 : 0,
        homeGd: hg - ag,
        awayGd: ag - hg,
      };
    }
    const o = this.matchOutcome(m.homeTeamId, m.awayTeamId);
    return {
      homePts: 3 * o.pHome + o.pDraw,
      awayPts: 3 * o.pAway + o.pDraw,
      homeGd: o.xgHome - o.xgAway,
      awayGd: o.xgAway - o.xgHome,
    };
  }

  /** Rank the 12 third-placed sides; the best eight advance (thirdRank 1..8). */
  private rankThirds(groups: ProjectedGroup[]): ProjectedStanding[] {
    const thirds = groups
      .map((g) => g.table.find((r) => r.finish === "third"))
      .filter((r): r is ProjectedStanding => Boolean(r));

    return [...thirds]
      .sort(
        (a, b) =>
          b.expectedPoints - a.expectedPoints ||
          b.expectedGoalDiff - a.expectedGoalDiff ||
          a.name.localeCompare(b.name),
      )
      .map((r, idx) => ({ ...r, qualified: idx < 8 }));
  }

  // ---- Slot resolution -----------------------------------------------------

  /** Lookups for resolving group-position slots → teamId. */
  private standingIndex(
    groups: ProjectedGroup[],
    thirds: ProjectedStanding[],
  ): { winner: Map<string, string>; runnerUp: Map<string, string>; third: Map<number, string> } {
    const winner = new Map<string, string>();
    const runnerUp = new Map<string, string>();
    for (const g of groups) {
      winner.set(g.code, g.table[0]?.teamId);
      runnerUp.set(g.code, g.table[1]?.teamId);
    }
    const third = new Map<number, string>();
    thirds.filter((t) => t.qualified).forEach((t, idx) => third.set(idx + 1, t.teamId));
    return { winner, runnerUp, third };
  }

  private seedQualifiers(
    groups: ProjectedGroup[],
    thirds: ProjectedStanding[],
  ): BracketTeam[] {
    const byPoints = (a: ProjectedStanding, b: ProjectedStanding) =>
      b.expectedPoints - a.expectedPoints ||
      b.expectedGoalDiff - a.expectedGoalDiff ||
      a.name.localeCompare(b.name);

    const winners = groups
      .map((g) => g.table[0])
      .sort(byPoints)
      .map((r) => toQualifier(r, `Winner Group ${r.group}`));
    const runners = groups
      .map((g) => g.table[1])
      .sort(byPoints)
      .map((r) => toQualifier(r, `Runner-up Group ${r.group}`));
    const qualThirds = thirds
      .filter((t) => t.qualified)
      .map((r) => toQualifier(r, `3rd place (Group ${r.group})`));

    // Seed by finishing tier then record: winners 1-12, runners 13-24, thirds 25-32.
    return [...winners, ...runners, ...qualThirds].map((q, idx) => ({
      ...q,
      seed: idx + 1,
    }));
  }

  private resolveKnockouts(
    standby: ReturnType<TournamentService["standingIndex"]>,
    sourceById: Map<string, string>,
    seedById: Map<string, number>,
  ): {
    ties: BracketTie[];
    champion: BracketTeam | null;
    thirdPlacePlayoff: BracketTie | null;
  } {
    const fixtures = [...this.repo.getKnockoutFixtures(WORLD_CUP_TOURNAMENT_ID)].sort(
      (a, b) => STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage] || a.order - b.order,
    );

    const winnerOf = new Map<string, string>();
    const loserOf = new Map<string, string>();
    const ties: BracketTie[] = [];
    let thirdPlacePlayoff: BracketTie | null = null;
    let champion: BracketTeam | null = null;

    const toTeam = (teamId: string | null): BracketTeam | null => {
      if (!teamId) return null;
      const meta = teamIndex().get(teamId);
      return {
        teamId,
        name: meta?.name ?? teamId,
        shortName: meta?.shortName ?? teamId,
        group: meta?.group ?? "",
        seed: seedById.get(teamId) ?? 0,
        source: sourceById.get(teamId) ?? "",
      };
    };

    for (const fx of fixtures) {
      const homeId = this.resolveSlot(fx.home, standby, winnerOf, loserOf);
      const awayId = this.resolveSlot(fx.away, standby, winnerOf, loserOf);
      const tie = this.projectKnockoutTie(fx, toTeam(homeId), toTeam(awayId));

      if (tie.winnerId) {
        winnerOf.set(fx.id, tie.winnerId);
        const loser =
          tie.winnerId === homeId ? awayId : tie.winnerId === awayId ? homeId : null;
        if (loser) loserOf.set(fx.id, loser);
      }

      if (fx.stage === "THIRD_PLACE") {
        thirdPlacePlayoff = tie;
      } else {
        ties.push(tie);
        if (fx.stage === "FINAL" && tie.winnerId) champion = toTeam(tie.winnerId);
      }
    }

    return { ties, champion, thirdPlacePlayoff };
  }

  private resolveSlot(
    slot: BracketSlot,
    standby: ReturnType<TournamentService["standingIndex"]>,
    winnerOf: Map<string, string>,
    loserOf: Map<string, string>,
  ): string | null {
    switch (slot.kind) {
      case "GROUP_WINNER":
        return (slot.group && standby.winner.get(slot.group)) || null;
      case "GROUP_RUNNER_UP":
        return (slot.group && standby.runnerUp.get(slot.group)) || null;
      case "THIRD_PLACE":
        return (slot.thirdRank && standby.third.get(slot.thirdRank)) || null;
      case "MATCH_WINNER":
        return (slot.sourceMatchId && winnerOf.get(slot.sourceMatchId)) || null;
      case "MATCH_LOSER":
        return (slot.sourceMatchId && loserOf.get(slot.sourceMatchId)) || null;
      default:
        return null;
    }
  }

  private projectKnockoutTie(
    fx: KnockoutFixture,
    home: BracketTeam | null,
    away: BracketTeam | null,
  ): BracketTie {
    const base: Omit<BracketTie, "homeAdvance" | "awayAdvance" | "expectedGoals" | "winnerId" | "note"> = {
      id: fx.id,
      round: ROUND_NAMES[fx.stage] ?? fx.stage,
      stage: fx.stage,
      utcDate: fx.utcDate,
      home,
      away,
    };

    if (!home || !away) {
      return {
        ...base,
        homeAdvance: 0,
        awayAdvance: 0,
        expectedGoals: { home: 0, away: 0 },
        winnerId: null,
        note: "Awaiting both sides.",
      };
    }

    // Use a recorded result if one exists; otherwise project.
    if (fx.homeGoals !== null && fx.awayGoals !== null) {
      const homeWon = fx.homeGoals >= fx.awayGoals;
      return {
        ...base,
        homeAdvance: homeWon ? 1 : 0,
        awayAdvance: homeWon ? 0 : 1,
        expectedGoals: { home: fx.homeGoals, away: fx.awayGoals },
        winnerId: homeWon ? home.teamId : away.teamId,
        note: `${homeWon ? home.name : away.name} won ${fx.homeGoals}–${fx.awayGoals}.`,
      };
    }

    const o = this.matchOutcome(home.teamId, away.teamId);
    const decisive = o.pHome + o.pAway || 1;
    const homeAdvance = o.pHome + o.pDraw * (o.pHome / decisive);
    const awayAdvance = 1 - homeAdvance;
    const favourite = homeAdvance >= awayAdvance ? home : away;
    const edge = Math.round(Math.abs(homeAdvance - awayAdvance) * 100);
    const topPct = Math.round(Math.max(homeAdvance, awayAdvance) * 100);

    return {
      ...base,
      homeAdvance: round3(homeAdvance),
      awayAdvance: round3(awayAdvance),
      expectedGoals: { home: round2(o.xgHome), away: round2(o.xgAway) },
      winnerId: homeAdvance >= awayAdvance ? home.teamId : away.teamId,
      note:
        edge <= 8
          ? `${favourite.name} edge a coin-flip tie (${topPct}%).`
          : `${favourite.name} projected through (${topPct}%).`,
    };
  }

  // ---- Match model ---------------------------------------------------------

  /** Neutral-venue Poisson outcome for two teams (by id), from national priors. */
  private matchOutcome(homeId: string, awayId: string) {
    const a = teamIndex().get(homeId);
    const b = teamIndex().get(awayId);
    const la = clamp(((a?.attack ?? 1) / (b?.defense ?? 1)) * NEUTRAL_SCALE, 0.15, 5);
    const lb = clamp(((b?.attack ?? 1) / (a?.defense ?? 1)) * NEUTRAL_SCALE, 0.15, 5);

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
}

// ---- Pure helpers ----------------------------------------------------------

let cachedIndex: Map<string, WcRatedTeam> | null = null;
function teamIndex(): Map<string, WcRatedTeam> {
  if (!cachedIndex) cachedIndex = new Map(worldCupTeams().map((t) => [t.id, t]));
  return cachedIndex;
}

function toQualifier(r: ProjectedStanding, source: string): BracketTeam {
  return {
    teamId: r.teamId,
    name: r.name,
    shortName: r.shortName,
    group: r.group,
    seed: 0,
    source,
  };
}

/** Transparent composite strength from priors: higher attack + stingier defense. */
function power(teamId: string): number {
  const t = teamIndex().get(teamId);
  return t ? t.attack + t.defense : 0;
}

function poissonPmf(lambda: number): number[] {
  const out: number[] = [];
  let term = Math.exp(-lambda);
  for (let k = 0; k <= MAX_GOALS; k++) {
    out.push(term);
    term = (term * lambda) / (k + 1);
  }
  return out;
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
