import { Module } from "@nestjs/common";
import { AnalyticsModule } from "../analytics/analytics.module";
import { LiveService } from "./live.service";
import { LiveGateway } from "./live.gateway";

@Module({
  imports: [AnalyticsModule],
  providers: [LiveService, LiveGateway],
  exports: [LiveService],
})
export class LiveModule {}
