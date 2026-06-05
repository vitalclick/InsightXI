import { Controller, Get } from "@nestjs/common";
import { TournamentService } from "./tournament.service";

@Controller("tournament")
export class TournamentController {
  constructor(private readonly tournament: TournamentService) {}

  /** Projected World Cup 2026 group tables. */
  @Get("groups")
  groups() {
    return this.tournament.bracket().groups;
  }

  /** Full projected knockout bracket (qualifiers → final). */
  @Get("bracket")
  bracket() {
    return this.tournament.bracket();
  }
}
