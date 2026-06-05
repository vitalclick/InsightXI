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

-- Knockout bracket template. Participants are SLOT REFERENCES (group position
-- or an earlier tie's winner/loser); home_team_id/away_team_id and goals stay
-- null until the tie resolves from results.
CREATE TABLE IF NOT EXISTS knockout_fixtures (
  id                TEXT PRIMARY KEY,
  tournament_id     TEXT NOT NULL,
  stage             TEXT NOT NULL,           -- R32 | R16 | QF | SF | THIRD_PLACE | FINAL
  ord               INTEGER NOT NULL,        -- slot order within the stage
  utc_date          TEXT NOT NULL,
  home_kind         TEXT NOT NULL,           -- GROUP_WINNER | GROUP_RUNNER_UP | THIRD_PLACE | MATCH_WINNER | MATCH_LOSER
  home_group        TEXT,
  home_third_rank   INTEGER,
  home_source_match TEXT,
  home_label        TEXT NOT NULL,
  away_kind         TEXT NOT NULL,
  away_group        TEXT,
  away_third_rank   INTEGER,
  away_source_match TEXT,
  away_label        TEXT NOT NULL,
  home_team_id      TEXT,
  away_team_id      TEXT,
  home_goals        INTEGER,
  away_goals        INTEGER
);

CREATE INDEX IF NOT EXISTS idx_knockout_tournament ON knockout_fixtures (tournament_id, stage, ord);

CREATE TABLE IF NOT EXISTS users (
  id                    TEXT PRIMARY KEY,
  email                 TEXT UNIQUE NOT NULL,
  password_hash         TEXT,                            -- null for OAuth-only accounts
  tier                  TEXT NOT NULL DEFAULT 'FREE',
  role                  TEXT NOT NULL DEFAULT 'USER',     -- USER | ADMIN (admin console access)
  suspended             BOOLEAN NOT NULL DEFAULT FALSE,   -- admin-suspended accounts cannot sign in
  name                  TEXT,
  avatar_url            TEXT,
  provider              TEXT NOT NULL DEFAULT 'email',    -- email | google | apple
  email_verified        BOOLEAN NOT NULL DEFAULT FALSE,   -- OAuth accounts trusted on create
  token_version         INTEGER NOT NULL DEFAULT 0,       -- bump to revoke refresh tokens
  subscription_status   TEXT NOT NULL DEFAULT 'none',     -- none | active | expired | canceled
  subscription_provider TEXT,                             -- paypal | paystack | flutterwave
  subscription_ref      TEXT,
  current_period_end    TEXT                              -- ISO timestamp; null = none/unlimited
);

CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id),
  type       TEXT NOT NULL,                          -- welcome | premium | system | match
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  link       TEXT,                                   -- optional in-app deep link
  read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TEXT NOT NULL,                           -- ISO timestamp
  -- Monotonic insertion order. created_at is millisecond-resolution, so
  -- notifications raised in the same request tie on it; seq is the tiebreaker
  -- that keeps "newest first" deterministic.
  seq        BIGSERIAL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, created_at DESC, seq DESC);

-- Migrations for existing deployments (idempotent).
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'email';
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'none';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_provider TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_ref TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_period_end TEXT;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS seq BIGSERIAL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'USER';
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended BOOLEAN NOT NULL DEFAULT FALSE;

-- ── Admin console subsystems ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_tickets (
  id         TEXT PRIMARY KEY,
  subject    TEXT NOT NULL,
  category   TEXT NOT NULL,
  priority   TEXT NOT NULL,                          -- High | Medium | Low
  status     TEXT NOT NULL,                          -- Open | Pending | Closed
  requester  TEXT NOT NULL,
  assignee   TEXT NOT NULL,
  updated_at TEXT NOT NULL                            -- ISO timestamp
);

CREATE TABLE IF NOT EXISTS content_posts (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  category     TEXT NOT NULL,
  status       TEXT NOT NULL,                        -- Published | Scheduled | Draft
  author       TEXT NOT NULL,
  views        INTEGER NOT NULL DEFAULT 0,
  published_at TEXT NOT NULL                          -- ISO timestamp
);

CREATE TABLE IF NOT EXISTS feature_flags (
  key         TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  enabled     BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS transactions (
  id         TEXT PRIMARY KEY,
  user_name  TEXT NOT NULL,
  email      TEXT NOT NULL,
  plan       TEXT NOT NULL,                          -- Monthly | Annual
  amount     NUMERIC(10,2) NOT NULL,
  status     TEXT NOT NULL,                          -- Paid | Failed | Refunded
  method     TEXT NOT NULL,
  created_at TEXT NOT NULL                            -- ISO timestamp
);

CREATE TABLE IF NOT EXISTS audit_log (
  id     TEXT PRIMARY KEY,
  actor  TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  ip     TEXT NOT NULL,
  at     TEXT NOT NULL                                -- ISO timestamp
);

CREATE INDEX IF NOT EXISTS idx_audit_at ON audit_log (at DESC);
