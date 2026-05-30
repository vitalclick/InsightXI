"""Reproducible training pipeline for the 1X2 ensemble.

Trains on a realistic multi-season historical simulation (see
app.training.historical) rather than i.i.d. noise, calibrates the classifiers'
probabilities (so confidence bands mean what they say — statistical integrity),
and persists models + an evaluation report + a drift reference snapshot.

Run:  python -m app.training.train [--seasons N] [--no-calibrate]
"""
from __future__ import annotations

import argparse
import json

import numpy as np

from app.evaluation.metrics import evaluate
from app.features.engineering import FEATURE_NAMES, FEATURE_VERSION
from app.models.ml_ensemble import MODELS_DIR
from app.training.historical import generate

RNG_SEED = 42
METRICS_PATH = MODELS_DIR / "metrics.json"
DRIFT_REF_PATH = MODELS_DIR / "drift_reference.npz"


def train(seasons: int = 6, calibrate: bool = True) -> dict:
    from sklearn.calibration import CalibratedClassifierCV
    from sklearn.linear_model import LogisticRegression
    from sklearn.model_selection import train_test_split
    from xgboost import XGBClassifier
    import joblib

    rng = np.random.default_rng(RNG_SEED)
    X, y = generate(n_teams=20, n_seasons=seasons, rng=rng)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RNG_SEED, stratify=y
    )

    logreg = LogisticRegression(max_iter=2000)
    xgb = XGBClassifier(
        n_estimators=200,
        max_depth=3,
        learning_rate=0.08,
        subsample=0.9,
        objective="multi:softprob",
        num_class=3,
        eval_metric="mlogloss",
        random_state=RNG_SEED,
    )

    if calibrate:
        # Sigmoid calibration via internal CV — well-suited to smaller samples.
        logreg = CalibratedClassifierCV(logreg, method="sigmoid", cv=3)
        xgb = CalibratedClassifierCV(xgb, method="sigmoid", cv=3)

    logreg.fit(X_train, y_train)
    xgb.fit(X_train, y_train)

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(logreg, MODELS_DIR / "logreg_1x2.joblib")
    joblib.dump(xgb, MODELS_DIR / "xgb_1x2.joblib")

    # Held-out ensemble evaluation (calibrated probabilities).
    ens = (logreg.predict_proba(X_test) + xgb.predict_proba(X_test)) / 2.0
    ens = ens / ens.sum(axis=1, keepdims=True)
    metrics = {
        "feature_version": FEATURE_VERSION,
        "features": FEATURE_NAMES,
        "calibrated": calibrate,
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
        **evaluate(y_test, ens),
    }

    METRICS_PATH.write_text(json.dumps(metrics, indent=2))
    # Drift reference: the training feature matrix the models learned from.
    np.savez_compressed(DRIFT_REF_PATH, features=X_train, names=np.array(FEATURE_NAMES))
    return metrics


def main() -> None:
    parser = argparse.ArgumentParser(description="Train InsightXI 1X2 ensemble")
    parser.add_argument("--seasons", type=int, default=6)
    parser.add_argument("--no-calibrate", action="store_true")
    args = parser.parse_args()
    metrics = train(seasons=args.seasons, calibrate=not args.no_calibrate)
    print(f"Saved models + report to {MODELS_DIR}")
    for k, v in metrics.items():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
