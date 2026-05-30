import { Injectable, NotFoundException } from "@nestjs/common";
import { Match } from "../../common/domain";
import { FootballRepository } from "../../repositories/football.repository";
import { CURRENT_SEASON } from "../../data/seed";

export interface MatchView extends Match {
  homeTeamName: string;
  awayTeamName: string;
}

@Injectable()
export class MatchesService {
  constructor(private readonly repo: FootballRepository) {}

  private decorate(m: Match): MatchView {
    return {
      ...m,
      homeTeamName: this.repo.teamName(m.homeTeamId),
      awayTeamName: this.repo.teamName(m.awayTeamId),
    };
  }

  /** Upcoming fixtures (scheduled), soonest first. */
  fixtures(leagueId?: string, limit = 20): MatchView[] {
    return this.repo
      .getMatches({ leagueId, status: "SCHEDULED" })
      .sort((a, b) => a.utcDate.localeCompare(b.utcDate))
      .slice(0, limit)
      .map((m) => this.decorate(m));
  }

  /** Recent results (finished), most recent first. */
  results(leagueId?: string, limit = 20): MatchView[] {
    return this.repo
      .getMatches({ leagueId, status: "FINISHED" })
      .sort((a, b) => b.utcDate.localeCompare(a.utcDate))
      .slice(0, limit)
      .map((m) => this.decorate(m));
  }

  byId(id: string): MatchView {
    const match = this.repo.getMatch(id);
    if (!match) throw new NotFoundException(`Match ${id} not found`);
    return this.decorate(match);
  }

  headToHead(teamA: string, teamB: string, limit = 10): MatchView[] {
    return this.repo
      .getHeadToHead(teamA, teamB)
      .slice(0, limit)
      .map((m) => this.decorate(m));
  }

  get currentSeason(): string {
    return CURRENT_SEASON;
  }
}
