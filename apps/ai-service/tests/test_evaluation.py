import numpy as np

from app.evaluation.metrics import (
    accuracy,
    expected_calibration_error,
    multiclass_brier,
    multiclass_log_loss,
    reliability_curve,
)
from app.evaluation.drift import classify_psi, feature_drift, psi


def test_log_loss_and_brier_reward_confident_correct_predictions():
    y = np.array([0, 1, 2])
    confident = np.array([[0.9, 0.05, 0.05], [0.05, 0.9, 0.05], [0.05, 0.05, 0.9]])
    unsure = np.full((3, 3), 1 / 3)
    assert multiclass_log_loss(y, confident) < multiclass_log_loss(y, unsure)
    assert multiclass_brier(y, confident) < multiclass_brier(y, unsure)
    assert accuracy(y, confident) == 1.0


def test_perfectly_calibrated_has_low_ece():
    # All predictions at 1/3 confidence; with balanced classes accuracy ~ 1/3.
    rng = np.random.default_rng(0)
    y = rng.integers(0, 3, size=3000)
    proba = np.full((3000, 3), 1 / 3)
    assert expected_calibration_error(y, proba) < 0.1


def test_reliability_curve_structure_and_bounds():
    rng = np.random.default_rng(4)
    y = rng.integers(0, 3, size=2000)
    proba = np.full((2000, 3), 1 / 3)
    curve = reliability_curve(y, proba)
    assert len(curve) >= 1
    for point in curve:
        assert set(point.keys()) == {"confidence", "accuracy", "count"}
        assert 0.0 <= point["confidence"] <= 1.0
        assert 0.0 <= point["accuracy"] <= 1.0
        assert point["count"] > 0
    # Bin counts must sum to the full sample (no rows dropped).
    assert sum(p["count"] for p in curve) == len(y)


def test_reliability_curve_tracks_diagonal_when_calibrated():
    # Confident + correct predictions land in a high-confidence, high-accuracy bin.
    y = np.array([0, 1, 2] * 100)
    proba = np.tile([[0.9, 0.05, 0.05], [0.05, 0.9, 0.05], [0.05, 0.05, 0.9]], (100, 1))
    curve = reliability_curve(y, proba)
    top = max(curve, key=lambda p: p["confidence"])
    assert top["confidence"] > 0.8
    assert top["accuracy"] == 1.0


def test_psi_zero_for_identical_distributions():
    rng = np.random.default_rng(1)
    sample = rng.normal(0, 1, 5000)
    assert psi(sample, sample) < 1e-6
    assert classify_psi(0.0) == "stable"


def test_psi_flags_a_shifted_distribution():
    rng = np.random.default_rng(2)
    ref = rng.normal(0, 1, 5000)
    shifted = rng.normal(3, 1, 5000)  # large mean shift
    value = psi(ref, shifted)
    assert value > 0.25
    assert classify_psi(value) == "major"


def test_feature_drift_report_structure():
    rng = np.random.default_rng(3)
    ref = rng.normal(0, 1, (1000, 2))
    cur = rng.normal(0, 1, (500, 2))
    report = feature_drift(ref, cur, ["a", "b"])
    assert set(report["features"].keys()) == {"a", "b"}
    assert report["status"] == "stable"
    assert report["retrain_recommended"] is False
