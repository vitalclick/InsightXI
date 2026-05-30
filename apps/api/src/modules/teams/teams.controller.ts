import { Controller, Get, Param, Query } from "@nestjs/common";
import { TeamsService } from "./teams.service";

@Controller("teams")
export class TeamsController {
  constructor(private readonly teams: TeamsService) {}

  @Get()
  list(@Query("league") league?: string) {
    return this.teams.list(league);
  }

  @Get(":id")
  profile(@Param("id") id: string) {
    return this.teams.profile(id);
  }
}
