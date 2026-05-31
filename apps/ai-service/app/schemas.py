"""Pydantic schemas for the AI service API (v2 — Intelligence Engine)."""
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    service: str
    status: str
    model_backend: str = Field(
        description="Which 1X2 backend is active: 'ensemble' (trained ML loaded) "
        "or 'analytical' (Poisson+Elo fallback).",
    )


class TeamRating(BaseModel):
    name: str
    elo: float = Field(default=1500, description="Elo rating")
    attack_strength: float = Field(
        default=1.0, gt=0, description="Goals scored relative to league average (1.0=avg)"
    )
    defense_strength: float = Field(
        default=1.0, gt=0, description="Goals conceded relative to average (>1.0=weaker)"
    )
    recent_form_points: float = Field(default=7.5, ge=0, le=15)
    avg_xg_for: float = Field(default=1.4, ge=0)
    avg_xg_against: float = Field(default=1.4, ge=0)


class PredictionRequest(BaseModel):
    match_id: str = "unknown"
    league_id: str = Field(
        default="global",
        description="League bucket for adaptive weighting / calibration / memory.",
    )
    home: TeamRating
    away: TeamRating
    league_avg_goals: float = Field(default=1.4, gt=0)


class OutcomeProbabilities(BaseModel):
    home_win: float
    draw: float
    away_win: float


class MarketProbability(BaseModel):
    market: str
    label: str
    probability: float


class ExpectedGoals(BaseModel):
    home: float
    away: float


class TopSelection(BaseModel):
    label: str
    probability: float


class PredictionResponse(BaseModel):
    match_id: str
    outcome: OutcomeProbabilities
    expected_goals: ExpectedGoals
    markets: list[MarketProbability]
    confidence_level: str
    top_selection: TopSelection
    explanations: list[str]
    model_backend: str
    adaptive: bool = Field(
        default=False,
        description="Whether the Adaptive Intelligence Engine was active for this prediction.",
    )
    adjustment_trace: list[str] = Field(
        default_factory=list,
        description="Human-readable record of any learned blend/calibration adjustments.",
    )


class FeedbackRequest(BaseModel):
    """Actual result of a previously predicted match — completes its memory row."""

    match_id: str
    league_id: str = "global"
    outcome: int = Field(ge=0, le=2, description="0 home win, 1 draw, 2 away win")
    home_goals: int | None = Field(default=None, ge=0)
    away_goals: int | None = Field(default=None, ge=0)


class FeedbackResponse(BaseModel):
    status: str
    match_id: str
    counts: dict


class PendingResponse(BaseModel):
    """Match ids predicted but not yet resolved — the backend's reconcile list."""

    match_ids: list[str]
    counts: dict


class AdaptiveStateResponse(BaseModel):
    status: str = Field(description="'ok' or 'unavailable' (engine off / no state yet)")
    enabled: bool
    updated_at: str | None = None
    feature_version: str | None = None
    leagues: dict | None = None
    counts: dict | None = None


class RecomputeResponse(BaseModel):
    status: str
    updated_at: str
    leagues: dict
    counts: dict


class EvaluationResponse(BaseModel):
    """Latest persisted training evaluation report."""

    status: str = Field(description="'ok' or 'unavailable' (no trained report yet)")
    report: dict | None = None


class DriftRequest(BaseModel):
    """Recent production feature vectors to check against the training set.

    Each row matches the model feature order
    [elo_diff, attack_diff, defense_diff, form_diff, xg_diff].
    """

    features: list[list[float]]


class DriftResponse(BaseModel):
    status: str
    report: dict
