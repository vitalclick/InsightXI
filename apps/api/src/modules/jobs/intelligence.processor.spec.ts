import { Job } from "bullmq";
import { IntelligenceProcessor } from "./intelligence.processor";
import { JOB_REFRESH_DATA, JOB_RETRAIN_MODELS } from "./jobs.constants";
import { AnalyticsService } from "../analytics/analytics.service";
import { IngestionService } from "../ingestion/ingestion.service";
import { AdaptiveFeedbackService } from "../predictions/adaptive-feedback.service";

describe("IntelligenceProcessor", () => {
  let analytics: { invalidate: jest.Mock };
  let ingestion: { ingestAll: jest.Mock };
  let adaptiveFeedback: { reconcileAndRecompute: jest.Mock };
  let processor: IntelligenceProcessor;

  beforeEach(() => {
    analytics = { invalidate: jest.fn() };
    ingestion = { ingestAll: jest.fn().mockResolvedValue(undefined) };
    adaptiveFeedback = {
      reconcileAndRecompute: jest
        .fn()
        .mockResolvedValue({ resolved: 2, pending: 5 }),
    };
    processor = new IntelligenceProcessor(
      analytics as unknown as AnalyticsService,
      ingestion as unknown as IngestionService,
      adaptiveFeedback as unknown as AdaptiveFeedbackService,
    );
  });

  it("refresh-data ingests, invalidates, then recomputes adaptive state (hourly)", async () => {
    const res = await processor.process({ name: JOB_REFRESH_DATA } as Job);

    expect(ingestion.ingestAll).toHaveBeenCalledTimes(1);
    expect(analytics.invalidate).toHaveBeenCalledTimes(1);
    // The recompute now runs hourly alongside the refresh.
    expect(adaptiveFeedback.reconcileAndRecompute).toHaveBeenCalledTimes(1);
    expect(res).toEqual({ ok: true });
  });

  it("retrain-models also reconciles + recomputes (daily catch-up)", async () => {
    const res = await processor.process({ name: JOB_RETRAIN_MODELS } as Job);

    expect(adaptiveFeedback.reconcileAndRecompute).toHaveBeenCalledTimes(1);
    expect(ingestion.ingestAll).not.toHaveBeenCalled();
    expect(res).toEqual({ ok: true });
  });

  it("ignores unknown jobs", async () => {
    const res = await processor.process({ name: "nope" } as unknown as Job);
    expect(res).toEqual({ ok: false });
    expect(adaptiveFeedback.reconcileAndRecompute).not.toHaveBeenCalled();
  });
});
