-- InsightXI Postgres schema (apply to Neon/Postgres before DATA_BACKEND=postgres).
-- utc_date is stored as TEXT to round-trip ISO timestamps faithfully.

CREATE TABLE IF NOT EXISTS leagues (
  id      TEXT PRIMARY KEY,
  name    TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS teams (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  short_name TEXT NOT NULL,
  league_id  TEXT NOT NULL REFERENCES leagues(id)
);

CREATE TABLE IF NOT EXISTS matches (
  id           TEXT PRIMARY KEY,
  league_id    TEXT NOT NULL REFERENCES leagues(id),
  season       TEXT NOT NULL,
  matchday     INTEGER NOT NULL DEFAULT 0,
  utc_date     TEXT NOT NULL,
  status       TEXT NOT NULL,
  home_team_id TEXT NOT NULL,
  away_team_id TEXT NOT NULL,
  home_goals   INTEGER,
  away_goals   INTEGER,
  home_xg      DOUBLE PRECISION,
  away_xg      DOUBLE PRECISION
);

CREATE INDEX IF NOT EXISTS idx_matches_league_season ON matches (league_id, season);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches (status);

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  tier          TEXT NOT NULL DEFAULT 'FREE'
);
