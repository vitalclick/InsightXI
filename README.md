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

## Design docs

* [`docs/adaptive-intelligence-engine.md`](./docs/adaptive-intelligence-engine.md)
  — architecture & phased plan for the continuously self-improving
  **Adaptive Intelligence Engine** (Experience Memory, Self-Evaluation,
  Dynamic Weighting, Confidence Calibration, League Personality).
