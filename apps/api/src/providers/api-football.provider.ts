import { Logger } from "@nestjs/common";
import { League, Match, Team } from "../common/domain";
import { FootballDataProvider } from "./football-data.provider";
import {
  AfEnvelope,
  AfFixtureResponse,
  AfLeagueResponse,
  AfTeamResponse,
} from "./api-football.types";
import { mapFixture, mapLeague, mapTeam } from "./api-football.mapper";

/** Minimal fetch contract so the provider is testable with an injected impl. */
export type FetchLike = (
  url: string,
  init?: { headers?: Record<string, string> },
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export interface ApiFootballConfig {
  apiKey: string;
  baseUrl?: string;
  leagueIds: number[];
  /** One or more start-year seasons to pull (e.g. [2022, 2023]). */
  seasons: number[];
  fetchImpl?: FetchLike;
}

/**
 * Live data source backed by API-Football (v3). Implements the same
 * FootballDataProvider contract as the mock, so no service code changes when
 * switching to live data — selection happens in ProvidersModule by env.
 *
 * Pulls every (league × season) combination so multiple seasons of history can
 * be ingested in one pass.
 */
export class ApiFootballProvider implements FootballDataProvider {
  private readonly logger = new Logger(ApiFootballProvider.name);
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;

  constructor(private readonly config: ApiFootballConfig) {
    this.baseUrl = (
      config.baseUrl ?? "https://v3.football.api-sports.io"
    ).replace(/\/$/, "");
    this.fetchImpl =
      config.fetchImpl ?? (globalThis.fetch as unknown as FetchLike);
  }

  private async get<T>(path: string): Promise<T[]> {
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      headers: { "x-apisports-key": this.config.apiKey },
    });
    if (!res.ok) {
      throw new Error(`API-Football responded ${res.status} for ${path}`);
    }
    const body = (await res.json()) as AfEnvelope<T>;
    // API-Football replies 200 even on misconfiguration; surface the reason
    // (bad season/plan/token/rate-limit) instead of silently returning [].
    if (hasErrors(body.errors)) {
      this.logger.warn(
        `API-Football returned errors for ${path}: ${JSON.stringify(body.errors)}`,
      );
    }
    return body.response ?? [];
  }

  async getLeagues(): Promise<League[]> {
    const byId = new Map<string, League>();
    for (const id of this.config.leagueIds) {
      for (const season of this.config.seasons) {
        const rows = await this.get<AfLeagueResponse>(
          `/leagues?id=${id}&season=${season}`,
        );
        if (rows[0]) {
          const league = mapLeague(rows[0]);
          byId.set(league.id, league);
        }
      }
    }
    return [...byId.values()];
  }

  async getTeams(): Promise<Team[]> {
    const byId = new Map<string, Team>();
    for (const id of this.config.leagueIds) {
      for (const season of this.config.seasons) {
        const rows = await this.get<AfTeamResponse>(
          `/teams?league=${id}&season=${season}`,
        );
        for (const r of rows) {
          const team = mapTeam(r, String(id));
          byId.set(team.id, team);
        }
      }
    }
    return [...byId.values()];
  }

  async getMatches(): Promise<Match[]> {
    const out: Match[] = [];
    for (const id of this.config.leagueIds) {
      for (const season of this.config.seasons) {
        const rows = await this.get<AfFixtureResponse>(
          `/fixtures?league=${id}&season=${season}`,
        );
        for (const r of rows) out.push(mapFixture(r));
      }
    }
    this.logger.log(
      `Fetched ${out.length} fixtures from API-Football ` +
        `(leagues ${this.config.leagueIds.join(",")}; seasons ${this.config.seasons.join(",")})`,
    );
    return out;
  }
}

/** True when API-Football's `errors` payload is non-empty (object or array). */
function hasErrors(errors: AfEnvelope<unknown>["errors"]): boolean {
  if (!errors) return false;
  return Array.isArray(errors) ? errors.length > 0 : Object.keys(errors).length > 0;
}
