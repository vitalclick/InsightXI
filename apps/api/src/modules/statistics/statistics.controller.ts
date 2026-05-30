import { Controller, Get, Param, Query } from "@nestjs/common";
import { StandingsService } from "./standings.service";

@Controller("statistics")
export class StatisticsController {
  constructor(private readonly standings: StandingsService) {}

  @Get("standings/:leagueId")
  table(
    @Param("leagueId") leagueId: string,
    @Query("season") season?: string,
  ) {
    return this.standings.table(leagueId, season);
  }
}
