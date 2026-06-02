# scripts

Helper scripts for InsightXI development & verification.

## Reproducible environment (Claude Code on the web)

Dependencies are installed automatically by the **SessionStart hook**
(`.claude/hooks/session-start.sh`, registered in `.claude/settings.json`).
On every remote session it runs:

- `pnpm install` — the JS workspace (web + api), from the npm registry
- a Python venv at `apps/ai-service/.venv` + `pip install -e ".[dev]"`, from PyPI
- adds the venv's `bin` to `PATH` so `pytest` / `ruff` / `uvicorn` are available

It is idempotent and the container is cached after it completes, so the heavy
installs only run once per environment. It is gated to remote containers
(`CLAUDE_CODE_REMOTE=true`); local dev manages its own environment.

> The Playwright browser CDN is **not** in the remote network allowlist, so
> `npx playwright install` is blocked. The base image already ships Chromium
> under `/opt/pw-browsers`, which `screenshots.mjs` uses directly. To run
> Playwright's own download instead, add `cdn.playwright.dev` to the
> environment's network allowlist.

## `screenshots.mjs` — capture the mobile app (`/m`)

Drives a real browser over the running app and writes PNGs to `.shots/`
(gitignored). Bring the stack up first:

```bash
# 1. API (seed data) on :4000
pnpm --filter @insightxi/api dev &

# 2. AI service (predictions) on :8000
(cd apps/ai-service && ./.venv/bin/uvicorn app.main:app --port 8000 &)

# 3. Web on :3200
(cd apps/web && pnpm build && pnpm start -p 3200 &)

# 4. Screenshots → .shots/
node scripts/screenshots.mjs
```

Env overrides: `BASE_URL` (default `http://localhost:3200/m`), `OUT`
(default `.shots`), `PLAYWRIGHT_EXECUTABLE_PATH` (override the browser binary).
