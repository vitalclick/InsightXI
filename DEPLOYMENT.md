# Deployment

InsightXI is three deployable services. The chosen hosting target is a single
**Railway** project holding all three (web, API, AI) — one region, one
dashboard, one bill, and no cross-region latency between them. Managed Postgres
and Redis are added inside the same project when you move past mock data.

## Railway architecture

```
                 ┌──────────────────────────────────────────────┐
                 │  Railway project (one region)                 │
   Internet ───► │   web (Next.js)  ──NEXT_PUBLIC_API_URL──►  api │
                 │                                            │   │
                 │                      AI_SERVICE_URL  ──►   ai   │
                 │                                            │   │
                 │   (later)  Postgres ◄── api ──► Redis (queues) │
                 └──────────────────────────────────────────────┘
```

Each service deploys from its in-repo `railway.json` (Dockerfile builder +
`/health` check). Internal calls (web→api, api→ai) use Railway's private
networking, so they never leave the project.

### Phase A — test on the free tier ($0)

The app is built to run with **no database and no Redis** for testing: football
reads are served from an in-memory cache and the AI service lazy-loads its ML
libraries, so all three containers fit the free tier (1 vCPU / 0.5 GB each).

Set these env vars per service in Railway:

| Service | Env |
| --- | --- |
| `api`  | `DATA_BACKEND=memory`, `ENABLE_QUEUES=false`, `JWT_SECRET=<random>`, `AI_SERVICE_URL=http://ai.railway.internal:${AI_PORT}` |
| `ai`   | `PORT=8000` (pin it so the internal URL is stable) |
| `web`  | build arg `NEXT_PUBLIC_API_URL=https://<api-public-domain>` |

Notes:
- **AI internal port:** the AI service binds to Railway's `$PORT`. Pin it
  (`PORT=8000` on the `ai` service) and point the API at the same value —
  `AI_SERVICE_URL=http://ai.railway.internal:8000`. If you leave `PORT`
  unpinned, set `AI_SERVICE_URL` to whatever port Railway assigned the `ai`
  service (shown under its Networking settings); the two must match.
- `NEXT_PUBLIC_API_URL` is **baked at build time** (it ships in the client
  bundle), so it must be the API's *public* domain and a rebuild is needed if it
  changes. The web→api call from the browser is public; api→ai is private.
- Generate `JWT_SECRET` with `openssl rand -hex 32`.

### Phase B — enable persistence (when you outgrow mock data)

Add Postgres and Redis to the project, apply the schema once
(`psql "$DATABASE_URL" -f apps/api/src/db/schema.sql`), then set on `api`:
`DATA_BACKEND=postgres`, `DATABASE_URL=...`, `ENABLE_QUEUES=true`,
`REDIS_URL=...`, and (for live data) `FOOTBALL_API_KEY`,
`FOOTBALL_LEAGUE_IDS`, `FOOTBALL_SEASON`. Trigger the first load with
`POST /ingestion/run` (premium JWT) or let the scheduled refresh job run.
Ingestion upserts are batched, so a refresh is a couple of round trips even
against managed Postgres.

## Continuous delivery (GitHub Actions → Railway)

`.github/workflows/deploy.yml` deploys on a green CI run on `main` (or manual
`workflow_dispatch`). It is a no-op until you add the secrets, so it is safe to
merge first.

Required repository secrets (**Settings → Secrets and variables → Actions**):

| Secret | Value |
| --- | --- |
| `RAILWAY_TOKEN` | Project token (Railway → Project → Settings → Tokens) |
| `RAILWAY_SERVICE_API` | the `api` service name/id |
| `RAILWAY_SERVICE_AI` | the `ai` service name/id |
| `RAILWAY_SERVICE_WEB` | the `web` service name/id |

Alternatively, connect the GitHub repo in the Railway dashboard for
push-to-deploy and skip the workflow — set each service's **Root Directory** to
the repo root and let it read the per-service `railway.json`.

---

> The host-agnostic notes below (Docker, Vercel, Render, Neon) remain valid for
> alternative deployments.

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
