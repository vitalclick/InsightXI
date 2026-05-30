"""Prediction & feature drift monitoring.

Uses the Population Stability Index (PSI), the standard metric for detecting
distribution shift between a reference (training) population and a recent
(production) one. Rule of thumb:
  PSI < 0.1  -> no significant shift
  0.1–0.25   -> moderate shift (investigate)
  > 0.25     -> major shift (retrain)
"""
from __future__ import annotations

import numpy as np

NO_SHIFT = 0.1
MAJOR_SHIFT = 0.25


def psi(
    reference: np.ndarray,
    current: np.ndarray,
    n_bins: int = 10,
    eps: float = 1e-6,
) -> float:
    """Population Stability Index between two 1-D samples.

    Bins are quantile edges of the reference distribution, so it works for
    arbitrary continuous features and predicted-probability streams alike.
    """
    reference = np.asarray(reference, dtype=float)
    current = np.asarray(current, dtype=float)
    if reference.size == 0 or current.size == 0:
        return 0.0

    quantiles = np.linspace(0, 100, n_bins + 1)
    edges = np.unique(np.percentile(reference, quantiles))
    if edges.size < 2:
        return 0.0
    edges[0], edges[-1] = -np.inf, np.inf

    ref_counts, _ = np.histogram(reference, bins=edges)
    cur_counts, _ = np.histogram(current, bins=edges)
    ref_pct = ref_counts / max(ref_counts.sum(), 1)
    cur_pct = cur_counts / max(cur_counts.sum(), 1)

    ref_pct = np.clip(ref_pct, eps, None)
    cur_pct = np.clip(cur_pct, eps, None)
    return float(np.sum((cur_pct - ref_pct) * np.log(cur_pct / ref_pct)))


def classify_psi(value: float) -> str:
    if value < NO_SHIFT:
        return "stable"
    if value < MAJOR_SHIFT:
        return "moderate"
    return "major"


def feature_drift(
    reference: np.ndarray,
    current: np.ndarray,
    feature_names: list[str],
) -> dict:
    """Per-feature PSI report plus an overall verdict.

    reference/current are 2-D arrays (rows = samples, cols = features).
    """
    reference = np.asarray(reference, dtype=float)
    current = np.asarray(current, dtype=float)
    per_feature = {}
    worst = 0.0
    for i, name in enumerate(feature_names):
        value = psi(reference[:, i], current[:, i])
        per_feature[name] = {"psi": round(value, 4), "status": classify_psi(value)}
        worst = max(worst, value)
    return {
        "features": per_feature,
        "max_psi": round(worst, 4),
        "status": classify_psi(worst),
        "retrain_recommended": worst >= MAJOR_SHIFT,
    }
