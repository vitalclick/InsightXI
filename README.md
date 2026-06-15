# InsightXI

**True Football Intelligence Platform** — an AI-powered football analytics platform.

## Focus — the strongest pick of the day

> The goal of InsightXI is to perform a thorough analysis and identify the
> strongest betting opportunity of the day. Quality always comes before quantity.
> Our focus is not on providing numerous predictions, but on delivering the most
> reliable and high-confidence bet available each day.

Everything in the platform serves that one outcome: the **Pick of the Day** —
the day's single best bet, locked once per day, backed by the full analysis and
settled against the result so the win rate is real. The wider analytics
(fixtures, tactical, historical, live) exist to *find and justify* that one bet
— we deliver the strongest bet of the day, not a flood of tips. Every bet ships
with the reasoning behind it and a genuine, settled track record; we don't fake
results or inflate the win rate, because a verifiable record is what makes the
bet worth backing.

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

All configuration is driven by environment variables. A complete template lives
in [`.env.example`](./.env.example).

### Local development

```bash
cp .env.example .env   # at the repo root, then fill in values
```

The **repo-root `.env`** is the single source of truth in dev — it now feeds
**both** the API (NestJS) and the web app (Next.js), regardless of the process
working directory. It is git-ignored; never commit a real `.env`. Real
environment variables (and `apps/web/.env.local`) always take precedence over
the file.

> `NEXT_PUBLIC_*` values are inlined into the browser bundle at build time —
> only put **publishable** client IDs there, never secret keys.

### Which variable goes where

Every variable from [`.env.example`](./.env.example), grouped by area. **API** =
NestJS backend, **Web** = Next.js frontend, **AI** = FastAPI service. "Secret"
must never be exposed to the browser; `NEXT_PUBLIC_*` are inlined into the
client bundle by design.

**Core / infrastructure**

| Variable | Used by | Default | Notes |
| --- | --- | --- | --- |
| `DATA_BACKEND` | API | `memory` | `memory` (deterministic seed) or `postgres` |
| `DATABASE_URL` | API | — | Neon/Postgres connection; required when `DATA_BACKEND=postgres` (secret) |
| `REDIS_URL` | API | `redis://localhost:6379` | BullMQ queues + cache |
| `ENABLE_QUEUES` | API | unset | Set to enable BullMQ ingestion/retrain jobs (needs Redis) |
| `API_PORT` | API | `4000` | Local HTTP port |
| `PORT` | API | — | Platform-assigned port (Railway/Render); overrides `API_PORT` |
| `HOST` | API | `0.0.0.0` | Listen address. Keep `0.0.0.0` — that's what Railway's IPv4 healthcheck and public edge reach. Only set `::` if the api→ai call must use Railway's IPv6-only `*.railway.internal` private network, and only on a host whose stack supports it (a bare `::` can come up IPv6-only and fail the IPv4 healthcheck) |
| `JWT_SECRET` | API | `change-me-in-production` | JWT signing secret (secret) — **must be changed in production** |
| `JWT_EXPIRES_IN` | API | `7d` | Access-token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | API | `30d` | Refresh-token lifetime (`POST /auth/refresh`) |

**Security hardening**

| Variable | Used by | Default | Notes |
| --- | --- | --- | --- |
| `CORS_ORIGINS` | API | — | Comma-separated allowed **web origin(s)** — the public URL the browser loads the frontend from (e.g. `https://insightxi-web-production.up.railway.app`), **not** the API's own URL. Scheme + host only: `https://`, no trailing slash, no path; matched exactly against the browser `Origin` header. **Required in production** (or `WEB_APP_URL`); blank in dev reflects any origin. Add a custom domain too once you have one: `https://…railway.app,https://app.insightxi.com` |
| `RATE_LIMIT_ENABLED` | API | `true` | IP fixed-window rate limiting; set `false` if a gateway throttles |
| `RATE_LIMIT_MAX` | API | `120` | Max requests per window per IP |
| `RATE_LIMIT_WINDOW_MS` | API | `60000` | Rate-limit window length (ms) |
| `AI_SERVICE_TOKEN` | API + AI | — | Shared secret; AI service requires `x-internal-key` when set |
| `ERROR_WEBHOOK_URL` | API | — | Optional: forward 5xx errors as JSON (Slack/Discord/custom) |

**Transactional email** (blank → sandbox, logged not sent)

| Variable | Used by | Notes |
| --- | --- | --- |
| `RESEND_API_KEY` | API | Resend API key; enables verification / reset / receipt emails |
| `EMAIL_FROM` | API | From header (default `InsightXI <no-reply@insightxi.app>`) |

**Auth — social sign-in** (blank → sandbox/demo mode)

| Variable | Used by | Notes |
| --- | --- | --- |
| `GOOGLE_CLIENT_ID` | API | Google OAuth Web client id(s), comma-separated; verifies ID tokens |
| `APPLE_CLIENT_ID` | API | Apple Services ID authorized for Sign in with Apple |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Web | Public; must match the API's `GOOGLE_CLIENT_ID` |
| `NEXT_PUBLIC_APPLE_CLIENT_ID` | Web | Public; must match the API's `APPLE_CLIENT_ID` |

**Premium billing** (blank gateway keys → sandbox mode)

| Variable | Used by | Notes |
| --- | --- | --- |
| `WEB_APP_URL` | API | Web origin hosted checkouts redirect back to |
| `PAYMENTS_CALLBACK_URL` | API | Optional explicit callback base (defaults to `WEB_APP_URL`) |
| `CURRENCY_RATES_JSON` | API | Optional FX overrides for price display, e.g. `{"NGN":1600}` |
| `GEO_IP_LOOKUP_URL` | API | Optional IP→country lookup for currency auto-detect (see below) |
| `PAYPAL_CLIENT_ID` | API | PayPal client id (publishable; also served to the web app) |
| `PAYPAL_CLIENT_SECRET` | API | PayPal secret |
| `PAYPAL_ENV` | API | `sandbox` (default) or `live` |
| `PAYPAL_WEBHOOK_ID` | API | Verifies PayPal webhook signatures |
| `PAYSTACK_SECRET_KEY` | API | Paystack secret (NGN/GHS/ZAR/KES/USD) |
| `PAYSTACK_PUBLIC_KEY` | API | Publishable key (reserved for future client use) |
| `FLUTTERWAVE_SECRET_KEY` | API | Flutterwave secret |
| `FLUTTERWAVE_PUBLIC_KEY` | API | Publishable key (reserved for future client use) |
| `FLUTTERWAVE_WEBHOOK_HASH` | API | The `verif-hash` secret set on the Flutterwave webhook |

**Web app**

| Variable | Used by | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Web | Backend base URL (default `http://localhost:4000`) |
| `NEXT_PUBLIC_SITE_URL` | Web | Public site origin for `robots.txt` + `sitemap.xml` (default `https://insightxi.app`) |

**AI service & football data**

| Variable | Used by | Notes |
| --- | --- | --- |
| `AI_SERVICE_URL` | API | Base URL the API calls for predictions (default `http://localhost:8000`) |
| `AI_SERVICE_PORT` | AI | FastAPI port used by the run scripts (default `8000`) |
| `FOOTBALL_API_KEY` | API | API-Football key; blank → deterministic mock seed provider |
| `FOOTBALL_API_BASE_URL` | API | API-Football base URL |
| `FOOTBALL_LEAGUE_IDS` | API | Comma-separated league ids (default `39,140` = EPL, La Liga) |
| `FOOTBALL_SEASON` | API | Season start year, e.g. `2025` → "2025/26" |
| `MODELS_DIR` | AI | Where model + adaptive artifacts live (default `apps/ai-service/models`) |
| `ADAPTIVE_*`, `EXPERIENCE_RETENTION_SEASONS` | AI | Adaptive Intelligence Engine — see the dedicated section below |

> **Sandbox by default.** Every payment gateway and both OAuth providers run in
> sandbox/demo mode automatically when their keys are absent, so the full flow
> (sign-in, localized pricing, checkout, premium activation) stays testable
> offline. Adding real keys switches them to live with no code changes.

#### Currency / geolocation

The Premium price is anchored in USD ($2.49/mo) and **localized for display**.
The viewer's country is detected in this order:

1. **Cloudflare `cf-ipcountry`** header — automatic and zero-latency when the
   app is served through Cloudflare (the production setup). **No variable needed.**
2. **`GEO_IP_LOOKUP_URL`** — an IP→country endpoint (`{ip}` is substituted), used
   only when there is no Cloudflare header. Set this if you are **not** behind
   Cloudflare (e.g. local dev or a direct Railway URL), for example
   `https://ipapi.co/{ip}/country/`. Private/localhost IPs are skipped.
3. **Browser locale** hint, then **USD** default.

Regardless of detection, the plan card always shows a **currency selector**, so a
viewer can pick their currency manually. African gateways (Paystack/Flutterwave)
charge in the local currency; PayPal settles in USD.

#### Adaptive Intelligence Engine

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

### Production

- **Backend → Railway:** project → **Variables**. Add all API-side variables.
  In particular set `CORS_ORIGINS` to the **web** service's public URL (copy the
  full generated domain from the web service's *Networking* tab), e.g.
  `https://insightxi-web-production.up.railway.app` — without it the API boots
  but the browser blocks cross-origin requests to it. Leave `HOST` at the
  default `0.0.0.0` (it's what Railway's IPv4 healthcheck reaches); only switch
  to `::` if you move the api→ai call onto the IPv6-only private network.
- **Frontend → Vercel:** project → **Settings → Environment Variables**. Add the
  three `NEXT_PUBLIC_*` variables, then redeploy so they are rebuilt in.
- **Claude Code on the web:** set them in the environment configuration when
  creating/editing the cloud environment — see the
  [docs](https://code.claude.com/docs/en/claude-code-on-the-web).

### Provider-side setup (once keys are added)

1. **Webhooks** — point each provider dashboard at
   `https://<your-api>/payments/webhook/{paypal|paystack|flutterwave}`. For
   Flutterwave, the dashboard's secret hash must equal `FLUTTERWAVE_WEBHOOK_HASH`.
2. **OAuth origins** — add your web origin to the Google OAuth client's
   *Authorized JavaScript origins*, and your domain/return URLs to the Apple
   *Services ID*. The `*_CLIENT_ID` and `NEXT_PUBLIC_*_CLIENT_ID` pairs must match.

## Performance budget (Lighthouse CI)

CI runs Lighthouse against production bundles (`lighthouserc.cjs`). The
`lighthouse` job builds the API + web, boots both via `scripts/lhci-stack.mjs`,
and audits `/`, `/dashboard`, and `/predictions`. The **enforced gate** is the
deterministic JavaScript bundle budget (script ≤ 400 KB); Lighthouse category
scores (performance, a11y, best-practices, SEO) are reported as warnings on the
way to the Lighthouse 90+ target — tighten them to errors once a stable
baseline exists on the deployed site. Reports upload as a CI artifact.

Run it locally (needs Chrome installed):

```bash
pnpm --filter @insightxi/api build
NEXT_DISABLE_STANDALONE=true NEXT_PUBLIC_API_URL=http://localhost:4000 \
  pnpm --filter @insightxi/web build
pnpm dlx @lhci/cli@0.14.x autorun
```

## Design docs

* [`docs/adaptive-intelligence-engine.md`](./docs/adaptive-intelligence-engine.md)
  — architecture & phased plan for the continuously self-improving
  **Adaptive Intelligence Engine** (Experience Memory, Self-Evaluation,
  Dynamic Weighting, Confidence Calibration, League Personality).

