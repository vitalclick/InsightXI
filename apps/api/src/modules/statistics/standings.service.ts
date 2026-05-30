import { Injectable, NotFoundException } from "@nestjs/common";
import { Match, StandingRow } from "../../common/domain";
import { FootballRepository } from "../../repositories/football.repository";
import { CURRENT_SEASON } from "../../data/seed";

@Injectable()
export class StandingsService {
  constructor(private readonly repo: FootballRepository) {}

  /** Compute a league table from finished matches for a season. */
  table(leagueId: string, season = CURRENT_SEASON): StandingRow[] {
    const league = this.repo.getLeague(leagueId);
    if (!league) throw new NotFoundException(`League ${leagueId} not found`);

    const teams = this.repo.getTeams(leagueId);
    const rows = new Map<string, StandingRow>();
    for (const t of teams) {
      rows.set(t.id, {
        position: 0,
        teamId: t.id,
        teamName: t.name,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        form: [],
      });
    }

    const finished = this.repo
      .getMatches({ leagueId, season, status: "FINISHED" })
      .sort((a, b) => a.utcDate.localeCompare(b.utcDate));

    for (const m of finished) {
      this.applyMatch(rows, m);
    }

    const table = [...rows.values()].map((r) => ({
      ...r,
      goalDifference: r.goalsFor - r.goalsAgainst,
      form: r.form.slice(-5).reverse(),
    }));

    table.sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        a.teamName.localeCompare(b.teamName),
    );
    table.forEach((r, i) => (r.position = i + 1));
    return table;
  }

  private applyMatch(rows: Map<string, StandingRow>, m: Match): void {
    const home = rows.get(m.homeTeamId);
    const away = rows.get(m.awayTeamId);
    if (!home || !away || m.homeGoals === null || m.awayGoals === null) return;

    home.played++;
    away.played++;
    home.goalsFor += m.homeGoals;
    home.goalsAgainst += m.awayGoals;
    away.goalsFor += m.awayGoals;
    away.goalsAgainst += m.homeGoals;

    if (m.homeGoals > m.awayGoals) {
      home.won++;
      home.points += 3;
      away.lost++;
      home.form.push("W");
      away.form.push("L");
    } else if (m.homeGoals < m.awayGoals) {
      away.won++;
      away.points += 3;
      home.lost++;
      home.form.push("L");
      away.form.push("W");
    } else {
      home.drawn++;
      away.drawn++;
      home.points++;
      away.points++;
      home.form.push("D");
      away.form.push("D");
    }
  }
}
