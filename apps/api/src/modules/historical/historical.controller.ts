import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { HistoricalService } from "./historical.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PremiumGuard } from "../auth/premium.guard";

@Controller("historical")
export class HistoricalController {
  constructor(private readonly historical: HistoricalService) {}

  /** Head-to-head summary (available to all users). */
  @Get("h2h")
  h2h(@Query("home") home: string, @Query("away") away: string) {
    return this.historical.h2hSummary(home, away);
  }

  /** Multi-season trends — Premium only. */
  @UseGuards(JwtAuthGuard, PremiumGuard)
  @Get("trends/:teamId")
  trends(@Param("teamId") teamId: string) {
    return this.historical.teamTrends(teamId);
  }
}
