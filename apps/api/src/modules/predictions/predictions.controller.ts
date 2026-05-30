import { Controller, Get, Param } from "@nestjs/common";
import { PredictionsService } from "./predictions.service";

@Controller("predictions")
export class PredictionsController {
  constructor(private readonly predictions: PredictionsService) {}

  @Get("match/:id")
  forMatch(@Param("id") id: string) {
    return this.predictions.forMatch(id);
  }
}
