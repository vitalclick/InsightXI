import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { AnalyticsService } from "../analytics/analytics.service";
import { IngestionService } from "../ingestion/ingestion.service";
import { AdaptiveFeedbackService } from "../predictions/adaptive-feedback.service";
import {
  INTELLIGENCE_QUEUE,
  JOB_REFRESH_DATA,
  JOB_RETRAIN_MODELS,
} from "./jobs.constants";

/**
 * Processes background intelligence jobs:
 *  - refresh-data:    re-ingest from the football data provider
 *  - retrain-models:  close the Adaptive Intelligence feedback loop —
 *                     reconcile finished fixtures into Experience Memory and
 *                     rebuild the adaptive state (and, in production, kick off
 *                     a full `python -m app.training.train` for the ensemble).
 *
 * These keep the queue wiring real and exercisable: refresh-data fans out to
 * the ingestion pipeline; retrain-models drives the continuous-learning loop.
 */
@Processor(INTELLIGENCE_QUEUE)
export class IntelligenceProcessor extends WorkerHost {
  private readonly logger = new Logger(IntelligenceProcessor.name);

  constructor(
    private readonly analytics: AnalyticsService,
    private readonly ingestion: IngestionService,
    private readonly adaptiveFeedback: AdaptiveFeedbackService,
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
      case JOB_RETRAIN_MODELS: {
        this.logger.log(
          "Closing the adaptive feedback loop (reconcile outcomes + recompute)…",
        );
        const { resolved, pending } =
          await this.adaptiveFeedback.reconcileAndRecompute();
        this.logger.log(
          `Adaptive recompute done (${resolved}/${pending} reconciled). For a full ` +
            "ensemble retrain, run `python -m app.training.train` in the AI service.",
        );
        return { ok: true };
      }
      default:
        this.logger.warn(`Unknown job: ${job.name}`);
        return { ok: false };
    }
  }
}
