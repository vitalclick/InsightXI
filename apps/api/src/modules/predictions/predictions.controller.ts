import { Controller, Get, Param, Query } from "@nestjs/common";
import { PredictionsService } from "./predictions.service";
import { DailyPickService } from "./daily-pick.service";

@Controller("predictions")
export class PredictionsController {
  constructor(
    private readonly predictions: PredictionsService,
    private readonly dailyPick: DailyPickService,
  ) {}

  /** The single highest-confidence locked Pick of the Day (or null if none). */
  @Get("daily-pick")
  daily() {
    return this.dailyPick.getToday();
  }

  /** Recent daily picks + aggregate track record. */
  @Get("daily-pick/history")
  dailyHistory(@Query("limit") limit?: string) {
    const n = Math.min(Math.max(Number(limit) || 30, 1), 100);
    return this.dailyPick.history(n);
  }

  @Get("match/:id")
  forMatch(@Param("id") id: string) {
    return this.predictions.forMatch(id);
  }
}
