import { Controller, Get, Param, Query } from "@nestjs/common";
import { MatchesService } from "./matches.service";

@Controller("matches")
export class MatchesController {
  constructor(private readonly matches: MatchesService) {}

  @Get("fixtures")
  fixtures(@Query("league") league?: string, @Query("limit") limit?: string) {
    return this.matches.fixtures(league, limit ? Number(limit) : undefined);
  }

  @Get("results")
  results(@Query("league") league?: string, @Query("limit") limit?: string) {
    return this.matches.results(league, limit ? Number(limit) : undefined);
  }

  @Get("h2h")
  headToHead(@Query("home") home: string, @Query("away") away: string) {
    return this.matches.headToHead(home, away);
  }

  @Get(":id")
  byId(@Param("id") id: string) {
    return this.matches.byId(id);
  }
}
