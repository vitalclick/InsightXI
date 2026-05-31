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
 *  - refresh-data (hourly):   re-ingest from the football data provider, then
 *                             immediately close the Adaptive Intelligence loop
 *                             on the freshly-arrived results — reconcile
 *                             finished fixtures into Experience Memory and
 *                             rebuild the adaptive state.
 *  - retrain-models (daily):  the same reconcile/recompute (a catch-up; it is
 *                             idempotent) plus the heavier full ensemble retrain
 *                             (`python -m app.training.train`).
 *
 * Running the recompute hourly keeps learned weights/calibration current as
 * results land; it is cheap because the engine only recomputes when something
 * actually resolved (an idle hour reconciles nothing and skips the rebuild).
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
      case JOB_REFRESH_DATA: {
        this.logger.log("Refreshing football data from provider…");
        await this.ingestion.ingestAll();
        this.analytics.invalidate();
        // Fresh results just landed — feed them back and recompute now.
        await this.runAdaptiveRecompute();
        return { ok: true };
      }
      case JOB_RETRAIN_MODELS: {
        await this.runAdaptiveRecompute();
        this.logger.log(
          "For a full ensemble retrain, run `python -m app.training.train` in " +
            "the AI service.",
        );
        return { ok: true };
      }
      default:
        this.logger.warn(`Unknown job: ${job.name}`);
        return { ok: false };
    }
  }

  /** Reconcile finished fixtures into Experience Memory and rebuild adaptive state. */
  private async runAdaptiveRecompute(): Promise<void> {
    this.logger.log("Closing the adaptive feedback loop (reconcile + recompute)…");
    const { resolved, pending } =
      await this.adaptiveFeedback.reconcileAndRecompute();
    this.logger.log(`Adaptive recompute done (${resolved}/${pending} reconciled)`);
  }
}
