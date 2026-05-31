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

> **Live football data:** the provider boot is now resilient — if API-Football
> errors or returns nothing (its free tier often restricts the current season),
> the API transparently falls back to the deterministic seed provider instead
> of crashing. Set `FOOTBALL_API_KEY` (+ `FOOTBALL_LEAGUE_IDS`, `FOOTBALL_SEASON`)
> to go live; the seed remains the safety net.

> **Trained model:** the AI image now bakes the trained ensemble at build time,
> so production reports `model_backend: ensemble` (calibrated XGBoost + LogReg
> blend). Build with `--build-arg TRAIN_ON_BUILD=false` to ship the analytical
> Poisson+Elo blend instead.

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

## Security (configured at launch)

These are now enforced in code and driven by env vars — set them in production:

- **CORS:** restricted to `CORS_ORIGINS` (comma-separated) or `WEB_APP_URL`.
  The API **refuses to boot in production** without an origin allow-list (and
  with a default `JWT_SECRET`). Locally, a blank list reflects any origin.
- **AI service exposure:** set `AI_SERVICE_TOKEN` on both the API and AI service.
  The AI service then rejects any request without a matching `x-internal-key`
  header (health stays public for liveness probes). Combine with private
  networking where available.
- **Rate limiting:** a built-in IP fixed-window limiter is on by default
  (`RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS`); set `RATE_LIMIT_ENABLED=false` if
  a gateway/Cloudflare already throttles.
- **Security headers:** hardened headers (CSP, X-Frame-Options DENY, nosniff,
  HSTS in production) are emitted on every response; `X-Powered-By` is removed.
- **Secrets:** set a strong unique `JWT_SECRET`. Access tokens are short-lived
  with refresh tokens (`JWT_REFRESH_EXPIRES_IN`).

### Email & errors

- **Transactional email:** set `RESEND_API_KEY` (+ `EMAIL_FROM`) to deliver
  verification, password-reset, and payment-receipt emails. Unset = sandbox
  (logged, not sent).
- **Error forwarding:** set `ERROR_WEBHOOK_URL` to forward 5xx errors to a
  Slack/Discord/custom collector.

### Legal (required before taking live payments)

The web app serves `/privacy` and `/terms`. Payment providers (PayPal,
Paystack, Flutterwave) require reachable Privacy + Terms URLs to approve a live
account — make sure `NEXT_PUBLIC_SITE_URL` is set so they resolve on your domain.

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
