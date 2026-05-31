import { Injectable } from "@nestjs/common";
import { FootballRepository } from "../../repositories/football.repository";
import { AnalyticsService } from "../analytics/analytics.service";

export interface LiveEvent {
  minute: number;
  type: "GOAL" | "KICKOFF" | "FULLTIME";
  teamId?: string;
  text: string;
}

export interface LiveSnapshot {
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  minute: number;
  homeGoals: number;
  awayGoals: number;
  /** Cumulative expected goals (chance quality) accrued so far. */
  homeXg: number;
  awayXg: number;
  /** 0..100; 50 = neutral, >50 = home pressure. */
  momentum: number;
  status: "LIVE" | "FINISHED";
  events: LiveEvent[];
}

const MINUTES_PER_TICK = 5;
/** Discrete xG added by the chance a goal is scored from (a finished shot). */
const GOAL_XG = 0.35;

/**
 * Drives a simulated live match. Pure state machine (no I/O) so it is unit
 * testable; the gateway calls tick() on an interval and broadcasts snapshots.
 * Cycles through scheduled fixtures so there is always live action in the demo.
 */
@Injectable()
export class LiveService {
  private state!: LiveSnapshot;
  private lambdaHome = 1.4;
  private lambdaAway = 1.2;
  private fixtureCursor = 0;

  constructor(
    private readonly repo: FootballRepository,
    private readonly analytics: AnalyticsService,
  ) {}

  snapshot(): LiveSnapshot {
    if (!this.state) this.startNextMatch();
    return this.state;
  }

  private candidatePairs(): Array<[string, string]> {
    const scheduled = this.repo.getMatches({ status: "SCHEDULED" });
    if (scheduled.length > 0) {
      return scheduled.map((m) => [m.homeTeamId, m.awayTeamId]);
    }
    const teams = this.repo.getTeams();
    return teams.slice(0, -1).map((t, i) => [t.id, teams[i + 1].id]);
  }

  startNextMatch(): LiveSnapshot {
    const pairs = this.candidatePairs();
    const [homeId, awayId] = pairs[this.fixtureCursor % pairs.length];
    this.fixtureCursor++;

    const home = this.analytics.ratingsForTeam(homeId);
    const away = this.analytics.ratingsForTeam(awayId);
    const leagueAvg = this.analytics.leagueAvgGoals(
      this.repo.getTeam(homeId)?.leagueId ?? "",
    );
    this.lambdaHome = clamp(
      leagueAvg * home.attackStrength * away.defenseStrength * 1.15,
      0.4,
      4,
    );
    this.lambdaAway = clamp(
      leagueAvg * away.attackStrength * home.defenseStrength,
      0.4,
      4,
    );

    this.state = {
      matchId: `live-${homeId}-${awayId}-${Date.now()}`,
      homeTeamId: homeId,
      awayTeamId: awayId,
      homeTeamName: home.name,
      awayTeamName: away.name,
      minute: 0,
      homeGoals: 0,
      awayGoals: 0,
      homeXg: 0,
      awayXg: 0,
      momentum: 50,
      status: "LIVE",
      events: [{ minute: 0, type: "KICKOFF", text: "Kick-off" }],
    };
    return this.state;
  }

  /** Advance the match by one tick. Returns the new snapshot. */
  tick(rand: () => number = Math.random): LiveSnapshot {
    if (!this.state) this.startNextMatch();
    const s = this.state;

    if (s.status === "FINISHED") {
      return this.startNextMatch();
    }

    s.minute = Math.min(90, s.minute + MINUTES_PER_TICK);

    const pHome = (this.lambdaHome / 90) * MINUTES_PER_TICK;
    const pAway = (this.lambdaAway / 90) * MINUTES_PER_TICK;

    // Accrue cumulative expected goals for the window, weighting each side by
    // the momentum carried into it (the pressing team manufactures more chance
    // quality). Independent of whether a goal is actually realised below.
    const momHome = 0.7 + (s.momentum / 100) * 0.6;
    const momAway = 0.7 + ((100 - s.momentum) / 100) * 0.6;
    s.homeXg = round2(s.homeXg + pHome * momHome);
    s.awayXg = round2(s.awayXg + pAway * momAway);

    if (rand() < pHome) {
      s.homeGoals++;
      s.homeXg = round2(s.homeXg + GOAL_XG);
      s.events.push({
        minute: s.minute,
        type: "GOAL",
        teamId: s.homeTeamId,
        text: `GOAL! ${s.homeTeamName} (${s.homeGoals}-${s.awayGoals})`,
      });
    }
    if (rand() < pAway) {
      s.awayGoals++;
      s.awayXg = round2(s.awayXg + GOAL_XG);
      s.events.push({
        minute: s.minute,
        type: "GOAL",
        teamId: s.awayTeamId,
        text: `GOAL! ${s.awayTeamName} (${s.homeGoals}-${s.awayGoals})`,
      });
    }

    const target =
      50 +
      (this.lambdaHome - this.lambdaAway) * 12 +
      (s.homeGoals - s.awayGoals) * 6;
    s.momentum = clamp(
      Math.round(s.momentum * 0.6 + target * 0.4 + (rand() - 0.5) * 20),
      5,
      95,
    );

    if (s.minute >= 90) {
      s.status = "FINISHED";
      s.events.push({
        minute: 90,
        type: "FULLTIME",
        text: `Full time: ${s.homeTeamName} ${s.homeGoals}-${s.awayGoals} ${s.awayTeamName}`,
      });
    }

    if (s.events.length > 12) s.events = s.events.slice(-12);
    return s;
  }
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}
