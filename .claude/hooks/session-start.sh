#!/bin/bash
# InsightXI — SessionStart hook for Claude Code on the web.
# Installs the JS workspace (web + api) and the Python AI-service deps so
# tests, linters and the app all work in a fresh remote container. Idempotent
# and non-interactive; the container is cached after this completes, so the
# heavy installs only pay off once per environment.
set -euo pipefail

# Only run in remote (Claude Code on the web) containers — local dev manages
# its own environment.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$ROOT"

log() { echo "[session-start] $*" >&2; }

# 1. JS workspace (web + api) — installs from the npm registry (allowlisted).
log "Installing pnpm workspace dependencies…"
corepack enable >/dev/null 2>&1 || true
pnpm install --prefer-offline

# 2. AI service (Python) — installs from PyPI (allowlisted).
AI_DIR="$ROOT/apps/ai-service"
if [ -f "$AI_DIR/pyproject.toml" ]; then
  if [ ! -x "$AI_DIR/.venv/bin/python" ]; then
    log "Creating AI service virtualenv…"
    python3 -m venv "$AI_DIR/.venv"
  fi
  log "Installing AI service dependencies (this can take a few minutes the first time)…"
  "$AI_DIR/.venv/bin/python" -m pip install --quiet --upgrade pip
  (cd "$AI_DIR" && ./.venv/bin/python -m pip install --quiet -e ".[dev]")

  # Expose the venv tools (pytest, ruff, uvicorn) for the rest of the session.
  if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
    echo "export PATH=\"$AI_DIR/.venv/bin:\$PATH\"" >> "$CLAUDE_ENV_FILE"
  fi
fi

log "Setup complete."
