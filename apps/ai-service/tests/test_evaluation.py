import numpy as np

from app.evaluation.metrics import (
    accuracy,
    expected_calibration_error,
    multiclass_brier,
    multiclass_log_loss,
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
