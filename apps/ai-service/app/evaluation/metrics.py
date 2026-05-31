"""Probabilistic evaluation metrics for the 1X2 classifier.

Pure numpy so they are dependency-light and unit-testable. Used both by the
training pipeline (to report held-out quality) and the evaluation endpoint.
"""
from __future__ import annotations

import numpy as np

CLASSES = 3  # home / draw / away


def _onehot(y: np.ndarray) -> np.ndarray:
    out = np.zeros((len(y), CLASSES))
    out[np.arange(len(y)), y] = 1.0
    return out


def multiclass_log_loss(y_true: np.ndarray, proba: np.ndarray, eps: float = 1e-12) -> float:
    """Cross-entropy / log loss (lower is better)."""
    p = np.clip(proba, eps, 1.0)
    return float(-np.mean(np.log(p[np.arange(len(y_true)), y_true])))


def multiclass_brier(y_true: np.ndarray, proba: np.ndarray) -> float:
    """Multiclass Brier score: mean squared error vs one-hot (lower is better)."""
    return float(np.mean(np.sum((proba - _onehot(y_true)) ** 2, axis=1)))


def accuracy(y_true: np.ndarray, proba: np.ndarray) -> float:
    return float(np.mean(proba.argmax(axis=1) == y_true))


def expected_calibration_error(
    y_true: np.ndarray, proba: np.ndarray, n_bins: int = 10
) -> float:
    """ECE on the predicted (top-class) confidence vs empirical accuracy.

    Bins predictions by their max probability and measures the gap between
    average confidence and average correctness in each bin. 0 = perfectly
    calibrated.
    """
    confidences = proba.max(axis=1)
    predictions = proba.argmax(axis=1)
    correct = (predictions == y_true).astype(float)

    bins = np.linspace(0.0, 1.0, n_bins + 1)
    ece = 0.0
    n = len(y_true)
    for i in range(n_bins):
        lo, hi = bins[i], bins[i + 1]
        mask = (confidences > lo) & (confidences <= hi)
        count = int(mask.sum())
        if count == 0:
            continue
        avg_conf = float(confidences[mask].mean())
        avg_acc = float(correct[mask].mean())
        ece += (count / n) * abs(avg_conf - avg_acc)
    return float(ece)


def reliability_curve(
    y_true: np.ndarray, proba: np.ndarray, n_bins: int = 10
) -> list[dict]:
    """Per-bin reliability data backing a calibration plot.

    Uses the same top-confidence binning as ``expected_calibration_error``: for
    each populated bin we report the mean predicted confidence, the empirical
    accuracy, and the bin count. A well-calibrated model traces the diagonal
    (confidence == accuracy). Empty bins are omitted so the curve only plots
    where the model actually makes predictions.
    """
    confidences = proba.max(axis=1)
    predictions = proba.argmax(axis=1)
    correct = (predictions == y_true).astype(float)

    bins = np.linspace(0.0, 1.0, n_bins + 1)
    out: list[dict] = []
    for i in range(n_bins):
        lo, hi = bins[i], bins[i + 1]
        mask = (confidences > lo) & (confidences <= hi)
        count = int(mask.sum())
        if count == 0:
            continue
        out.append(
            {
                "confidence": round(float(confidences[mask].mean()), 4),
                "accuracy": round(float(correct[mask].mean()), 4),
                "count": count,
            }
        )
    return out


def evaluate(y_true: np.ndarray, proba: np.ndarray) -> dict:
    """Full metric bundle for a set of probabilistic predictions."""
    return {
        "n": int(len(y_true)),
        "log_loss": round(multiclass_log_loss(y_true, proba), 4),
        "brier": round(multiclass_brier(y_true, proba), 4),
        "accuracy": round(accuracy(y_true, proba), 4),
        "ece": round(expected_calibration_error(y_true, proba), 4),
        "reliability": reliability_curve(y_true, proba),
    }
