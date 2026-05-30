"""Trained ML ensemble (Logistic Regression + XGBoost) for 1X2.

Loads serialized models from MODELS_DIR if present. When no trained artifacts
exist, the ensemble is simply unavailable and inference falls back to the
analytical Poisson+Elo blend — so the service always works out of the box.
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

import numpy as np

MODELS_DIR = Path(os.environ.get("MODELS_DIR", Path(__file__).resolve().parents[2] / "models"))
LOGREG_PATH = MODELS_DIR / "logreg_1x2.joblib"
XGB_PATH = MODELS_DIR / "xgb_1x2.joblib"


class MlEnsemble:
    """Lazy-loaded ensemble. Averages calibrated class probabilities."""

    def __init__(self) -> None:
        self._logreg = None
        self._xgb = None
        self._loaded = False

    def _ensure_loaded(self) -> None:
        if self._loaded:
            return
        self._loaded = True
        try:
            import joblib  # local import; only needed when artifacts exist

            if LOGREG_PATH.exists():
                self._logreg = joblib.load(LOGREG_PATH)
            if XGB_PATH.exists():
                self._xgb = joblib.load(XGB_PATH)
        except Exception:  # pragma: no cover - defensive: corrupt/incompatible artifact
            self._logreg = None
            self._xgb = None

    @property
    def available(self) -> bool:
        self._ensure_loaded()
        return self._logreg is not None or self._xgb is not None

    def predict_proba(self, features: list[float]) -> Optional[tuple[float, float, float]]:
        """Return (home, draw, away) probabilities, or None if unavailable."""
        self._ensure_loaded()
        x = np.array([features], dtype=float)
        probs = []
        if self._logreg is not None:
            probs.append(self._logreg.predict_proba(x)[0])
        if self._xgb is not None:
            probs.append(self._xgb.predict_proba(x)[0])
        if not probs:
            return None
        mean = np.mean(probs, axis=0)
        return float(mean[0]), float(mean[1]), float(mean[2])


# Module-level singleton.
ensemble = MlEnsemble()
