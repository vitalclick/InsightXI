import { Module } from "@nestjs/common";
import { ModelHealthController } from "./model-health.controller";
import { ModelHealthService } from "./model-health.service";

@Module({
  controllers: [ModelHealthController],
  providers: [ModelHealthService],
  exports: [ModelHealthService],
})
export class ModelHealthModule {}
