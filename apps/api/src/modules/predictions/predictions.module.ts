import { Module } from "@nestjs/common";
import { AnalyticsModule } from "../analytics/analytics.module";
import { AdaptiveFeedbackService } from "./adaptive-feedback.service";
import { PredictionsController } from "./predictions.controller";
import { PredictionsService } from "./predictions.service";
import { DailyPickService } from "./daily-pick.service";
import { DailyPickStore } from "./daily-pick.store";
import { InMemoryDailyPickStore } from "./in-memory-daily-pick.store";
import { PostgresDailyPickStore } from "./postgres-daily-pick.store";
import {
  AI_PREDICTION_CLIENT,
  HttpAiPredictionClient,
} from "./ai-prediction.client";

const usePostgres = process.env.DATA_BACKEND === "postgres";

@Module({
  imports: [AnalyticsModule],
  controllers: [PredictionsController],
  providers: [
    PredictionsService,
    AdaptiveFeedbackService,
    DailyPickService,
    {
      provide: DailyPickStore,
      useClass: usePostgres ? PostgresDailyPickStore : InMemoryDailyPickStore,
    },
    { provide: AI_PREDICTION_CLIENT, useClass: HttpAiPredictionClient },
  ],
  exports: [AdaptiveFeedbackService],
})
export class PredictionsModule {}
