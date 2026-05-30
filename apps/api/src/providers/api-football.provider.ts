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
  season: number;
  fetchImpl?: FetchLike;
}

/**
 * Live data source backed by API-Football (v3). Implements the same
 * FootballDataProvider contract as the mock, so no service code changes when
 * switching to live data — selection happens in ProvidersModule by env.
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
    return body.response ?? [];
  }

  async getLeagues(): Promise<League[]> {
    const out: League[] = [];
    for (const id of this.config.leagueIds) {
      const rows = await this.get<AfLeagueResponse>(
        `/leagues?id=${id}&season=${this.config.season}`,
      );
      if (rows[0]) out.push(mapLeague(rows[0]));
    }
    return out;
  }

  async getTeams(): Promise<Team[]> {
    const out: Team[] = [];
    for (const id of this.config.leagueIds) {
      const rows = await this.get<AfTeamResponse>(
        `/teams?league=${id}&season=${this.config.season}`,
      );
      for (const r of rows) out.push(mapTeam(r, String(id)));
    }
    return out;
  }

  async getMatches(): Promise<Match[]> {
    const out: Match[] = [];
    for (const id of this.config.leagueIds) {
      const rows = await this.get<AfFixtureResponse>(
        `/fixtures?league=${id}&season=${this.config.season}`,
      );
      for (const r of rows) out.push(mapFixture(r));
    }
    this.logger.log(`Fetched ${out.length} fixtures from API-Football`);
    return out;
  }
}
