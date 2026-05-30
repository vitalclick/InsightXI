import { Controller, Post, UseGuards } from "@nestjs/common";
import { IngestionService } from "./ingestion.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PremiumGuard } from "../auth/premium.guard";

@Controller("ingestion")
export class IngestionController {
  constructor(private readonly ingestion: IngestionService) {}

  /** Manually trigger a full provider -> Postgres ingest (admin/premium). */
  @UseGuards(JwtAuthGuard, PremiumGuard)
  @Post("run")
  run() {
    return this.ingestion.ingestAll();
  }
}
