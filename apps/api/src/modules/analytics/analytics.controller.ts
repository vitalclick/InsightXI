import { Controller, Get, Param } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { FootballRepository } from "../../repositories/football.repository";

@Controller("analytics")
export class AnalyticsController {
  constructor(
    private readonly analytics: AnalyticsService,
    private readonly repo: FootballRepository,
  ) {}

  /** Team ratings (Elo, strengths, form) for a whole league. */
  @Get("ratings/:leagueId")
  ratings(@Param("leagueId") leagueId: string) {
    return this.repo
      .getTeams(leagueId)
      .map((t) => this.analytics.ratingsForTeam(t.id))
      .sort((a, b) => b.elo - a.elo);
  }

  @Get("team/:teamId")
  team(@Param("teamId") teamId: string) {
    return this.analytics.ratingsForTeam(teamId);
  }
}
