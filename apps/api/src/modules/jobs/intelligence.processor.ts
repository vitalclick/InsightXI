import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { AnalyticsService } from "../analytics/analytics.service";
import { IngestionService } from "../ingestion/ingestion.service";
import {
  INTELLIGENCE_QUEUE,
  JOB_REFRESH_DATA,
  JOB_RETRAIN_MODELS,
} from "./jobs.constants";

/**
 * Processes background intelligence jobs:
 *  - refresh-data:    re-ingest from the football data provider
 *  - retrain-models:  trigger AI model retraining
 *
 * In production these fan out to the ingestion pipeline and the AI service's
 * training entrypoint. Here they refresh derived caches and log, keeping the
 * queue wiring real and exercisable.
 */
@Processor(INTELLIGENCE_QUEUE)
export class IntelligenceProcessor extends WorkerHost {
  private readonly logger = new Logger(IntelligenceProcessor.name);

  constructor(
    private readonly analytics: AnalyticsService,
    private readonly ingestion: IngestionService,
  ) {
    super();
  }

  async process(job: Job): Promise<{ ok: boolean }> {
    switch (job.name) {
      case JOB_REFRESH_DATA:
        this.logger.log("Refreshing football data from provider…");
        await this.ingestion.ingestAll();
        this.analytics.invalidate();
        return { ok: true };
      case JOB_RETRAIN_MODELS:
        this.logger.log(
          "Retraining requested — run `python -m app.training.train` in the " +
            "AI service (or trigger its training endpoint).",
        );
        return { ok: true };
      default:
        this.logger.warn(`Unknown job: ${job.name}`);
        return { ok: false };
    }
  }
}
