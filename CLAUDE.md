# AGENTS.md

# InsightXI — True Football Intelligence Platform

## Overview

InsightXI is a modern AI-powered football intelligence and analytics platform designed to provide deep football insights, statistical modeling, tactical analysis, historical trends, and explainable predictive analytics.

The platform is NOT a gambling or betting platform. Predictions are presented as statistical probabilities and football intelligence insights.

InsightXI combines:

* Football data aggregation
* AI-powered analytics
* Tactical intelligence
* Historical trend analysis
* Explainable match intelligence
* Real-time football data systems

---

# Core Philosophy

InsightXI exists to transform football data into actionable intelligence.

We do not optimize for:

* gambling promotion
* misleading certainty
* “sure wins”
* fake accuracy claims

We optimize for:

* transparency
* explainability
* statistical integrity
* football intelligence
* modern analytics

---

# Product Vision

To become the world’s leading AI-powered football intelligence platform.

---

# Primary Product Categories

## 1. Football Data Hub

Core football information infrastructure.

### Includes

* fixtures
* live scores
* match results
* league tables
* player statistics
* team statistics
* transfers
* injuries
* suspensions
* head-to-head records

---

## 2. Football Intelligence Engine

AI-powered analytics and predictive systems.

### Includes

* match intelligence
* confidence scoring
* tactical analysis
* lineup impact analysis
* fatigue analysis
* momentum analysis
* expected goals analysis
* explainable predictions

---

## 3. Historical Analytics Engine

Long-term football data intelligence.

### Includes

* seasonal comparisons
* historical trends
* historical team strength
* home vs away history
* manager performance history
* historical xG analysis

---

## 4. Tactical Intelligence Layer

Advanced football tactical interpretation.

### Includes

* formation analysis
* pressing analysis
* defensive structure
* attacking flow
* transition patterns
* tactical matchup compatibility

---

# Tech Stack

## Frontend

* Next.js
* React
* TypeScript
* TailwindCSS
* Framer Motion
* Zustand (state management — chosen over Redux Toolkit)
* TanStack Query (server/cache state)

---

## Backend

* NestJS
* PostgreSQL
* Redis
* BullMQ
* Socket.IO

---

## AI Service

* Python
* FastAPI
* Scikit-learn
* XGBoost
* Pandas
* NumPy

---

## Infrastructure

* Vercel (frontend)
* Railway (backend — chosen over Render)
* Neon (managed Postgres — chosen over Supabase)
* Cloudflare CDN
* Docker
* GitHub Actions CI/CD
* pnpm workspaces (monorepo tooling)

> **Locked stack decisions.** The "X or Y" choices above are now resolved:
> **Zustand** for state, **Railway** for backend hosting, **Neon** for the
> database, and **pnpm workspaces** for the monorepo. Do not reintroduce the
> alternatives without an explicit decision to change direction.

---

# Architectural Principles

## 1. Modular Architecture

All services must be independently scalable.

---

## 2. API-First Development

Everything must expose clean APIs.

---

## 3. Real-Time By Design

Live football data is critical.

---

## 4. Explainability First

Predictions must include explainable reasoning.

Example:

* lineup advantage
* xG superiority
* fatigue disadvantage
* tactical mismatch

Never expose opaque predictions without reasoning.

---

## 5. Statistical Integrity

Never display:

* “100% guaranteed”
* “sure win”
* misleading confidence claims

All outputs must be probabilistic.

---

# Project Structure

## Frontend Structure

```txt
/apps/web
  /app
  /components
  /modules
  /services
  /hooks
  /store
  /styles
  /utils
```

---

## Backend Structure

```txt
/apps/api
  /modules
    /auth
    /matches
    /teams
    /players
    /analytics
    /predictions
    /statistics
    /subscriptions
    /notifications
```

---

## AI Service Structure

```txt
/apps/ai-service
  /app
    /inference
  /models
  /training
  /datasets
  /features
  /evaluation
  /tests
```

> **Scaffold status.** This monorepo structure is now materialized as a
> runnable skeleton (pnpm workspace at the repo root). Each app boots and the
> AI service ships passing tests. Feature modules listed above are stubs/
> placeholders to be filled in per the MVP phasing below.

---

# Setup, Commands & MVP Phasing

## Prerequisites

* Node.js >= 20 and pnpm >= 9 (`npm i -g pnpm`)
* Python >= 3.11 (for the AI service)
* A running Postgres (Neon in cloud, or local) and Redis for full backend work

## First-time setup

```bash
pnpm install                 # install web + api deps (workspace root)
cp .env.example .env         # then fill in values — never commit .env

# AI service (separate Python env)
cd apps/ai-service
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
```

## Everyday commands (run from repo root)

| Task                    | Command                                            |
| ----------------------- | -------------------------------------------------- |
| Run web + api (dev)     | `pnpm dev`                                          |
| Run web only            | `pnpm dev:web`     → http://localhost:3000          |
| Run api only            | `pnpm dev:api`     → http://localhost:4000          |
| Run AI service          | `pnpm dev:ai`      → http://localhost:8000          |
| Build all JS apps       | `pnpm build`                                        |
| Lint all JS apps        | `pnpm lint`                                         |
| Test all JS apps        | `pnpm test`                                         |
| Test AI service         | `cd apps/ai-service && pytest`                      |
| Lint AI service         | `cd apps/ai-service && ruff check .`                |

Health checks: API `GET /health`, AI service `GET /health`,
AI prediction `POST /predict` (transparent baseline model for now).

## MVP Phasing

The product vision is broad; built in phases rather than all at once.
Phases 1–4 below are **implemented** as a working, tested vertical slice
running offline on a deterministic seed data source (swappable for a live
provider behind `FootballDataProvider`).

### Phase 1 — Foundations ✅

* Monorepo scaffold, shared env contract, CI workflow
* `health` endpoints across services
* Football Data Hub: leagues, teams (profiles/form), fixtures, results,
  H2H, computed league tables — behind a `FootballDataProvider` abstraction
  (mock seed provider now; API-Football → Postgres later)
* Web shell: dashboard, fixtures, results, standings, match detail

### Phase 2 — Intelligence Engine ✅

* Poisson scoreline model + Elo (Davidson) + Logistic Regression / XGBoost
  ensemble, with reproducible training (`python -m app.training.train`) and
  graceful fallback to the analytical blend when no artifacts exist
* Explainable `/predict` (probabilities, expected goals, faithful reasoning)
* `analytics` (Elo, strengths, form) + `predictions` API modules wired to the
  AI service via a swappable client
* Markets: 1X2, Double Chance, Draw No Bet, Over 1.5/2.5, Under 4.5, BTTS,
  First Half Goal

### Phase 3 — Real-Time & Tactical ✅

* Live scores + live momentum + event feed via Socket.IO (simulated match)
* Tactical Intelligence layer (formation, press, defensive line, transitions,
  matchup edge + insights)
* BullMQ jobs for ingestion refresh + daily retraining (feature-flagged via
  `ENABLE_QUEUES`; boots without Redis)

### Phase 4 — Historical & Premium ✅

* Historical analytics across seasons: H2H summaries + per-season team trends
* JWT auth + subscription tiers (FREE/PREMIUM) + RBAC guards
  (premium-gated trends endpoint; free/premium demo accounts)
* PWA: manifest, themed install, offline app-shell service worker

### Launch — FIFA World Cup 2026 ✅

* The platform's launch tournament. All 48 nations across the 12 groups (as
  drawn) are seeded as competitions in `apps/api/src/data/world-cup.ts` with
  hand-tuned, transparent attack/defense priors (not certainty claims). Each
  group is its own competition (`wc26-a`…`wc26-l`) so the existing Data Hub,
  standings, fixtures, ratings and prediction surfaces work unchanged.
* Two data layers: pre-tournament **form** in earlier seasons (finished →
  feeds Elo/form/strength/H2H) and the June 2026 **group stage** as SCHEDULED
  fixtures the engine predicts. Group tables start empty and fill as played.
* **Structural knockout bracket** (`tournament` module → `GET /tournament/bracket`
  + `/tournament/groups`, web `/bracket`). The knockout is a **first-class,
  persisted** part of the data model:
  * `KnockoutFixture` / `BracketSlot` domain types + a `knockout_fixtures` table
    (memory + Postgres, via the `FootballDataProvider` → repository pipeline).
    The bracket is stored as a **static template** of slot references (group
    position, or an earlier tie's winner/loser) defined in
    `apps/api/src/data/tournament.ts`.
  * `TournamentService` resolves it: builds each group table from its fixtures
    (**actual points where played, projected expected points otherwise** — a
    global Poisson model over the national priors), qualifies top-2 + 8 best
    thirds (32), then walks the template stage by stage filling slots and
    projecting each tie (draws split by relative strength) to the Final + a
    third-place play-off. Works offline (no AI service) and reacts to real
    results as they arrive.
  * Bracket layout is a **documented standard template** (same-group teams kept
    apart until the semi-finals), *not* FIFA's official Annex C third-place
    combination table — that 495-row table wasn't retrievable in the build
    environment (WebFetch blocked). Swap the template in `data/tournament.ts`
    for the official slotting without touching the resolver.
  * Presented strictly as a probabilistic projection, never a guaranteed result.
  * **Wired into the rest of the app:** `MatchesService`, `PredictionsService`
    and the tactical controller resolve a knockout-tie id via the (global)
    `TournamentService`, so `/matches/:id`, `/predictions/match/:id` and
    `/tactical/match/:id` all work for bracket ties — the existing match-intel
    page is reused unchanged. Bracket ties on `/bracket` deep-link into it, and
    the dashboard + fixtures surface entry points to the bracket.

### Next (beyond MVP)

* Real provider integration (API-Football); seed football data into Postgres
* Model calibration + drift monitoring, richer feature set
* Performance hardening to Lighthouse 90+, real manager/lineup data
* World Cup: adopt FIFA's official R32 third-place combination table (Annex C)
  in `data/tournament.ts`; record real knockout results to fill the bracket

> **Persistence.** The data layer is swappable via `DATA_BACKEND=memory|postgres`
> (default `memory`, deterministic seed). Postgres uses **raw `node-postgres`
> (`pg`) against `apps/api/src/db/schema.sql`** — there is no ORM (an earlier
> note mentioned Prisma; the code does not use it). On boot with
> `DATA_BACKEND=postgres`, `applyMigrations()` (called in `main.ts` before the
> Nest app initializes) runs `schema.sql`, which is idempotent
> (`CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`). Set `DATABASE_URL`
> to a Neon/Postgres connection string. Persisted domains: users (incl.
> role/suspension), notifications, football data, and the admin subsystems
> (support tickets, content, feature flags, transactions, audit log). The admin
> *demo user cohort* is always in-memory (it visually pads the users table
> alongside real accounts).

---

# Core Platform Features

# Match Intelligence

## Includes

* predicted outcomes
* confidence scoring
* xG comparison
* tactical breakdown
* momentum analysis
* lineup analysis
* injury impact

---

# Team Intelligence

## Includes

* form analysis
* attack rating
* defense rating
* possession profile
* tactical style
* squad depth
* pressing intensity

---

# Historical Data

## Includes

* 5+ years historical results
* team trends
* historical H2H
* manager history
* league evolution
* seasonal comparisons

---

# Real-Time Features

## Includes

* live score updates
* live momentum
* live match intelligence
* live xG updates
* live event timeline

---

# Supported Prediction Markets

Predictions must remain analytical and statistically explainable.

## Supported Markets

* Home Win
* Away Win
* Draw
* Double Chance
* Over 1.5 Goals
* Under 4.5 Goals
* Both Teams To Score
* Team To Score
* Draw No Bet
* First Half Goal

---

# Confidence System

## Confidence Levels

| Level            | Range  |
| ---------------- | ------ |
| Medium           | 50–65% |
| Strong           | 66–79% |
| Very Strong      | 80–89% |
| Elite Confidence | 90%+   |

Avoid excessive use of 90%+ outputs.

---

# AI Modeling Principles

## Core Inputs

* xG
* xGA
* recent form
* home advantage
* lineup strength
* injuries
* suspensions
* fatigue
* travel distance
* tactical compatibility
* historical trends
* motivation analysis

---

## Core Models

* Poisson Models
* Elo Ratings
* Logistic Regression
* XGBoost
* Ensemble Models

---

# Explainable AI Standards

Every prediction should include machine-generated explanations.

## Example

```txt
Arsenal Win Probability Increased Due To:
- Stronger recent xG trend
- Opponent defensive injuries
- Better home form
- Tactical pressing advantage
```

---

# UX Philosophy

The platform must feel:

* premium
* intelligent
* modern
* data-rich
* trustworthy

It must NOT feel:

* spammy
* gambling-focused
* overloaded
* outdated

---

# UI Design Principles

## Use

* cards
* heatmaps
* charts
* tactical visuals
* momentum bars
* interactive graphs
* probability rings

## Avoid

* outdated tables
* flashing gambling aesthetics
* cluttered dashboards

---

# Branding

## Brand Name

InsightXI

## Tagline

True Football Intelligence Platform

---

# Tone & Voice

InsightXI communication must be:

* intelligent
* analytical
* professional
* football-native
* transparent

Avoid:

* hype language
* fake certainty
* gambling slang
* “banker”
* “sure odds”

---

# Subscription Model

## Free Users

* limited daily insights
* limited analytics
* limited historical access

## Premium Users

* deep analytics
* advanced AI insights
* tactical reports
* historical intelligence
* lineup intelligence
* advanced match analysis

---

# Performance Requirements

## Frontend

* Lighthouse 90+
* PWA installable
* mobile-first
* SSR optimized

---

## Backend

* scalable queues
* websocket support
* low-latency APIs

---

## AI

* daily retraining pipelines
* feature versioning
* model evaluation tracking

---

# Security Standards

* JWT authentication
* rate limiting
* DDoS protection
* secure API gateways
* encrypted secrets
* role-based access control

---

# Data Sources

## Potential Providers

* API-Football
* SportMonks
* Football-Data.org
* StatsBomb
* Opta (future)

---

# Future Expansion

## Potential Future Modules

* fantasy football intelligence
* player scouting
* recruitment analytics
* football media APIs
* tactical simulators
* live probability engine
* AI-generated match reports

---

# Coding Standards

## Frontend

* strict TypeScript
* reusable components
* server components where possible
* accessibility-first

---

## Backend

* modular NestJS architecture
* DTO validation
* service abstraction
* repository pattern

---

## AI Service

* reproducible training
* dataset versioning
* feature engineering pipelines
* explainability outputs

---

# Git Workflow

## Branch Naming

```txt
feature/
fix/
refactor/
hotfix/
```

---

## Commit Convention

```txt
feat:
fix:
refactor:
docs:
test:
```

---

# CI/CD

## Required Checks

* linting
* type safety
* tests
* build verification

---

# Testing Strategy

## Frontend

* Playwright
* Jest

## Backend

* Jest
* Supertest

## AI

* evaluation metrics
* prediction drift monitoring

---

# Non-Negotiable Rules

## Never

* fake prediction accuracy
* display “guaranteed wins”
* fabricate statistics
* manipulate historical performance

## Always

* prioritize explainability
* prioritize transparency
* prioritize statistical integrity

---

# Mission Statement

InsightXI transforms football data into intelligent, explainable, and actionable football insights powered by modern analytics and AI.
