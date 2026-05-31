"""Runtime configuration for the Adaptive Intelligence Engine.

Every knob is read from the environment *at call time* (not import time) so the
behaviour can be toggled per-request in tests and per-deployment in ops without
reimporting modules. Defaults encode the "conservative & explainable" posture:
the engine is OFF unless explicitly enabled, and once on it only adapts a bucket
after it has accumulated enough resolved evidence.
"""
from __future__ import annotations

import os
from pathlib import Path

from app.models.ml_ensemble import MODELS_DIR


def _bool(name: str, default: bool) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _float(name: str, default: float) -> float:
    try:
        return float(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


def _int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


def adaptive_enabled() -> bool:
    """Master switch. When False the service behaves exactly like the static blend."""
    return _bool("ADAPTIVE_ENABLED", False)


def calibration_enabled() -> bool:
    return _bool("ADAPTIVE_CALIBRATION", True)


def min_samples() -> int:
    """Resolved predictions required in a bucket before any adaptation applies."""
    return max(1, _int("ADAPTIVE_MIN_SAMPLES", 50))


def weight_drift_cap() -> float:
    """Max absolute deviation of any model weight from its static baseline."""
    return _float("ADAPTIVE_WEIGHT_DRIFT_CAP", 0.20)


def weight_step() -> float:
    """EMA step for weight updates across recompute cycles (0..1; smaller = slower)."""
    return min(1.0, max(0.0, _float("ADAPTIVE_WEIGHT_STEP", 0.30)))


def recency_halflife_days() -> float:
    """Exponential recency half-life for weighting resolved evidence."""
    return max(1.0, _float("ADAPTIVE_RECENCY_HALFLIFE_DAYS", 180.0))


def retention_seasons() -> int:
    return max(1, _int("EXPERIENCE_RETENTION_SEASONS", 3))


def experience_path() -> Path:
    override = os.environ.get("EXPERIENCE_PATH")
    return Path(override) if override else MODELS_DIR / "experience.jsonl"


def adaptive_state_path() -> Path:
    override = os.environ.get("ADAPTIVE_STATE_PATH")
    return Path(override) if override else MODELS_DIR / "adaptive_state.json"
