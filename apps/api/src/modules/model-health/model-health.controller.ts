import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ModelHealthService } from "./model-health.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PremiumGuard } from "../auth/premium.guard";

class DriftBody {
  features!: number[][];
}

/** Model-health dashboard data — Premium only. */
@UseGuards(JwtAuthGuard, PremiumGuard)
@Controller("model-health")
export class ModelHealthController {
  constructor(private readonly health: ModelHealthService) {}

  @Get("evaluation")
  evaluation() {
    return this.health.evaluation();
  }

  @Post("drift")
  drift(@Body() body: DriftBody) {
    return this.health.drift(body.features ?? []);
  }
}
