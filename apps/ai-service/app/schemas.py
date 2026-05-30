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
