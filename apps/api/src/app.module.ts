import { Module } from "@nestjs/common";
import { join } from "path";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { RateLimitGuard } from "./common/security/rate-limit.guard";
import { AllExceptionsFilter } from "./common/observability/all-exceptions.filter";
import { ErrorReporter } from "./common/observability/error-reporter";
import { EmailModule } from "./modules/email/email.module";
import { HealthModule } from "./modules/health/health.module";
import { DataModule } from "./repositories/data.module";
import { LeaguesModule } from "./modules/leagues/leagues.module";
import { TeamsModule } from "./modules/teams/teams.module";
import { MatchesModule } from "./modules/matches/matches.module";
import { StatisticsModule } from "./modules/statistics/statistics.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { PredictionsModule } from "./modules/predictions/predictions.module";
import { TacticalModule } from "./modules/tactical/tactical.module";
import { LiveModule } from "./modules/live/live.module";
import { JobsModule } from "./modules/jobs/jobs.module";
import { AuthModule } from "./modules/auth/auth.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { HistoricalModule } from "./modules/historical/historical.module";
import { IngestionModule } from "./modules/ingestion/ingestion.module";
import { ModelHealthModule } from "./modules/model-health/model-health.module";

/**
 * Root module. Feature modules from the InsightXI backend structure
 * (auth, matches, teams, players, analytics, predictions, statistics,
 * subscriptions, notifications) are registered here as they are built.
 */
@Module({
  imports: [
    // Load the repo-root .env (the documented `cp .env.example .env` lives at
    // the workspace root) as well as a local apps/api/.env, regardless of the
    // process CWD. Real environment variables (Railway/Vercel) take precedence.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        ".env",
        join(process.cwd(), "../../.env"),
        join(__dirname, "..", "..", "..", ".env"),
      ],
    }),
    DataModule,
    EmailModule,
    HealthModule,
    // Phase 1 — Football Data Hub
    LeaguesModule,
    TeamsModule,
    MatchesModule,
    StatisticsModule,
    // Phase 2 — Intelligence Engine
    AnalyticsModule,
    PredictionsModule,
    // Phase 3 — Real-Time & Tactical
    TacticalModule,
    LiveModule,
    IngestionModule,
    JobsModule.register(),
    // Phase 4 — Historical & Premium
    AuthModule,
    PaymentsModule,
    HistoricalModule,
    ModelHealthModule,
  ],
  providers: [
    // Global IP-based rate limiting (dependency-free fixed window). Runs ahead
    // of route guards; disable with RATE_LIMIT_ENABLED=false.
    { provide: APP_GUARD, useClass: RateLimitGuard },
    // Structured error envelope + 5xx forwarding (ERROR_WEBHOOK_URL).
    ErrorReporter,
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
