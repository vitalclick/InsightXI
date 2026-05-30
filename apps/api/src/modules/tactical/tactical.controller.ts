import { Controller, Get, Param, NotFoundException } from "@nestjs/common";
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

  /** Tactical matchup for a fixture. */
  @Get("match/:matchId")
  match(@Param("matchId") matchId: string) {
    const m = this.repo.getMatch(matchId);
    if (!m) throw new NotFoundException(`Match ${matchId} not found`);
    return this.tactical.matchup(m.homeTeamId, m.awayTeamId);
  }
}
