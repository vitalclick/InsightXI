# Deployment

InsightXI is three deployable services hosted in a single **Railway** project
(web + API + AI) — one region, one dashboard, one bill. Postgres and Redis are
added inside the same project when you move past mock data.

> This runbook reflects an **actual** Railway deployment, including the gotchas
> that bit us. Read the "Gotchas" table before you start — it will save you the
> rounds of failed deploys we went through.

## Architecture (as deployed)

```
   Internet ──► web (Next.js, public domain)
                  │  NEXT_PUBLIC_API_URL  (baked at build time)
                  ▼
   Internet ──► api (NestJS, public domain)
                  │  AI_SERVICE_URL
                  ▼
                ai (FastAPI, public domain)

   (Phase B)  Postgres + Redis  ◄── api
```

Each service deploys from its in-repo `railway.json` (Dockerfile builder +
`/health` check). The web→api call is from the visitor's browser, so the API
needs a public domain. The api→ai call currently uses the AI service's **public
domain** too (see the IPv6 gotcha below) — moving it to private networking is a
future optimization, not a requirement.

## Per-service Railway settings (IMPORTANT — they differ)

The three Dockerfiles do **not** share the same build context, so the Root
Directory differs per service. Getting this wrong = instant build failure.

| Service | Root Directory | Config-as-code path | Public domain | Key vars |
| --- | --- | --- | --- | --- |
| **api** | `/` (repo root) | `apps/api/railway.json` | yes | `DATA_BACKEND=memory`, `JWT_SECRET`, `AI_SERVICE_URL` |
| **ai**  | `apps/ai-service` | `railway.json` (relative to that root) | yes | `PORT=8000` |
| **web** | `/` (repo root) | `apps/web/railway.json` | yes | build arg `NEXT_PUBLIC_API_URL` |

Why `ai` is the odd one: the API and web Dockerfiles are pnpm-workspace builds
that `COPY pnpm-lock.yaml` etc. from the repo root, so their context must be `/`.
The AI Dockerfile only copies `requirements.txt` and `app/`, so its context is
`apps/ai-service` (matching `render.yaml`'s `dockerContext` and compose's
`context:`).

## Gotchas (every one of these cost a failed deploy)

| Symptom | Cause | Fix |
| --- | --- | --- |
| API build OK, **healthcheck fails** | App listened on hardcoded port; Railway injects its own `$PORT` and probes that | App now prefers `process.env.PORT`; bind `0.0.0.0`. (Fixed in code.) |
| AI **build fails instantly** ("Failed to build an image") | Root Directory `/` but the AI Dockerfile expects context `apps/ai-service` | Set the `ai` service Root Directory to `apps/ai-service`, config to `railway.json` |
| AI build OK, **healthcheck fails** | `railway.json` `startCommand` `--port $PORT` is **not** shell-expanded → uvicorn got the literal string `"$PORT"` | Removed the `startCommand` override; Dockerfile `CMD` uses shell form `--port ${PORT:-8000}` |
| web **502 "Application failed to respond"** | Next standalone server bound to `localhost`; Railway edge can't reach it | `ENV HOSTNAME=0.0.0.0` in the Dockerfile (fixed) |
| web **502** even though logs say "Ready" | Generated **domain target port** didn't match the port the app logs (Railway sets `PORT=8080`, app obeys it) | Set the domain's target port to whatever the deploy log prints (e.g. `8080`), not a hardcoded 3000 |
| "**Match intelligence unavailable**" (api→ai `fetch failed`) | `ai.railway.internal` private networking is **IPv6-only**; Node `fetch` to the IPv4 bind/host failed | Use the AI's **public** URL for `AI_SERVICE_URL` (see below). AI Dockerfile also binds `--host ::` for when private networking is revisited. |

## Phase A — test on the free tier ($0)

The app runs with **no database and no Redis**: football reads come from an
in-memory seed and the AI service lazy-loads its ML libs, so all three
containers fit the free tier (1 vCPU / 0.5 GB).

Deploy order: **api → ai → web** (web needs the API's public domain at build time).

### 1. api
- Root Directory `/`, config `apps/api/railway.json`, rename service to `api`.
- Networking → **Generate Domain** (note the `https://…-api-….up.railway.app`).
- Variables:
  - `DATA_BACKEND=memory`
  - `JWT_SECRET` = `openssl rand -hex 32`
  - `AI_SERVICE_URL` = the AI public URL (set after step 2)
  - leave `FOOTBALL_API_KEY` empty (uses deterministic mock data)
  - delete the placeholder `DATABASE_URL` / `REDIS_URL` if Railway suggested them
- Verify: open `<api-domain>/health` → `{"status":"ok"}`, and
  `<api-domain>/matches/fixtures` → JSON array of fixtures.

### 2. ai
- Root Directory `apps/ai-service`, config `railway.json`, rename to `ai`.
- Variables: `PORT=8000`.
- Networking → **Generate Domain**, target port **8000**.
- Verify: `<ai-domain>/health` → `{"service":"insightxi-ai","status":"ok","model_backend":"analytical"}`.
- Back on **api**, set `AI_SERVICE_URL=https://<ai-domain>` (https, **no port,
  no trailing slash** — the client appends `/predict`). Saving restarts the API.

### 3. web
- Root Directory `/`, config `apps/web/railway.json`, rename to `web`.
- Variables (set **before** the first build — `NEXT_PUBLIC_*` is baked into the
  client bundle, so a change requires a **rebuild**, not a restart):
  - `NEXT_PUBLIC_API_URL` = `https://<api-domain>` (https, no trailing slash)
- Networking → **Generate Domain**. Set the target port to the value the deploy
  log prints (Railway's injected `PORT`, typically `8080`).
- Verify: open the web domain → dashboard loads fixtures; open a match → the
  probability ring, markets and "Why this prediction" render.

## Phase B — enable persistence (when you outgrow mock data)

Add Postgres and Redis to the project, apply the schema once
(`psql "$DATABASE_URL" -f apps/api/src/db/schema.sql`), then on `api` set:
`DATA_BACKEND=postgres`, `DATABASE_URL`, `ENABLE_QUEUES=true`, `REDIS_URL`, and
(for live data) `FOOTBALL_API_KEY`, `FOOTBALL_LEAGUE_IDS`, `FOOTBALL_SEASON`.
Trigger the first load with `POST /ingestion/run` (premium JWT) or let the
scheduled BullMQ refresh run. Ingestion upserts are batched (one statement per
table), so a refresh is a couple of round trips even against managed Postgres.

> **Note on live football data:** the boot path currently has no fallback if the
> provider errors at startup — and API-Football's free tier often restricts the
> current season. Harden the provider boot (catch → fall back to mock) before
> setting `FOOTBALL_API_KEY` in production.

> **Note on the trained model:** production reports `model_backend: analytical`
> because the trained `models/*.joblib` artifacts are not baked into the image.
> To serve the XGBoost ensemble, bake the artifacts in (or train on boot and
> mount a volume); otherwise the analytical Poisson+Elo blend is served.

## Continuous delivery (GitHub Actions → Railway)

`.github/workflows/deploy.yml` deploys on a green CI run on `main` (or manual
`workflow_dispatch`). It is a no-op until you add the secrets, so it is safe to
keep in the repo.

| Secret | Value |
| --- | --- |
| `RAILWAY_TOKEN` | Project token (Railway → Project → Settings → Tokens) |
| `RAILWAY_SERVICE_API` | the `api` service name/id |
| `RAILWAY_SERVICE_AI` | the `ai` service name/id |
| `RAILWAY_SERVICE_WEB` | the `web` service name/id |

Alternatively (what we used), connect the GitHub repo in the Railway dashboard
for push-to-deploy — each service rebuilds on a push to `main`.

## Security follow-ups before a real launch

- **CORS:** the API uses `enableCors({ origin: true })` (reflects any origin).
  Restrict it to the web domain.
- **AI service exposure:** the AI service has a public domain so the API can
  reach it. Lock it down (private networking, or an auth header) before launch.

---

## Local full stack (Docker)

```bash
docker compose up --build
# web  http://localhost:3000
# api  http://localhost:4000   (DATA_BACKEND=postgres, schema auto-applied)
# ai   http://localhost:8000
```

Compose wires Postgres (schema auto-loaded from `apps/api/src/db/schema.sql`),
Redis, and all three apps in the production topology.

## Alternative hosts

- **Vercel (web):** an alternative host for the frontend — not used (the web
  service runs on Railway). `apps/web/vercel.json` remains as a starting point
  if you ever move the frontend there.
- **Render (api + ai):** `render.yaml` is a Blueprint; set the `sync: false`
  secrets in the dashboard. Note `dockerContext` already encodes the per-service
  build-context difference described above.
- **Neon (Postgres):** create a project, copy the pooled connection string,
  apply `apps/api/src/db/schema.sql` once.

All services degrade gracefully when config is absent:

| Service | Without config | With config |
| --- | --- | --- |
| API data | in-memory seed (`DATA_BACKEND=memory`) | Postgres (`DATA_BACKEND=postgres`) |
| Football data | deterministic mock | API-Football (`FOOTBALL_API_KEY`) |
| AI model | analytical Poisson+Elo | trained ensemble (artifacts present) |
| Queues | disabled | BullMQ (`ENABLE_QUEUES=true` + `REDIS_URL`) |

## CI & E2E

`.github/workflows/ci.yml` runs typecheck/test/build for all three services
plus a Playwright E2E job on every PR.

```bash
pnpm exec playwright install chromium   # one-time browser download
pnpm test:e2e
pnpm exec tsc --noEmit -p tsconfig.e2e.json   # typecheck specs without running
```

The browser binary is fetched from Playwright's CDN, which some sandboxes
block — run E2E locally or in CI (the `e2e` job installs the browser).
