import { Module } from "@nestjs/common";
import { AnalyticsModule } from "../analytics/analytics.module";
import { AdaptiveFeedbackService } from "./adaptive-feedback.service";
import { PredictionsController } from "./predictions.controller";
import { PredictionsService } from "./predictions.service";
import {
  AI_PREDICTION_CLIENT,
  HttpAiPredictionClient,
} from "./ai-prediction.client";

@Module({
  imports: [AnalyticsModule],
  controllers: [PredictionsController],
  providers: [
    PredictionsService,
    AdaptiveFeedbackService,
    { provide: AI_PREDICTION_CLIENT, useClass: HttpAiPredictionClient },
  ],
  exports: [AdaptiveFeedbackService],
})
export class PredictionsModule {}
