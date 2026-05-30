"""Loads the persisted training report + drift reference for the API.

Lazy and defensive: when no trained artifacts exist (fresh checkout), the
endpoints report status "unavailable" rather than erroring — consistent with
the analytical-fallback philosophy of the inference path.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

import numpy as np

from app.evaluation.drift import feature_drift
from app.models.ml_ensemble import MODELS_DIR

METRICS_PATH = MODELS_DIR / "metrics.json"
DRIFT_REF_PATH = MODELS_DIR / "drift_reference.npz"


def load_metrics() -> Optional[dict]:
    if not METRICS_PATH.exists():
        return None
    try:
        return json.loads(Path(METRICS_PATH).read_text())
    except Exception:  # pragma: no cover - corrupt file
        return None


def load_reference() -> Optional[tuple[np.ndarray, list[str]]]:
    if not DRIFT_REF_PATH.exists():
        return None
    try:
        data = np.load(DRIFT_REF_PATH, allow_pickle=True)
        return data["features"], list(data["names"])
    except Exception:  # pragma: no cover - corrupt file
        return None


def drift_against_reference(current_features: list[list[float]]) -> dict:
    """Compute feature drift of a batch of recent feature vectors vs training.

    Returns {"status": "unavailable"} when no drift reference is stored yet.
    """
    ref = load_reference()
    if ref is None:
        return {"status": "unavailable", "reason": "no drift reference; train first"}
    reference, names = ref
    current = np.asarray(current_features, dtype=float)
    if current.ndim != 2 or current.shape[1] != reference.shape[1]:
        return {
            "status": "error",
            "reason": f"expected {reference.shape[1]} features per row",
        }
    return feature_drift(reference, current, names)
