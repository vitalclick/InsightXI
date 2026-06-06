import { Injectable, NotFoundException } from "@nestjs/common";
import { Match } from "../../common/domain";
import { FootballRepository } from "../../repositories/football.repository";
import { CURRENT_SEASON } from "../../data/seed";
import { WORLD_CUP_TOURNAMENT_ID } from "../../data/tournament";
import { BracketTie, TournamentService } from "../tournament/tournament.service";

export interface MatchView extends Match {
  homeTeamName: string;
  awayTeamName: string;
}

@Injectable()
export class MatchesService {
  constructor(
    private readonly repo: FootballRepository,
    private readonly tournament: TournamentService,
  ) {}

  private decorate(m: Match): MatchView {
    return {
      ...m,
      homeTeamName: this.repo.teamName(m.homeTeamId),
      awayTeamName: this.repo.teamName(m.awayTeamId),
    };
  }

  /**
   * Present a resolved knockout tie as a MatchView so the standard match-intel
   * surfaces (prediction, tactical, etc.) work for bracket ties unchanged.
   */
  private tieToView(tie: BracketTie): MatchView | null {
    if (!tie.home || !tie.away) return null;
    return {
      id: tie.id,
      leagueId: WORLD_CUP_TOURNAMENT_ID,
      season: tie.round, // e.g. "Round of 16" — shown in the match header
      matchday: Number(tie.id.split("-").pop()) || 0,
      utcDate: tie.utcDate,
      status: "SCHEDULED",
      homeTeamId: tie.home.teamId,
      awayTeamId: tie.away.teamId,
      homeGoals: null,
      awayGoals: null,
      homeXg: tie.expectedGoals.home,
      awayXg: tie.expectedGoals.away,
      homeTeamName: tie.home.name,
      awayTeamName: tie.away.name,
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
    if (match) return this.decorate(match);
    // Fall back to a projected World Cup knockout tie.
    const tie = this.tournament.resolvedTie(id);
    const view = tie && this.tieToView(tie);
    if (view) return view;
    throw new NotFoundException(`Match ${id} not found`);
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
