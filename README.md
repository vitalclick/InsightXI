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

| Variable(s) | Used by | Notes |
| --- | --- | --- |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | API | Auth token signing |
| `DATA_BACKEND`, `DATABASE_URL` | API | `memory` (default) or `postgres` (Neon) |
| `REDIS_URL`, `ENABLE_QUEUES` | API | BullMQ queues (optional) |
| `FOOTBALL_API_KEY`, `FOOTBALL_*` | API | Live provider; mock seed used if unset |
| `GOOGLE_CLIENT_ID` | API | Verifies Google sign-in tokens |
| `APPLE_CLIENT_ID` | API | Verifies Apple sign-in tokens |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENV`, `PAYPAL_WEBHOOK_ID` | API | PayPal (Orders v2) |
| `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` | API | Paystack |
| `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_PUBLIC_KEY`, `FLUTTERWAVE_WEBHOOK_HASH` | API | Flutterwave |
| `WEB_APP_URL`, `PAYMENTS_CALLBACK_URL` | API | Where hosted checkouts redirect back |
| `CURRENCY_RATES_JSON` | API | Optional FX overrides for price display |
| `GEO_IP_LOOKUP_URL` | API | IP→country lookup for currency auto-detect (see below) |
| `NEXT_PUBLIC_API_URL` | Web | Backend base URL |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Web | Must match the API's `GOOGLE_CLIENT_ID` |
| `NEXT_PUBLIC_APPLE_CLIENT_ID` | Web | Must match the API's `APPLE_CLIENT_ID` |

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

