import { Module } from "@nestjs/common";
import { AnalyticsModule } from "../analytics/analytics.module";
import { TacticalController } from "./tactical.controller";
import { TacticalService } from "./tactical.service";

@Module({
  imports: [AnalyticsModule],
  controllers: [TacticalController],
  providers: [TacticalService],
  exports: [TacticalService],
})
export class TacticalModule {}
