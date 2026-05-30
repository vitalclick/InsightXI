import { Module } from "@nestjs/common";
import { StatisticsController } from "./statistics.controller";
import { StandingsService } from "./standings.service";

@Module({
  controllers: [StatisticsController],
  providers: [StandingsService],
  exports: [StandingsService],
})
export class StatisticsModule {}
