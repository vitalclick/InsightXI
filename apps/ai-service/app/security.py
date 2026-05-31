"""Service-to-service authentication for the AI service.

When ``AI_SERVICE_TOKEN`` is set, every protected endpoint requires a matching
``x-internal-key`` header (the NestJS API sends it). When it is unset the
service runs open — the offline/dev default — so nothing changes for local use.
Health stays public so platform liveness probes keep working.
"""
from __future__ import annotations

import hmac
import os

from fastapi import Header, HTTPException, status


def require_internal_key(x_internal_key: str | None = Header(default=None)) -> None:
    """FastAPI dependency: enforce the shared secret when one is configured."""
    expected = os.getenv("AI_SERVICE_TOKEN")
    if not expected:
        return  # Sandbox / local: no auth required.
    provided = x_internal_key or ""
    # Constant-time comparison to avoid leaking the secret via timing.
    if not hmac.compare_digest(provided, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing internal service key",
        )
