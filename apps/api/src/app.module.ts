import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthModule } from "./modules/health/health.module";

/**
 * Root module. Feature modules from the InsightXI backend structure
 * (auth, matches, teams, players, analytics, predictions, statistics,
 * subscriptions, notifications) are registered here as they are built.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HealthModule,
  ],
})
export class AppModule {}
