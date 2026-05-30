import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Queue } from "bullmq";
import {
  INTELLIGENCE_QUEUE,
  JOB_REFRESH_DATA,
  JOB_RETRAIN_MODELS,
} from "./jobs.constants";

/**
 * Schedules recurring intelligence jobs: hourly data refresh and daily model
 * retraining (the "daily retraining pipeline" from the platform spec).
 */
@Injectable()
export class JobsService implements OnModuleInit {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectQueue(INTELLIGENCE_QUEUE) private readonly queue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.queue.add(
      JOB_REFRESH_DATA,
      {},
      { repeat: { pattern: "0 * * * *" }, removeOnComplete: true },
    );
    await this.queue.add(
      JOB_RETRAIN_MODELS,
      {},
      { repeat: { pattern: "0 3 * * *" }, removeOnComplete: true },
    );
    this.logger.log("Scheduled recurring intelligence jobs");
  }

  /** Manually enqueue a retrain (e.g. from an admin endpoint). */
  async triggerRetrain(): Promise<void> {
    await this.queue.add(JOB_RETRAIN_MODELS, {});
  }
}
