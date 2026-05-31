"""Experience Memory record schema.

A single row per match. It is filled in two stages:
  1. ``record_prediction`` writes the prediction-time portion (features, each
     sub-model's 1X2 view, the published blend, the weights used).
  2. ``record_outcome`` completes it once the match is resolved (actual result
     + goals).

A record is *resolved* (usable for learning) only when both stages are present.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Optional

# Outcome encoding shared across the engine: 0 home win, 1 draw, 2 away win.
HOME, DRAW, AWAY = 0, 1, 2


@dataclass
class ExperienceRecord:
    match_id: str
    league_id: str = "global"
    feature_version: str = "v1"
    predicted_at: Optional[str] = None  # ISO-8601 UTC
    resolved_at: Optional[str] = None

    features: list[float] = field(default_factory=list)
    # Each sub-model's pre-blend (home, draw, away) view, e.g. {"poisson": [...]}.
    submodel_probs: dict[str, list[float]] = field(default_factory=dict)
    blended_probs: list[float] = field(default_factory=list)
    weights_used: dict[str, float] = field(default_factory=dict)
    confidence_published: Optional[float] = None

    actual_outcome: Optional[int] = None  # 0/1/2
    actual_goals: Optional[dict[str, int]] = None  # {"home": h, "away": a}

    @property
    def model_set(self) -> tuple[str, ...]:
        return tuple(sorted(self.submodel_probs.keys()))

    @property
    def resolved(self) -> bool:
        return (
            self.actual_outcome is not None
            and bool(self.submodel_probs)
            and bool(self.blended_probs)
        )

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> "ExperienceRecord":
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})
