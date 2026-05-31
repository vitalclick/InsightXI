import { Controller, Get, Param, Query, NotFoundException, BadRequestException } from "@nestjs/common";
import { TacticalService } from "./tactical.service";
import { FootballRepository } from "../../repositories/football.repository";

@Controller("tactical")
export class TacticalController {
  constructor(
    private readonly tactical: TacticalService,
    private readonly repo: FootballRepository,
  ) {}

  @Get("team/:teamId")
  team(@Param("teamId") teamId: string) {
    return this.tactical.profile(teamId);
  }

  /**
   * Tactical matchup for any two teams (no fixture required) — backs the
   * head-to-head comparison view. Unknown team ids surface as 404 via the
   * service's profile lookup.
   */
  @Get("matchup")
  matchup(@Query("home") home: string, @Query("away") away: string) {
    if (!home || !away) {
      throw new BadRequestException("home and away query params are required");
    }
    return this.tactical.matchup(home, away);
  }

  /** Tactical matchup for a fixture. */
  @Get("match/:matchId")
  match(@Param("matchId") matchId: string) {
    const m = this.repo.getMatch(matchId);
    if (!m) throw new NotFoundException(`Match ${matchId} not found`);
    return this.tactical.matchup(m.homeTeamId, m.awayTeamId);
  }
}
