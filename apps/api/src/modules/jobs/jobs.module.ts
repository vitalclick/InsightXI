import { BullModule } from "@nestjs/bullmq";
import { DynamicModule, Logger, Module } from "@nestjs/common";
import { AnalyticsModule } from "../analytics/analytics.module";
import { IntelligenceProcessor } from "./intelligence.processor";
import { JobsService } from "./jobs.service";
import { INTELLIGENCE_QUEUE, parseRedisConnection } from "./jobs.constants";

/**
 * Background queue layer (BullMQ + Redis).
 *
 * Disabled by default so the API boots without Redis. Enable with
 * ENABLE_QUEUES=true (and a reachable REDIS_URL) to run ingestion and
 * retraining jobs.
 */
@Module({})
export class JobsModule {
  static register(): DynamicModule {
    if (process.env.ENABLE_QUEUES !== "true") {
      new Logger(JobsModule.name).log(
        "Queues disabled (set ENABLE_QUEUES=true to enable BullMQ jobs)",
      );
      return { module: JobsModule };
    }

    const connection = parseRedisConnection(
      process.env.REDIS_URL ?? "redis://localhost:6379",
    );

    return {
      module: JobsModule,
      imports: [
        BullModule.forRoot({ connection }),
        BullModule.registerQueue({ name: INTELLIGENCE_QUEUE }),
        AnalyticsModule,
      ],
      providers: [JobsService, IntelligenceProcessor],
      exports: [JobsService],
    };
  }
}
