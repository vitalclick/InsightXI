"""Reproducible training pipeline for the 1X2 ensemble.

Generates a synthetic match dataset from latent team ratings (using the same
Poisson goal process the platform models), then fits a Logistic Regression and
an XGBoost classifier on the shared feature set. Artifacts are serialized to
MODELS_DIR for the inference ensemble to pick up.

Run:  python -m app.training.train
"""
from __future__ import annotations

import argparse

import numpy as np

from app.features.engineering import FEATURE_NAMES, FEATURE_VERSION
from app.models.elo import HOME_FIELD_ELO
from app.models.ml_ensemble import MODELS_DIR

RNG_SEED = 42


def _simulate_dataset(n: int, rng: np.random.Generator) -> tuple[np.ndarray, np.ndarray]:
    """Return (X, y) where y in {0:home, 1:draw, 2:away}."""
    rows: list[list[float]] = []
    labels: list[int] = []

    for _ in range(n):
        home_elo = rng.normal(1500, 120)
        away_elo = rng.normal(1500, 120)
        home_attack = max(0.4, rng.normal(1.0, 0.25))
        away_attack = max(0.4, rng.normal(1.0, 0.25))
        home_defense = max(0.4, rng.normal(1.0, 0.25))
        away_defense = max(0.4, rng.normal(1.0, 0.25))
        home_form = float(np.clip(rng.normal(7.5, 3.5), 0, 15))
        away_form = float(np.clip(rng.normal(7.5, 3.5), 0, 15))
        home_xg_for = max(0.2, rng.normal(1.4, 0.4))
        home_xg_against = max(0.2, rng.normal(1.4, 0.4))
        away_xg_for = max(0.2, rng.normal(1.4, 0.4))
        away_xg_against = max(0.2, rng.normal(1.4, 0.4))

        # "True" goal rates blend Elo edge and attack/defense strengths.
        elo_edge = ((home_elo + HOME_FIELD_ELO) - away_elo) / 400.0
        lam_home = float(np.clip(1.45 * home_attack * away_defense * (1.1 + 0.25 * elo_edge), 0.2, 5))
        lam_away = float(np.clip(1.45 * away_attack * home_defense * (1.0 - 0.25 * elo_edge), 0.2, 5))
        hg = rng.poisson(lam_home)
        ag = rng.poisson(lam_away)
        label = 0 if hg > ag else (1 if hg == ag else 2)

        rows.append(
            [
                (home_elo + HOME_FIELD_ELO) - away_elo,
                home_attack - away_attack,
                away_defense - home_defense,
                home_form - away_form,
                (home_xg_for - home_xg_against) - (away_xg_for - away_xg_against),
            ]
        )
        labels.append(label)

    return np.array(rows, dtype=float), np.array(labels, dtype=int)


def train(n: int = 8000) -> dict:
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import accuracy_score, log_loss
    from sklearn.model_selection import train_test_split
    from xgboost import XGBClassifier
    import joblib

    rng = np.random.default_rng(RNG_SEED)
    X, y = _simulate_dataset(n, rng)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RNG_SEED
    )

    logreg = LogisticRegression(max_iter=2000)
    logreg.fit(X_train, y_train)

    xgb = XGBClassifier(
        n_estimators=160,
        max_depth=3,
        learning_rate=0.1,
        objective="multi:softprob",
        num_class=3,
        eval_metric="mlogloss",
        random_state=RNG_SEED,
    )
    xgb.fit(X_train, y_train)

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(logreg, MODELS_DIR / "logreg_1x2.joblib")
    joblib.dump(xgb, MODELS_DIR / "xgb_1x2.joblib")

    # Ensemble evaluation on held-out data.
    ens = (logreg.predict_proba(X_test) + xgb.predict_proba(X_test)) / 2.0
    ens = ens / ens.sum(axis=1, keepdims=True)  # guard float drift
    metrics = {
        "feature_version": FEATURE_VERSION,
        "features": FEATURE_NAMES,
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
        "logloss": round(float(log_loss(y_test, ens, labels=[0, 1, 2])), 4),
        "accuracy": round(float(accuracy_score(y_test, ens.argmax(axis=1))), 4),
    }
    return metrics


def main() -> None:
    parser = argparse.ArgumentParser(description="Train InsightXI 1X2 ensemble")
    parser.add_argument("--samples", type=int, default=8000)
    args = parser.parse_args()
    metrics = train(args.samples)
    print(f"Saved models to {MODELS_DIR}")
    for k, v in metrics.items():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
