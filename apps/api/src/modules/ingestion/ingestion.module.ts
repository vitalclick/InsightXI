import { Global, Module } from "@nestjs/common";
import { IngestionController } from "./ingestion.controller";
import { IngestionService } from "./ingestion.service";

/**
 * Ingestion is global so the BullMQ processor (Phase 3 jobs) can reuse the
 * same service as the admin endpoint. Its dependencies (provider, PgService,
 * repository) are all provided by global modules.
 */
@Global()
@Module({
  controllers: [IngestionController],
  providers: [IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}
