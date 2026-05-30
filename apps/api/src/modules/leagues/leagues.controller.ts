import { Controller, Get } from "@nestjs/common";
import { FootballRepository } from "../../repositories/football.repository";
import { SEASONS } from "../../data/seed";

@Controller("leagues")
export class LeaguesController {
  constructor(private readonly repo: FootballRepository) {}

  @Get()
  list() {
    return this.repo.getLeagues();
  }

  @Get("seasons")
  seasons() {
    return SEASONS;
  }
}
