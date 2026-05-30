import { Injectable } from "@nestjs/common";
import { Match } from "../../common/domain";
import { FootballRepository } from "../../repositories/football.repository";

export interface TeamRatings {
  teamId: string;
  name: string;
  elo: number;
  attackStrength: number;
  defenseStrength: number;
  recentFormPoints: number;
  avgXgFor: number;
  avgXgAgainst: number;
}

const ELO_START = 1500;
const ELO_K = 24;
const ELO_HOME_ADV = 65;

/**
 * Derives the model features the Intelligence Engine consumes: Elo ratings
 * (updated chronologically over finished matches), attack/defense strengths
 * relative to league average, recent form and recent xG.
 *
 * Ratings are cached after the first computation (data is static seed data).
 */
@Injectable()
export class AnalyticsService {
  constructor(private readonly repo: FootballRepository) {}

  private eloCache: Map<string, number> | null = null;

  /** Elo ratings across all leagues, learned from finished matches in date order. */
  eloRatings(): Map<string, number> {
    if (this.eloCache) return this.eloCache;

    const elo = new Map<string, number>();
    for (const t of this.repo.getTeams()) elo.set(t.id, ELO_START);

    const finished = this.repo
      .getMatches({ status: "FINISHED" })
      .sort((a, b) => a.utcDate.localeCompare(b.utcDate));

    for (const m of finished) {
      if (m.homeGoals === null || m.awayGoals === null) continue;
      const rh = elo.get(m.homeTeamId) ?? ELO_START;
      const ra = elo.get(m.awayTeamId) ?? ELO_START;
      const expHome = 1 / (1 + 10 ** ((ra - rh - ELO_HOME_ADV) / 400));
      const scoreHome =
        m.homeGoals > m.awayGoals ? 1 : m.homeGoals === m.awayGoals ? 0.5 : 0;
      elo.set(m.homeTeamId, rh + ELO_K * (scoreHome - expHome));
      elo.set(m.awayTeamId, ra + ELO_K * (1 - scoreHome - (1 - expHome)));
    }

    this.eloCache = elo;
    return elo;
  }

  /** Average goals per team per match for a league (the Poisson baseline). */
  leagueAvgGoals(leagueId: string): number {
    const finished = this.repo.getMatches({ leagueId, status: "FINISHED" });
    if (finished.length === 0) return 1.4;
    let total = 0;
    for (const m of finished) total += (m.homeGoals ?? 0) + (m.awayGoals ?? 0);
    return total / (finished.length * 2);
  }

  ratingsForTeam(teamId: string): TeamRatings {
    const team = this.repo.getTeam(teamId);
    const leagueId = team?.leagueId;
    const leagueAvg = leagueId ? this.leagueAvgGoals(leagueId) : 1.4;

    const finished = this.repo
      .getMatches({ teamId, status: "FINISHED" })
      .sort((a, b) => a.utcDate.localeCompare(b.utcDate));

    let gf = 0;
    let ga = 0;
    const recent = finished.slice(-6);
    let xgFor = 0;
    let xgAgainst = 0;
    for (const m of recent) {
      const home = m.homeTeamId === teamId;
      xgFor += (home ? m.homeXg : m.awayXg) ?? 0;
      xgAgainst += (home ? m.awayXg : m.homeXg) ?? 0;
    }
    for (const m of finished) {
      const home = m.homeTeamId === teamId;
      gf += (home ? m.homeGoals : m.awayGoals) ?? 0;
      ga += (home ? m.awayGoals : m.homeGoals) ?? 0;
    }

    const games = finished.length || 1;
    const recentGames = recent.length || 1;
    const formPoints = this.formPoints(teamId, finished.slice(-5));

    return {
      teamId,
      name: team?.name ?? teamId,
      elo: Math.round((this.eloRatings().get(teamId) ?? ELO_START) * 10) / 10,
      // Strengths relative to league average (1.0 = average).
      attackStrength: round2(gf / games / (leagueAvg || 1.4)),
      defenseStrength: round2(ga / games / (leagueAvg || 1.4)),
      recentFormPoints: formPoints,
      avgXgFor: round2(xgFor / recentGames),
      avgXgAgainst: round2(xgAgainst / recentGames),
    };
  }

  private formPoints(teamId: string, matches: Match[]): number {
    let pts = 0;
    for (const m of matches) {
      const home = m.homeTeamId === teamId;
      const gf = (home ? m.homeGoals : m.awayGoals) ?? 0;
      const ga = (home ? m.awayGoals : m.homeGoals) ?? 0;
      pts += gf > ga ? 3 : gf === ga ? 1 : 0;
    }
    return pts;
  }

  /** Reset cached ratings (e.g. after data refresh / retraining job). */
  invalidate(): void {
    this.eloCache = null;
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
