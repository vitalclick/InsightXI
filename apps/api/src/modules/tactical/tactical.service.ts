import { Injectable, NotFoundException } from "@nestjs/common";
import { FootballRepository } from "../../repositories/football.repository";
import { AnalyticsService } from "../analytics/analytics.service";
import { hashSeed } from "../../data/rng";

export type DefensiveLine = "High" | "Medium" | "Low";
export type AttackingFlow = "Wing-focused" | "Central" | "Balanced";
export type TransitionStyle = "Possession build-up" | "Fast counter" | "Direct";

export interface TacticalProfile {
  teamId: string;
  name: string;
  formation: string;
  possession: number;
  pressingIntensity: number;
  defensiveLine: DefensiveLine;
  attackingFlow: AttackingFlow;
  transitionStyle: TransitionStyle;
}

export interface TacticalMatchup {
  home: TacticalProfile;
  away: TacticalProfile;
  /** -100 (away tactical edge) .. +100 (home tactical edge). */
  tacticalEdge: number;
  insights: string[];
}

const FORMATIONS = ["4-3-3", "4-2-3-1", "3-5-2", "4-4-2", "3-4-3", "4-1-4-1"];

/**
 * Tactical interpretation derived deterministically from team ratings and a
 * per-team style seed. Heuristic (not tracking data) but consistent and
 * explainable — a foundation for the Tactical Intelligence layer.
 */
@Injectable()
export class TacticalService {
  constructor(
    private readonly repo: FootballRepository,
    private readonly analytics: AnalyticsService,
  ) {}

  profile(teamId: string): TacticalProfile {
    const team = this.repo.getTeam(teamId);
    if (!team) throw new NotFoundException(`Team ${teamId} not found`);
    const r = this.analytics.ratingsForTeam(teamId);
    const seed = hashSeed(teamId);

    const eloEdge = r.elo - 1500;
    const pressingIntensity = clamp(Math.round(55 + eloEdge / 6), 20, 95);
    const possession = clamp(Math.round(48 + eloEdge / 10), 32, 70);

    const defensiveLine: DefensiveLine =
      pressingIntensity >= 68 ? "High" : pressingIntensity >= 48 ? "Medium" : "Low";

    const attackingFlow: AttackingFlow =
      r.attackStrength >= 1.15
        ? (["Wing-focused", "Central", "Balanced"][seed % 3] as AttackingFlow)
        : "Balanced";

    const transitionStyle: TransitionStyle =
      possession >= 56
        ? "Possession build-up"
        : r.defenseStrength <= 0.95
          ? "Fast counter"
          : "Direct";

    return {
      teamId,
      name: r.name,
      formation: FORMATIONS[seed % FORMATIONS.length],
      possession,
      pressingIntensity,
      defensiveLine,
      attackingFlow,
      transitionStyle,
    };
  }

  matchup(homeId: string, awayId: string): TacticalMatchup {
    const home = this.profile(homeId);
    const away = this.profile(awayId);
    const insights: string[] = [];

    if (home.pressingIntensity - away.pressingIntensity >= 15) {
      insights.push(
        `${home.name}'s high press (${home.pressingIntensity}) could disrupt ` +
          `${away.name}'s ${away.transitionStyle.toLowerCase()}`,
      );
    } else if (away.pressingIntensity - home.pressingIntensity >= 15) {
      insights.push(
        `${away.name} presses more intensely and may pin ${home.name} back`,
      );
    }

    if (home.defensiveLine === "High" && away.transitionStyle === "Fast counter") {
      insights.push(
        `${home.name}'s high line is exposed to ${away.name}'s fast counters`,
      );
    }
    if (away.defensiveLine === "High" && home.transitionStyle === "Fast counter") {
      insights.push(
        `${away.name}'s high line is exposed to ${home.name}'s fast counters`,
      );
    }

    if (Math.abs(home.possession - away.possession) >= 8) {
      const dominant = home.possession > away.possession ? home : away;
      insights.push(`${dominant.name} should control possession and tempo`);
    }

    const tacticalEdge = clamp(
      Math.round(
        (home.pressingIntensity - away.pressingIntensity) * 0.5 +
          (home.possession - away.possession) * 0.5,
      ),
      -100,
      100,
    );

    if (insights.length === 0) {
      insights.push("Evenly matched tactical profiles — fine margins expected");
    }

    return { home, away, tacticalEdge, insights };
  }
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}
