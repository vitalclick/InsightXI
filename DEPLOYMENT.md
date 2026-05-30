# Deployment

InsightXI is three deployable services. Recommended hosts (per the locked
stack): **web → Vercel**, **API → Railway**, **AI → Railway** (or Render),
**database → Neon**, **Redis → Railway/Upstash**.

All services run offline-friendly defaults, so a missing key degrades
gracefully rather than crashing:

| Service | Without config | With config |
| --- | --- | --- |
| API data | in-memory seed (`DATA_BACKEND=memory`) | Postgres (`DATA_BACKEND=postgres`) |
| Football data | deterministic mock | API-Football (`FOOTBALL_API_KEY`) |
| AI model | analytical Poisson+Elo | trained ensemble (after a training run) |
| Queues | disabled | BullMQ (`ENABLE_QUEUES=true` + `REDIS_URL`) |

## Local full stack (Docker)

```bash
docker compose up --build
# web  http://localhost:3000
# api  http://localhost:4000   (DATA_BACKEND=postgres, schema auto-applied)
# ai   http://localhost:8000
```

Compose wires Postgres (schema auto-loaded from `apps/api/src/db/schema.sql`),
Redis, and all three apps in the production topology.

## Production

### Database (Neon)
1. Create a Neon project; copy the pooled connection string.
2. Apply the schema once: `psql "$DATABASE_URL" -f apps/api/src/db/schema.sql`.

### API (Railway)
- Deploys from `apps/api/Dockerfile` (config in `apps/api/railway.json`).
- Env: `DATA_BACKEND=postgres`, `DATABASE_URL`, `REDIS_URL`,
  `AI_SERVICE_URL`, `JWT_SECRET`, `FOOTBALL_API_KEY` (optional),
  `ENABLE_QUEUES=true`.
- Health check: `GET /health`.
- After first deploy, trigger ingestion: `POST /ingestion/run` (premium JWT),
  or let the scheduled BullMQ refresh job populate the DB.

### AI service (Railway or Render)
- Deploys from `apps/ai-service/Dockerfile` (`apps/ai-service/railway.json`).
- Health check: `GET /health` (reports `analytical` vs `ensemble`).
- To serve the trained ensemble, run `python -m app.training.train` and make
  `models/` available (mounted volume or a build/init step); otherwise it
  serves the analytical blend.

### Web (Vercel)
- Import the repo; set **Root Directory = `apps/web`** (config in
  `apps/web/vercel.json` handles the monorepo install/build).
- Env: `NEXT_PUBLIC_API_URL` = the deployed API URL. This is baked at build
  time, so redeploy after changing it.

### Render (alternative for API + AI)
`render.yaml` is a Blueprint for the API and AI service; set the `sync: false`
secrets in the dashboard.

## CI

`.github/workflows/ci.yml` runs typecheck/test/build for all three services
plus a Playwright E2E job on every PR. Add a deploy step (Railway/Vercel GitHub
integrations or CLI) once host credentials are configured.

## End-to-end tests (Playwright)

E2E specs live in `e2e/` and run the real web + API together against the
deterministic offline mock backend (reproducible; no API key or DB needed).
Playwright boots both servers itself (`playwright.config.ts` → `webServer`).

```bash
pnpm exec playwright install chromium   # one-time browser download
pnpm test:e2e
pnpm exec tsc --noEmit -p tsconfig.e2e.json   # typecheck specs without running
```

The browser binary is fetched from Playwright's CDN, which some sandboxes
block — run these locally or in CI (the `e2e` job installs the browser).
