import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { AdminStore } from "./admin.store";
import { InMemoryAdminStore } from "./in-memory-admin.store";
import { PostgresAdminStore } from "./postgres-admin.store";
import { MatchesModule } from "../matches/matches.module";

const usePostgres = process.env.DATA_BACKEND === "postgres";

/**
 * Admin console backend. AuthModule is global, so UsersService + the guards
 * are available; MatchesModule supplies real fixture/result data. The admin
 * subsystems (tickets/content/flags/transactions/audit) follow DATA_BACKEND.
 */
@Module({
  imports: [MatchesModule],
  controllers: [AdminController],
  providers: [
    AdminService,
    {
      provide: AdminStore,
      useClass: usePostgres ? PostgresAdminStore : InMemoryAdminStore,
    },
  ],
  exports: [AdminService],
})
export class AdminModule {}
