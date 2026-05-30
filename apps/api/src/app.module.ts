import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthModule } from "./modules/health/health.module";
import { DataModule } from "./repositories/data.module";
import { LeaguesModule } from "./modules/leagues/leagues.module";
import { TeamsModule } from "./modules/teams/teams.module";
import { MatchesModule } from "./modules/matches/matches.module";
import { StatisticsModule } from "./modules/statistics/statistics.module";

/**
 * Root module. Feature modules from the InsightXI backend structure
 * (auth, matches, teams, players, analytics, predictions, statistics,
 * subscriptions, notifications) are registered here as they are built.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DataModule,
    HealthModule,
    // Phase 1 — Football Data Hub
    LeaguesModule,
    TeamsModule,
    MatchesModule,
    StatisticsModule,
  ],
})
export class AppModule {}
