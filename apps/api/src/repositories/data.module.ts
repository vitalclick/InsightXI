import { Global, Module } from "@nestjs/common";
import { ProvidersModule } from "../providers/providers.module";
import { FootballRepository } from "./football.repository";

/** Provides the shared read repository to all feature modules. */
@Global()
@Module({
  imports: [ProvidersModule],
  providers: [FootballRepository],
  exports: [FootballRepository],
})
export class DataModule {}
