import { Injectable, NotFoundException } from "@nestjs/common";
import { Match, Team } from "../../common/domain";
import { FootballRepository } from "../../repositories/football.repository";

export interface TeamProfile extends Team {
  recentForm: string[];
  played: number;
  goalsFor: number;
  goalsAgainst: number;
  avgXgFor: number;
  avgXgAgainst: number;
}

@Injectable()
export class TeamsService {
  constructor(private readonly repo: FootballRepository) {}

  list(leagueId?: string): Team[] {
    return this.repo.getTeams(leagueId);
  }

  profile(id: string): TeamProfile {
    const team = this.repo.getTeam(id);
    if (!team) throw new NotFoundException(`Team ${id} not found`);

    const finished = this.repo
      .getMatches({ teamId: id, status: "FINISHED" })
      .sort((a, b) => a.utcDate.localeCompare(b.utcDate));

    let goalsFor = 0;
    let goalsAgainst = 0;
    let xgFor = 0;
    let xgAgainst = 0;
    const form: string[] = [];

    for (const m of finished) {
      const isHome = m.homeTeamId === id;
      const gf = (isHome ? m.homeGoals : m.awayGoals) ?? 0;
      const ga = (isHome ? m.awayGoals : m.homeGoals) ?? 0;
      goalsFor += gf;
      goalsAgainst += ga;
      xgFor += (isHome ? m.homeXg : m.awayXg) ?? 0;
      xgAgainst += (isHome ? m.awayXg : m.homeXg) ?? 0;
      form.push(gf > ga ? "W" : gf < ga ? "L" : "D");
    }

    const played = finished.length || 1;
    return {
      ...team,
      recentForm: form.slice(-5).reverse(),
      played: finished.length,
      goalsFor,
      goalsAgainst,
      avgXgFor: round2(xgFor / played),
      avgXgAgainst: round2(xgAgainst / played),
    };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export type { Match };
