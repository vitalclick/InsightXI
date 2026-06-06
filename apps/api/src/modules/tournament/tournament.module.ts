import { Global, Module } from "@nestjs/common";
import { TournamentController } from "./tournament.controller";
import { TournamentService } from "./tournament.service";

/** Global so match/prediction/tactical surfaces can resolve knockout ties. */
@Global()
@Module({
  controllers: [TournamentController],
  providers: [TournamentService],
  exports: [TournamentService],
})
export class TournamentModule {}
