import { Global, Logger, Module } from "@nestjs/common";
import { ProvidersModule } from "../providers/providers.module";
import { PgService } from "../db/pg.service";
import { FootballRepository } from "./football.repository";
import { MemoryFootballRepository } from "./memory-football.repository";
import { PostgresFootballRepository } from "./postgres-football.repository";

const usePostgres = process.env.DATA_BACKEND === "postgres";

new Logger("DataModule").log(
  `Data backend: ${usePostgres ? "postgres" : "memory"}`,
);

/**
 * Provides the shared read repository. The concrete backend is chosen by
 * DATA_BACKEND; PgService is always provided but only connects when used.
 */
@Global()
@Module({
  imports: [ProvidersModule],
  providers: [
    PgService,
    {
      provide: FootballRepository,
      useClass: usePostgres
        ? PostgresFootballRepository
        : MemoryFootballRepository,
    },
  ],
  exports: [FootballRepository, PgService],
})
export class DataModule {}
