"""L5b — Confidence Calibration Engine.

Learns, per league, how to correct the blend's confidence toward observed
frequencies. We use **temperature scaling** (Guo et al., 2017): a single scalar
``T`` applied as ``p_i ** (1/T)`` then renormalised.

Why temperature scaling rather than isotonic/Platt here:
  * it is multiclass-correct and keeps the 1X2 vector a valid distribution
    (renormalises cleanly, preserves the argmax / top selection);
  * a single monotone parameter that is *identity at T = 1*, so shrinking toward
    1 on thin data is trivial and safe;
  * it can only move confidence toward the evidence — ``T > 1`` damps
    overconfidence, ``T < 1`` corrects underconfidence — never manufacture
    certainty beyond what the data supports.

The fitted temperature is shrunk toward 1 by sample size, so sparse buckets are
near no-ops, consistent with the conservative contract.
"""
from __future__ import annotations

from typing import Sequence

import numpy as np

from app.adaptive.weighting import blend, recency_weights
from app.memory.schema import ExperienceRecord

T_MIN, T_MAX = 0.5, 3.0  # bound the correction; T=1 is "no change"


def apply_temperature(
    probs: Sequence[float], temperature: float, eps: float = 1e-12
) -> tuple[float, float, float]:
    """Temperature-scale a probability vector and renormalise.

    ``T > 1`` flattens (less confident); ``T < 1`` sharpens (more confident);
    ``T == 1`` is the identity.
    """
    if temperature <= 0:
        temperature = 1.0
    p = np.clip(np.asarray(probs, dtype=float), eps, 1.0)
    scaled = p ** (1.0 / temperature)
    scaled = scaled / scaled.sum()
    return float(scaled[0]), float(scaled[1]), float(scaled[2])


def _blended_matrix(
    records: Sequence[ExperienceRecord], weights: dict[str, float]
) -> tuple[np.ndarray, np.ndarray]:
    P = np.zeros((len(records), 3), dtype=float)
    y = np.zeros(len(records), dtype=int)
    for i, rec in enumerate(records):
        P[i] = blend(rec.submodel_probs, weights)
        y[i] = int(rec.actual_outcome)
    return P, y


def _weighted_log_loss_T(
    P: np.ndarray, y: np.ndarray, sw: np.ndarray, T: float, eps: float = 1e-12
) -> float:
    scaled = np.clip(P, eps, 1.0) ** (1.0 / T)
    scaled = scaled / scaled.sum(axis=1, keepdims=True)
    picked = scaled[np.arange(len(y)), y]
    ll = -np.log(np.clip(picked, eps, 1.0))
    return float(np.sum(sw * ll) / max(np.sum(sw), eps))


def fit_temperature(
    records: Sequence[ExperienceRecord],
    weights: dict[str, float],
    halflife_days: float,
    min_samples: int,
) -> float:
    """Recency-weighted temperature minimising blended-prediction log loss.

    The raw optimum is shrunk toward 1.0 by ``shrink = n / (n + min_samples)`` so
    that buckets with little evidence calibrate gently. Returns 1.0 (identity)
    when there is nothing to learn from.
    """
    if not records:
        return 1.0
    P, y = _blended_matrix(records, weights)
    sw = recency_weights(records, halflife_days)

    # Coarse grid then a local refine — deterministic and dependency-light.
    grid = np.linspace(T_MIN, T_MAX, 51)
    losses = [_weighted_log_loss_T(P, y, sw, float(T)) for T in grid]
    best = float(grid[int(np.argmin(losses))])
    fine = np.linspace(max(T_MIN, best - 0.05), min(T_MAX, best + 0.05), 21)
    best = float(fine[int(np.argmin([_weighted_log_loss_T(P, y, sw, float(T)) for T in fine]))])

    n = len(records)
    shrink = n / (n + max(1, min_samples))
    return float(1.0 + (best - 1.0) * shrink)
