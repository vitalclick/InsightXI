"""Adaptive state artifact + recompute/resolve.

``adaptive_state.json`` is the single source of truth for everything the engine
has learned between retrains: per-league blend weights, calibration temperature,
league personality, the latest self-evaluation, and a human-readable list of the
adjustments it made (and why). Deleting the file instantly reverts the service
to the static blend.

  * ``recompute(store)`` rebuilds the artifact from Experience Memory — cheap and
    frequent; called by the backend's retrain job and the ``/adaptive/recompute``
    endpoint.
  * ``AdaptiveState.resolve(...)`` is the inference-time lookup used by the
    predictor to fetch a league's weights/temperature + adjustment trace.

Every adaptation is gated: a bucket only adapts after ``min_samples`` resolved
predictions AND only if the learned blend beats the static baseline on that
bucket's own evidence. Otherwise it transparently stays on baseline.
"""
from __future__ import annotations

import json
from collections import Counter
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from app.adaptive import config
from app.adaptive.calibration import fit_temperature
from app.adaptive.evaluate import beats_baseline, self_evaluate
from app.adaptive.personality import league_personality
from app.adaptive.weighting import baseline_weights, smooth_and_clip, solve_weights
from app.features.engineering import FEATURE_VERSION
from app.memory.schema import ExperienceRecord
from app.memory.store import ExperienceStore, store as default_store

STATE_VERSION = "1"
GLOBAL_BUCKET = "global"


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def _label(league_id: str) -> str:
    return league_id.upper() if league_id != GLOBAL_BUCKET else "Global"


@dataclass
class LeagueState:
    league_id: str
    model_set: list[str]
    weights: dict[str, float]
    temperature: float
    evidence_count: int
    adapted: bool
    personality: Optional[dict]
    self_eval: dict
    adjustments: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict) -> "LeagueState":
        return cls(**{k: v for k, v in d.items() if k in cls.__dataclass_fields__})


@dataclass
class ResolveResult:
    weights: dict[str, float]
    temperature: float
    adjustments: list[str]
    personality: Optional[dict]
    adapted: bool
    bucket: Optional[str]


@dataclass
class AdaptiveState:
    version: str = STATE_VERSION
    updated_at: str = ""
    feature_version: str = FEATURE_VERSION
    leagues: dict[str, LeagueState] = field(default_factory=dict)

    # --- inference-time lookup -------------------------------------------
    def resolve(
        self, league_id: str, model_set, baseline: dict[str, float]
    ) -> ResolveResult:
        ms = tuple(sorted(model_set))
        order = [league_id, GLOBAL_BUCKET] if league_id != GLOBAL_BUCKET else [GLOBAL_BUCKET]

        # Personality (descriptive) — prefer the most specific league we know.
        personality = None
        for lid in order:
            ls = self.leagues.get(lid)
            if ls and ls.personality:
                personality = ls.personality
                break

        # Weights/temperature only from a bucket that actually adapted and whose
        # model set matches what's available right now.
        for lid in order:
            ls = self.leagues.get(lid)
            if ls and ls.adapted and tuple(sorted(ls.weights)) == ms:
                return ResolveResult(
                    weights=dict(ls.weights),
                    temperature=ls.temperature,
                    adjustments=list(ls.adjustments),
                    personality=personality,
                    adapted=True,
                    bucket=lid,
                )
        return ResolveResult(dict(baseline), 1.0, [], personality, adapted=False, bucket=None)

    # --- persistence ------------------------------------------------------
    def to_dict(self) -> dict:
        return {
            "version": self.version,
            "updated_at": self.updated_at,
            "feature_version": self.feature_version,
            "leagues": {lid: ls.to_dict() for lid, ls in self.leagues.items()},
        }

    def save(self, path: Optional[Path] = None) -> None:
        path = Path(path) if path is not None else config.adaptive_state_path()
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(self.to_dict(), indent=2))

    @classmethod
    def from_dict(cls, d: dict) -> "AdaptiveState":
        leagues = {
            lid: LeagueState.from_dict(ls) for lid, ls in (d.get("leagues") or {}).items()
        }
        return cls(
            version=d.get("version", STATE_VERSION),
            updated_at=d.get("updated_at", ""),
            feature_version=d.get("feature_version", FEATURE_VERSION),
            leagues=leagues,
        )

    @classmethod
    def load(cls, path: Optional[Path] = None) -> Optional["AdaptiveState"]:
        path = Path(path) if path is not None else config.adaptive_state_path()
        if not path.exists():
            return None
        try:
            return cls.from_dict(json.loads(path.read_text()))
        except Exception:  # pragma: no cover - corrupt artifact
            return None


# --- recompute ------------------------------------------------------------
def _dominant_model_set(records: list[ExperienceRecord]) -> list[str]:
    if not records:
        return ["elo", "poisson"]
    counts = Counter(r.model_set for r in records)
    return list(counts.most_common(1)[0][0])


def _describe(
    league_id: str,
    baseline: dict[str, float],
    weights: dict[str, float],
    temperature: float,
    n: int,
    adapted: bool,
    min_samples: int,
) -> list[str]:
    label = _label(league_id)
    if not adapted:
        if n < min_samples:
            return [f"{label}: gathering evidence ({n}/{min_samples}) — using static baseline"]
        return [f"{label}: learned blend did not beat baseline — keeping static weights ({n} matches)"]

    changes = []
    for m in sorted(weights, key=lambda k: -abs(weights[k] - baseline.get(k, 0))):
        delta = weights[m] - baseline.get(m, 0.0)
        if abs(delta) >= 0.01:
            changes.append(
                f"{m} {baseline.get(m, 0):.2f}→{weights[m]:.2f} ({delta:+.2f})"
            )
    out = []
    if changes:
        out.append(f"{label}: blend tilted — " + ", ".join(changes) + f" (basis {n} matches)")
    else:
        out.append(f"{label}: blend confirmed at baseline ({n} matches)")
    if abs(temperature - 1.0) >= 0.02:
        mode = "damping overconfidence" if temperature > 1.0 else "lifting underconfidence"
        out.append(f"{label}: confidence calibration T={temperature:.2f} ({mode})")
    return out


def _build_league_state(
    league_id: str,
    records: list[ExperienceRecord],
    previous: Optional[AdaptiveState],
    *,
    min_samples: int,
    cap: float,
    step: float,
    halflife: float,
    calibrate: bool,
) -> Optional[LeagueState]:
    if not records:
        return None
    model_set = _dominant_model_set(records)
    target = tuple(sorted(model_set))
    records = [r for r in records if r.model_set == target]
    n = len(records)
    if n == 0:
        return None

    base = baseline_weights(model_set)
    prev_ls = previous.leagues.get(league_id) if previous else None
    prev_w = (
        prev_ls.weights
        if prev_ls and set(prev_ls.weights) == set(base)
        else None
    )

    adapted = False
    weights = dict(base)
    temperature = 1.0

    if n >= min_samples:
        solved = solve_weights(records, model_set, base, cap, halflife)
        smoothed = smooth_and_clip(solved, prev_w, base, cap, step)
        if beats_baseline(records, smoothed, base):
            weights = smoothed
            adapted = True
        if calibrate:
            temperature = fit_temperature(records, weights, halflife, min_samples)

    personality = league_personality(records)
    self_eval = self_evaluate(records, model_set, weights)
    adjustments = _describe(league_id, base, weights, temperature, n, adapted, min_samples)

    return LeagueState(
        league_id=league_id,
        model_set=list(model_set),
        weights=weights,
        temperature=round(temperature, 4),
        evidence_count=n,
        adapted=adapted,
        personality=personality,
        self_eval=self_eval,
        adjustments=adjustments,
    )


def recompute(
    store: ExperienceStore,
    previous: Optional[AdaptiveState] = None,
    *,
    min_samples: Optional[int] = None,
    cap: Optional[float] = None,
    step: Optional[float] = None,
    halflife: Optional[float] = None,
    calibrate: Optional[bool] = None,
) -> AdaptiveState:
    """Rebuild adaptive state from Experience Memory (defaults pulled from config)."""
    min_samples = config.min_samples() if min_samples is None else min_samples
    cap = config.weight_drift_cap() if cap is None else cap
    step = config.weight_step() if step is None else step
    halflife = config.recency_halflife_days() if halflife is None else halflife
    calibrate = config.calibration_enabled() if calibrate is None else calibrate

    buckets: dict[str, list[ExperienceRecord]] = {
        lid: store.resolved(lid) for lid in store.leagues()
    }
    buckets[GLOBAL_BUCKET] = store.resolved()

    leagues: dict[str, LeagueState] = {}
    for lid, records in buckets.items():
        ls = _build_league_state(
            lid,
            records,
            previous,
            min_samples=min_samples,
            cap=cap,
            step=step,
            halflife=halflife,
            calibrate=calibrate,
        )
        if ls is not None:
            leagues[lid] = ls

    return AdaptiveState(updated_at=_utcnow(), leagues=leagues)


# --- process-level cache for the inference path ---------------------------
class _StateCache:
    """Loads adaptive_state.json once and reuses it; refreshed after recompute."""

    def __init__(self) -> None:
        self._state: Optional[AdaptiveState] = None
        self._loaded = False

    def get(self) -> Optional[AdaptiveState]:
        if not self._loaded:
            self._state = AdaptiveState.load()
            self._loaded = True
        return self._state

    def set(self, state: AdaptiveState) -> None:
        self._state = state
        self._loaded = True

    def reset(self) -> None:
        self._state = None
        self._loaded = False


_cache = _StateCache()


def get_adaptive_state() -> Optional[AdaptiveState]:
    return _cache.get()


def recompute_and_persist(store: Optional[ExperienceStore] = None) -> AdaptiveState:
    store = store or default_store
    previous = get_adaptive_state()
    state = recompute(store, previous)
    state.save()
    _cache.set(state)
    return state
