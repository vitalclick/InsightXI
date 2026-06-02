import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { MatchesModule } from "../matches/matches.module";

/**
 * Admin console backend. AuthModule is global, so UsersService + the guards
 * are available; MatchesModule supplies real fixture/result data.
 */
@Module({
  imports: [MatchesModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
