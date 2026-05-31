"""L5a — Dynamic Weighting Engine.

Replaces the hardcoded ``0.5 ML / 0.3 Poisson / 0.2 Elo`` blend with per-league
weights *learned* from resolved experience, under the conservative contract:

  * weights are non-negative and sum to 1;
  * each weight stays within ``cap`` of its static baseline (bounded adaptation);
  * evidence is recency-weighted (exponential half-life) but never vanishes;
  * the solver is a deterministic grid search over the constrained simplex — no
    gradient infrastructure, fully reproducible.

The solved weights are smoothed (EMA) against the previous state by the caller
(see ``state.recompute``) so the blend tilts, never lurches.
"""
from __future__ import annotations

from datetime import datetime
from typing import Iterable, Optional, Sequence

import numpy as np

from app.memory.schema import ExperienceRecord

# Static baselines (match the legacy hardcoded blend in inference/predictor.py).
BASELINE_ENSEMBLE = {"ml": 0.5, "poisson": 0.3, "elo": 0.2}
BASELINE_ANALYTICAL = {"poisson": 0.6, "elo": 0.4}

_GRID_STEP = 0.05  # simplex resolution for the weight search


def baseline_weights(model_set: Iterable[str]) -> dict[str, float]:
    """Static baseline weights restricted+renormalised to the available models."""
    present = set(model_set)
    table = BASELINE_ENSEMBLE if "ml" in present else BASELINE_ANALYTICAL
    base = {k: v for k, v in table.items() if k in present}
    if not base:  # degenerate (no known models) -> uniform
        return {m: 1.0 / len(present) for m in present} if present else {}
    total = sum(base.values())
    return {k: v / total for k, v in base.items()}


def blend(
    model_probs: dict[str, Sequence[float]], weights: dict[str, float]
) -> tuple[float, float, float]:
    """Weighted, renormalised (home, draw, away) blend over the shared models."""
    h = d = a = 0.0
    for model, w in weights.items():
        p = model_probs.get(model)
        if p is None:
            continue
        h += w * p[0]
        d += w * p[1]
        a += w * p[2]
    total = (h + d + a) or 1.0
    return h / total, d / total, a / total


def _parse_ts(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:  # pragma: no cover - defensive
        return None


def recency_weights(records: Sequence[ExperienceRecord], halflife_days: float) -> np.ndarray:
    """Exponential recency weights in [~0, 1], anchored to the most recent record.

    Anchoring to the dataset's own latest timestamp (not wall-clock) keeps the
    computation deterministic and test-stable. Records without a usable
    timestamp get a neutral weight of 1.0.
    """
    times = [_parse_ts(r.predicted_at) or _parse_ts(r.resolved_at) for r in records]
    valid = [t for t in times if t is not None]
    if not valid:
        return np.ones(len(records), dtype=float)
    anchor = max(valid)
    out = np.ones(len(records), dtype=float)
    for i, t in enumerate(times):
        if t is None:
            continue
        age_days = max(0.0, (anchor - t).total_seconds() / 86400.0)
        out[i] = 0.5 ** (age_days / halflife_days)
    return out


def _simplex_grid(n: int, step: float = _GRID_STEP) -> np.ndarray:
    """All weight vectors over ``n`` models whose entries are multiples of ``step``."""
    steps = int(round(1.0 / step))

    def _compose(remaining: int, slots: int):
        if slots == 1:
            yield [remaining]
            return
        for i in range(remaining + 1):
            for tail in _compose(remaining - i, slots - 1):
                yield [i, *tail]

    grid = np.array(list(_compose(steps, n)), dtype=float) / steps
    return grid


def _stack_probs(
    records: Sequence[ExperienceRecord], models: Sequence[str]
) -> tuple[np.ndarray, np.ndarray]:
    """Return (P, y): P is (n_records, n_models, 3); y is the integer outcomes."""
    P = np.zeros((len(records), len(models), 3), dtype=float)
    y = np.zeros(len(records), dtype=int)
    for i, rec in enumerate(records):
        for j, m in enumerate(models):
            P[i, j] = rec.submodel_probs[m]
        y[i] = int(rec.actual_outcome)
    return P, y


def _weighted_log_loss(
    P: np.ndarray, y: np.ndarray, sample_w: np.ndarray, w: np.ndarray, eps: float = 1e-12
) -> float:
    blended = np.tensordot(P, w, axes=([1], [0]))  # (n_records, 3)
    blended = blended / np.clip(blended.sum(axis=1, keepdims=True), eps, None)
    picked = blended[np.arange(len(y)), y]
    ll = -np.log(np.clip(picked, eps, 1.0))
    return float(np.sum(sample_w * ll) / max(np.sum(sample_w), eps))


def solve_weights(
    records: Sequence[ExperienceRecord],
    models: Sequence[str],
    baseline: dict[str, float],
    cap: float,
    halflife_days: float,
) -> dict[str, float]:
    """Best capped, recency-weighted convex blend by log loss (pre-EMA, raw solve).

    Always feasible: the baseline itself satisfies the cap (zero deviation), so it
    is part of the search space and is returned when nothing beats it.
    """
    models = list(models)
    if not records or len(models) < 2:
        return dict(baseline)

    P, y = _stack_probs(records, models)
    sample_w = recency_weights(records, halflife_days)
    base_vec = np.array([baseline[m] for m in models], dtype=float)

    grid = _simplex_grid(len(models))
    # Keep only candidates within the cap box around the baseline.
    feasible = grid[np.all(np.abs(grid - base_vec) <= cap + 1e-9, axis=1)]
    if feasible.size == 0:  # pragma: no cover - baseline guarantees non-empty
        feasible = base_vec[None, :]

    best_w, best_loss = base_vec, _weighted_log_loss(P, y, sample_w, base_vec)
    for cand in feasible:
        loss = _weighted_log_loss(P, y, sample_w, cand)
        if loss < best_loss - 1e-9:
            best_loss, best_w = loss, cand
    return {m: float(best_w[j]) for j, m in enumerate(models)}


def smooth_and_clip(
    solved: dict[str, float],
    previous: Optional[dict[str, float]],
    baseline: dict[str, float],
    cap: float,
    step: float,
) -> dict[str, float]:
    """EMA-blend ``solved`` toward ``previous``, then re-clip to the cap and renormalise."""
    models = list(solved.keys())
    prev = previous or baseline
    blended = {m: (1.0 - step) * prev.get(m, baseline[m]) + step * solved[m] for m in models}
    # Clip to the cap box around baseline, then renormalise to sum 1.
    clipped = {
        m: min(baseline[m] + cap, max(baseline[m] - cap, max(0.0, blended[m]))) for m in models
    }
    total = sum(clipped.values()) or 1.0
    return {m: clipped[m] / total for m in models}
