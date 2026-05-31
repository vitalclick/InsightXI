"""L4 — Self-Evaluation loop.

Finally feeds the existing evaluation toolkit (app/evaluation/metrics.py) *real*
prediction-vs-outcome pairs instead of a train/test split. For a bucket of
resolved experience it answers, concretely and per sub-model:

  * "Which signals are working?"  -> per-model skill ranking
  * "When are we overconfident?"  -> reliability of the published blend

This layer is read-only — it measures, it never changes a prediction. The
Dynamic Weighting / Calibration layer (L5) consumes its output.
"""
from __future__ import annotations

from typing import Sequence

import numpy as np

from app.adaptive.weighting import blend
from app.evaluation.metrics import evaluate
from app.memory.schema import ExperienceRecord

# Log loss of the uninformed [1/3,1/3,1/3] baseline; the yardstick for "skill".
UNIFORM_LOG_LOSS = float(-np.log(1.0 / 3.0))


def _skill(log_loss: float) -> float:
    """Relative improvement over an uninformed uniform prediction.

    1.0 = perfect, 0.0 = no better than guessing, negative = worse than guessing.
    """
    return round(1.0 - (log_loss / UNIFORM_LOG_LOSS), 4)


def self_evaluate(
    records: Sequence[ExperienceRecord],
    models: Sequence[str],
    weights: dict[str, float],
) -> dict:
    """Per-sub-model and blended metrics + skill scores over resolved records."""
    if not records:
        return {"n": 0, "models": {}, "blend": None}

    y = np.array([int(r.actual_outcome) for r in records], dtype=int)

    per_model: dict[str, dict] = {}
    for m in models:
        proba = np.array([r.submodel_probs[m] for r in records], dtype=float)
        metrics = evaluate(y, proba)
        metrics["skill"] = _skill(metrics["log_loss"])
        per_model[m] = metrics

    blended = np.array([blend(r.submodel_probs, weights) for r in records], dtype=float)
    blend_metrics = evaluate(y, blended)
    blend_metrics["skill"] = _skill(blend_metrics["log_loss"])

    ranking = sorted(per_model, key=lambda m: per_model[m]["skill"], reverse=True)
    return {
        "n": len(records),
        "models": per_model,
        "blend": blend_metrics,
        "model_ranking": ranking,
    }


def beats_baseline(
    records: Sequence[ExperienceRecord],
    candidate_weights: dict[str, float],
    baseline_weights: dict[str, float],
    eps: float = 1e-6,
) -> bool:
    """Does the candidate blend achieve lower log loss than the static baseline?

    The gate behind shipping any adaptation for a bucket: if the learned weights
    don't beat baseline on the bucket's own resolved evidence, we keep baseline.
    """
    if not records:
        return False
    y = np.array([int(r.actual_outcome) for r in records], dtype=int)
    cand = np.array([blend(r.submodel_probs, candidate_weights) for r in records], dtype=float)
    base = np.array([blend(r.submodel_probs, baseline_weights) for r in records], dtype=float)

    def _ll(proba: np.ndarray) -> float:
        picked = proba[np.arange(len(y)), y]
        return float(np.mean(-np.log(np.clip(picked, 1e-12, 1.0))))

    return _ll(cand) <= _ll(base) - eps
