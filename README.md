# InsightXI

**True Football Intelligence Platform** — an AI-powered football analytics platform.
This is **not** a gambling/betting platform; all outputs are probabilistic and explainable.

See [`CLAUDE.md`](./CLAUDE.md) for the full product vision, architecture, stack
decisions, setup commands, and MVP phasing.

## Monorepo layout

```txt
apps/
  web/         Next.js + React + TypeScript + Tailwind + Zustand + TanStack Query
  api/         NestJS + PostgreSQL (Neon) + Redis + BullMQ + Socket.IO
  ai-service/  Python + FastAPI + scikit-learn + XGBoost
packages/      shared TypeScript packages (types, config) — added as needed
```

## Quick start

```bash
# 1. Install JS deps (pnpm workspace)
pnpm install

# 2. Configure environment
cp .env.example .env   # then fill in values

# 3. Run everything in dev
pnpm dev               # web + api in parallel
pnpm dev:ai            # FastAPI AI service (separate, Python)
```

Full command reference lives in `CLAUDE.md` → **Setup, Commands & MVP Phasing**.

## Environment variables

[`.env.example`](./.env.example) is the full template (copy it to `.env`).
The operationally important variables are summarised below; everything works
out of the box with the defaults (deterministic seed data, queues off, adaptive
engine off). **Never commit a real `.env`.**

### Core / data

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATA_BACKEND` | `memory` | `memory` (deterministic seed) or `postgres`. |
| `DATABASE_URL` | — | Neon/Postgres connection (required when `DATA_BACKEND=postgres`). |

### Background jobs (BullMQ + Redis)

| Variable | Default | Purpose |
| --- | --- | --- |
| `ENABLE_QUEUES` | `false` | **Set `true`** to run BullMQ jobs: hourly data refresh **+ adaptive reconcile/recompute**, and the daily retrain. Requires a reachable `REDIS_URL`; otherwise the API boots without Redis and jobs stay disabled. |
| `REDIS_URL` | `redis://localhost:6379` | Redis for BullMQ + cache. |

### API / auth

| Variable | Default | Purpose |
| --- | --- | --- |
| `API_PORT` | `4000` | NestJS port. |
| `JWT_SECRET` | — | JWT signing secret (change in production). |
| `JWT_EXPIRES_IN` | `7d` | Access-token lifetime. |

### AI service

| Variable | Default | Purpose |
| --- | --- | --- |
| `AI_SERVICE_URL` | `http://localhost:8000` | Base URL the API uses to reach the FastAPI service. |
| `AI_SERVICE_PORT` | `8000` | FastAPI port. |
| `MODELS_DIR` | `apps/ai-service/models` | Where model + adaptive artifacts are read/written. |

### Adaptive Intelligence Engine

OFF by default → the AI service behaves exactly like the static Poisson + Elo +
ML blend. See [`docs/adaptive-intelligence-engine.md`](./docs/adaptive-intelligence-engine.md).

| Variable | Default | Purpose |
| --- | --- | --- |
| `ADAPTIVE_ENABLED` | `false` | Master switch for the self-improving engine. |
| `ADAPTIVE_CALIBRATION` | `true` | Per-league confidence calibration (temperature scaling). |
| `ADAPTIVE_MIN_SAMPLES` | `50` | Resolved predictions a bucket needs before it adapts. |
| `ADAPTIVE_WEIGHT_DRIFT_CAP` | `0.20` | Max deviation of any model weight from its baseline. |
| `ADAPTIVE_WEIGHT_STEP` | `0.30` | EMA step for weight updates across recompute cycles. |
| `ADAPTIVE_RECENCY_HALFLIFE_DAYS` | `180` | Recency half-life for weighting evidence. |
| `EXPERIENCE_RETENTION_SEASONS` | `3` | Experience retention window before rollup. |

> To run the **full continuous-learning loop**, set both `ENABLE_QUEUES=true`
> (so the jobs reconcile outcomes + recompute) and `ADAPTIVE_ENABLED=true` (so
> the AI service learns and applies the adjustments).

### Football data provider

| Variable | Default | Purpose |
| --- | --- | --- |
| `FOOTBALL_API_KEY` | — | When set, use live API-Football; otherwise the deterministic mock seed. |
| `FOOTBALL_LEAGUE_IDS` | `39,140` | Comma-separated API-Football league ids (EPL, La Liga). |
| `FOOTBALL_SEASON` | current year | Season start year (e.g. `2025` → `2025/26`). |

### Web

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | API base URL exposed to the browser. |

Auth (`GOOGLE_CLIENT_ID`, `APPLE_CLIENT_ID`) and billing (PayPal / Paystack /
Flutterwave) keys are documented in `.env.example`; leave them blank to run those
flows in offline sandbox mode.

## Design docs

* [`docs/adaptive-intelligence-engine.md`](./docs/adaptive-intelligence-engine.md)
  — architecture & phased plan for the continuously self-improving
  **Adaptive Intelligence Engine** (Experience Memory, Self-Evaluation,
  Dynamic Weighting, Confidence Calibration, League Personality).
