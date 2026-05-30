import { Injectable, NotFoundException } from "@nestjs/common";
import { Match } from "../../common/domain";
import { FootballRepository } from "../../repositories/football.repository";
import { SEASONS } from "../../data/seed";

export interface H2HSummary {
  teamA: string;
  teamB: string;
  played: number;
  teamAWins: number;
  teamBWins: number;
  draws: number;
  avgGoalsPerGame: number;
  bttsRate: number;
}

export interface SeasonTrend {
  season: string;
  played: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  avgXgFor: number;
  avgXgAgainst: number;
}

@Injectable()
export class HistoricalService {
  constructor(private readonly repo: FootballRepository) {}

  h2hSummary(teamAId: string, teamBId: string): H2HSummary {
    const teamA = this.repo.getTeam(teamAId);
    const teamB = this.repo.getTeam(teamBId);
    if (!teamA || !teamB) throw new NotFoundException("Team not found");

    const matches = this.repo.getHeadToHead(teamAId, teamBId);
    let aWins = 0;
    let bWins = 0;
    let draws = 0;
    let goals = 0;
    let btts = 0;

    for (const m of matches) {
      const aHome = m.homeTeamId === teamAId;
      const aGoals = (aHome ? m.homeGoals : m.awayGoals) ?? 0;
      const bGoals = (aHome ? m.awayGoals : m.homeGoals) ?? 0;
      goals += aGoals + bGoals;
      if (aGoals > 0 && bGoals > 0) btts++;
      if (aGoals > bGoals) aWins++;
      else if (aGoals < bGoals) bWins++;
      else draws++;
    }

    const played = matches.length || 1;
    return {
      teamA: teamA.name,
      teamB: teamB.name,
      played: matches.length,
      teamAWins: aWins,
      teamBWins: bWins,
      draws,
      avgGoalsPerGame: round2(goals / played),
      bttsRate: round2(btts / played),
    };
  }

  /** Per-season performance trend for a team (premium analytics). */
  teamTrends(teamId: string): SeasonTrend[] {
    const team = this.repo.getTeam(teamId);
    if (!team) throw new NotFoundException(`Team ${teamId} not found`);

    return SEASONS.map((season) => {
      const matches = this.repo
        .getMatches({ teamId, season, status: "FINISHED" })
        .sort((a, b) => a.utcDate.localeCompare(b.utcDate));
      return this.seasonTrend(teamId, season, matches);
    });
  }

  private seasonTrend(
    teamId: string,
    season: string,
    matches: Match[],
  ): SeasonTrend {
    let points = 0;
    let gf = 0;
    let ga = 0;
    let xgFor = 0;
    let xgAgainst = 0;

    for (const m of matches) {
      const home = m.homeTeamId === teamId;
      const scored = (home ? m.homeGoals : m.awayGoals) ?? 0;
      const conceded = (home ? m.awayGoals : m.homeGoals) ?? 0;
      gf += scored;
      ga += conceded;
      xgFor += (home ? m.homeXg : m.awayXg) ?? 0;
      xgAgainst += (home ? m.awayXg : m.homeXg) ?? 0;
      points += scored > conceded ? 3 : scored === conceded ? 1 : 0;
    }

    const games = matches.length || 1;
    return {
      season,
      played: matches.length,
      points,
      goalsFor: gf,
      goalsAgainst: ga,
      goalDifference: gf - ga,
      avgXgFor: round2(xgFor / games),
      avgXgAgainst: round2(xgAgainst / games),
    };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
