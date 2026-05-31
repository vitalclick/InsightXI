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
| `JWT_SECRET` | API | `change-me-in-production` | JWT signing secret (secret) |
| `JWT_EXPIRES_IN` | API | `7d` | Access-token lifetime |

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

**AI service & football data**

| Variable | Used by | Notes |
| --- | --- | --- |
| `AI_SERVICE_URL` | API | Base URL the API calls for predictions (default `http://localhost:8000`) |
| `AI_SERVICE_PORT` | AI | FastAPI port used by the run scripts (default `8000`) |
| `FOOTBALL_API_KEY` | API | API-Football key; blank → deterministic mock seed provider |
| `FOOTBALL_API_BASE_URL` | API | API-Football base URL |
| `FOOTBALL_LEAGUE_IDS` | API | Comma-separated league ids (default `39,140` = EPL, La Liga) |
| `FOOTBALL_SEASON` | API | Season start year, e.g. `2025` → "2025/26" |

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

### Production

- **Backend → Railway:** project → **Variables**. Add all API-side variables.
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

