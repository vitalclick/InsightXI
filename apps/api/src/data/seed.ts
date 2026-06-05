/**
 * Deterministic seed dataset for the Football Data Hub.
 *
 * Generates leagues, teams and a full double round-robin per season, with
 * results simulated from latent team strengths via a Poisson model. The same
 * dataset powers league tables (Phase 1), Elo/Poisson predictions (Phase 2),
 * and H2H/historical trends (Phase 4) — all offline and reproducible.
 *
 * Swap this for a live provider (API-Football) without touching services:
 * everything depends on the FootballDataProvider abstraction, not this file.
 */
import { KnockoutFixture, League, Match, Team } from "../common/domain";
import { hashSeed, mulberry32, samplePoisson } from "./rng";
import { buildWorldCupKnockout } from "./tournament";
import {
  WORLD_CUP_COUNTRY,
  WORLD_CUP_GROUPS,
  WcTeamSeed,
  worldCupLeagueId,
} from "./world-cup";

/** Fixed "now" so match status (SCHEDULED/FINISHED) is deterministic. */
export const REFERENCE_DATE = new Date("2026-05-30T00:00:00Z");

export const SEASONS = ["2023/24", "2024/25", "2025/26"] as const;
export const CURRENT_SEASON = "2025/26";

interface TeamSeed {
  id: string;
  name: string;
  shortName: string;
  /** Latent attacking and defensive quality (~goals scale). */
  attack: number;
  defense: number;
}

interface LeagueSeed {
  league: League;
  teams: TeamSeed[];
  /** ISO date of the first matchday for the 2023/24 season. */
  firstSeasonStart: string;
}

const LEAGUE_SEEDS: LeagueSeed[] = [
  {
    league: { id: "epl", name: "Premier Division", country: "England" },
    firstSeasonStart: "2023-08-12",
    teams: [
      { id: "ars", name: "Arsenal", shortName: "ARS", attack: 1.85, defense: 1.0 },
      { id: "mci", name: "Manchester City", shortName: "MCI", attack: 2.0, defense: 0.9 },
      { id: "liv", name: "Liverpool", shortName: "LIV", attack: 1.9, defense: 1.0 },
      { id: "tot", name: "Tottenham", shortName: "TOT", attack: 1.6, defense: 1.3 },
      { id: "new", name: "Newcastle", shortName: "NEW", attack: 1.5, defense: 1.2 },
      { id: "avl", name: "Aston Villa", shortName: "AVL", attack: 1.45, defense: 1.35 },
      { id: "eve", name: "Everton", shortName: "EVE", attack: 1.1, defense: 1.5 },
      { id: "bur", name: "Burnley", shortName: "BUR", attack: 0.95, defense: 1.75 },
    ],
  },
  {
    league: { id: "laliga", name: "La Liga Primera", country: "Spain" },
    firstSeasonStart: "2023-08-14",
    teams: [
      { id: "rma", name: "Real Madrid", shortName: "RMA", attack: 2.05, defense: 0.85 },
      { id: "fcb", name: "Barcelona", shortName: "FCB", attack: 1.95, defense: 1.05 },
      { id: "atm", name: "Atletico Madrid", shortName: "ATM", attack: 1.6, defense: 0.95 },
      { id: "sev", name: "Sevilla", shortName: "SEV", attack: 1.4, defense: 1.3 },
      { id: "rso", name: "Real Sociedad", shortName: "RSO", attack: 1.45, defense: 1.25 },
      { id: "bet", name: "Real Betis", shortName: "BET", attack: 1.35, defense: 1.4 },
      { id: "val", name: "Valencia", shortName: "VAL", attack: 1.15, defense: 1.45 },
      { id: "cad", name: "Cadiz", shortName: "CAD", attack: 0.9, defense: 1.7 },
    ],
  },
];

const HOME_ADVANTAGE = 0.35; // extra expected goals for the home side
const MAX_GOALS_CLAMP = 7;

/** Circle-method round-robin schedule of [home, away] index pairs. */
function roundRobin(n: number): Array<Array<[number, number]>> {
  const ids = Array.from({ length: n }, (_, i) => i);
  const rounds: Array<Array<[number, number]>> = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs: Array<[number, number]> = [];
    for (let i = 0; i < n / 2; i++) {
      const home = ids[i];
      const away = ids[n - 1 - i];
      // Alternate home/away by round for balance.
      pairs.push(r % 2 === 0 ? [home, away] : [away, home]);
    }
    rounds.push(pairs);
    // Rotate all but the first element.
    ids.splice(1, 0, ids.pop() as number);
  }
  return rounds;
}

function simulateGoals(
  attack: number,
  oppDefense: number,
  rand: () => number,
): { goals: number; xg: number } {
  const lambda = Math.max(0.2, (attack / oppDefense) * 1.1);
  const goals = Math.min(samplePoisson(lambda, rand), MAX_GOALS_CLAMP);
  // xG: expected value nudged by a little deterministic noise.
  const xg = Math.max(0.1, lambda + (rand() - 0.5) * 0.6);
  return { goals, xg: Math.round(xg * 100) / 100 };
}

function buildSeason(
  leagueSeed: LeagueSeed,
  season: string,
  seasonIndex: number,
): Match[] {
  const { teams, league } = leagueSeed;
  const n = teams.length;
  const baseRounds = roundRobin(n);
  // Double round-robin: second half mirrors the first with venues swapped.
  const allRounds = [
    ...baseRounds,
    ...baseRounds.map((round) => round.map(([h, a]) => [a, h] as [number, number])),
  ];

  const start = new Date(leagueSeed.firstSeasonStart);
  start.setUTCFullYear(start.getUTCFullYear() + seasonIndex);

  const matches: Match[] = [];
  allRounds.forEach((round, roundIdx) => {
    const matchday = roundIdx + 1;
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + roundIdx * 24);

    round.forEach(([homeIdx, awayIdx], gameIdx) => {
      const home = teams[homeIdx];
      const away = teams[awayIdx];
      const id = `${league.id}-${season.replace("/", "")}-md${matchday}-g${gameIdx}`;
      const status = date < REFERENCE_DATE ? "FINISHED" : "SCHEDULED";

      let homeGoals: number | null = null;
      let awayGoals: number | null = null;
      let homeXg: number | null = null;
      let awayXg: number | null = null;

      if (status === "FINISHED") {
        const rand = mulberry32(hashSeed(id));
        const h = simulateGoals(home.attack + HOME_ADVANTAGE, away.defense, rand);
        const a = simulateGoals(away.attack, home.defense + HOME_ADVANTAGE, rand);
        homeGoals = h.goals;
        awayGoals = a.goals;
        homeXg = h.xg;
        awayXg = a.xg;
      }

      matches.push({
        id,
        leagueId: league.id,
        season,
        matchday,
        utcDate: date.toISOString(),
        status,
        homeTeamId: home.id,
        awayTeamId: away.id,
        homeGoals,
        awayGoals,
        homeXg,
        awayXg,
      });
    });
  });

  return matches;
}

/**
 * FIFA World Cup 2026 — the launch tournament.
 *
 * Each of the 12 groups is modelled as its own competition so the standings,
 * fixtures, ratings and prediction surfaces all work unchanged. Two layers:
 *
 *  1. Pre-tournament FORM — the prior `SEASONS` (2023/24, 2024/25) are played
 *     out as finished warm-up/qualifying results, simulated from each nation's
 *     hand-tuned ratings. These give the Intelligence Engine real signal (Elo,
 *     form, attack/defense strength, H2H) before a ball is kicked.
 *  2. The GROUP STAGE — the actual June 2026 fixtures, in `CURRENT_SEASON`,
 *     left SCHEDULED so the engine PREDICTS them. A single round-robin (each
 *     nation plays the other three once), as at a real World Cup.
 *
 * Group standings (which query `CURRENT_SEASON`) therefore start empty and
 * fill as the tournament is played — the form sits in earlier seasons and
 * never pollutes the group table.
 */
/** Kick-off of the group stage. The opener is 5 days out from launch. */
const WORLD_CUP_KICKOFF = "2026-06-11";

/** Scheduled group-stage fixtures: single round-robin, neutral venues, no result yet. */
function buildGroupStage(
  league: League,
  teams: WcTeamSeed[],
  groupIndex: number,
): Match[] {
  const rounds = roundRobin(teams.length);
  const base = new Date(WORLD_CUP_KICKOFF);
  const matches: Match[] = [];

  rounds.forEach((round, roundIdx) => {
    const matchday = roundIdx + 1;
    // Spread matchdays across the June 11–27 group window; offset groups by a
    // day so fixtures don't all stack on the same kickoff.
    const dayOffset = roundIdx * 5 + (groupIndex % 5);

    round.forEach(([homeIdx, awayIdx], gameIdx) => {
      const date = new Date(base);
      date.setUTCDate(date.getUTCDate() + dayOffset);
      // Two kickoff slots per group matchday.
      date.setUTCHours(16 + gameIdx * 3, 0, 0, 0);

      const home = teams[homeIdx];
      const away = teams[awayIdx];
      matches.push({
        id: `${league.id}-${CURRENT_SEASON.replace("/", "")}-md${matchday}-g${gameIdx}`,
        leagueId: league.id,
        season: CURRENT_SEASON,
        matchday,
        utcDate: date.toISOString(),
        status: "SCHEDULED",
        homeTeamId: home.id,
        awayTeamId: away.id,
        homeGoals: null,
        awayGoals: null,
        homeXg: null,
        awayXg: null,
      });
    });
  });

  return matches;
}

function buildWorldCup(): { leagues: League[]; teams: Team[]; matches: Match[] } {
  const leagues: League[] = [];
  const teams: Team[] = [];
  const matches: Match[] = [];

  WORLD_CUP_GROUPS.forEach((group, groupIndex) => {
    const league: League = {
      id: worldCupLeagueId(group.code),
      name: `FIFA World Cup 2026 — Group ${group.code}`,
      country: WORLD_CUP_COUNTRY,
    };
    leagues.push(league);

    for (const t of group.teams) {
      teams.push({
        id: t.id,
        name: t.name,
        shortName: t.shortName,
        leagueId: league.id,
      });
    }

    // Pre-tournament form: play out the earlier seasons (everything before
    // CURRENT_SEASON) as finished results so the engine has history.
    const formSeed: LeagueSeed = {
      league,
      teams: group.teams,
      // Earlier than REFERENCE_DATE so these resolve to FINISHED.
      firstSeasonStart: "2023-09-01",
    };
    SEASONS.slice(0, -1).forEach((season, idx) => {
      matches.push(...buildSeason(formSeed, season, idx));
    });

    // The actual group stage (scheduled, predicted).
    matches.push(...buildGroupStage(league, group.teams, groupIndex));
  });

  return { leagues, teams, matches };
}

export interface SeedData {
  leagues: League[];
  teams: Team[];
  matches: Match[];
  knockoutFixtures: KnockoutFixture[];
}

let cached: SeedData | null = null;

export function buildSeedData(): SeedData {
  if (cached) return cached;

  const leagues: League[] = [];
  const teams: Team[] = [];
  const matches: Match[] = [];

  for (const seed of LEAGUE_SEEDS) {
    leagues.push(seed.league);
    for (const t of seed.teams) {
      teams.push({
        id: t.id,
        name: t.name,
        shortName: t.shortName,
        leagueId: seed.league.id,
      });
    }
    SEASONS.forEach((season, idx) => {
      matches.push(...buildSeason(seed, season, idx));
    });
  }

  // FIFA World Cup 2026 — the launch tournament.
  const worldCup = buildWorldCup();
  leagues.push(...worldCup.leagues);
  teams.push(...worldCup.teams);
  matches.push(...worldCup.matches);

  cached = { leagues, teams, matches, knockoutFixtures: buildWorldCupKnockout() };
  return cached;
}
