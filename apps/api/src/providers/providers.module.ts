import { Global, Module } from "@nestjs/common";
import { FOOTBALL_DATA_PROVIDER } from "./football-data.provider";
import { MockFootballProvider } from "./mock-football.provider";

/**
 * Wires the football data source. Switch the implementation here (e.g. to an
 * ApiFootballProvider) based on configuration without touching feature modules.
 */
@Global()
@Module({
  providers: [
    { provide: FOOTBALL_DATA_PROVIDER, useClass: MockFootballProvider },
  ],
  exports: [FOOTBALL_DATA_PROVIDER],
})
export class ProvidersModule {}
