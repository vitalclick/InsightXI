"""Pydantic schemas for the AI service API."""
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    service: str
    status: str


class TeamFeatures(BaseModel):
    name: str
    recent_xg: float = Field(ge=0)
    recent_xga: float = Field(ge=0)
    form_points: float = Field(ge=0, le=15, description="Points from last 5 matches")


class PredictionRequest(BaseModel):
    home: TeamFeatures
    away: TeamFeatures


class OutcomeProbabilities(BaseModel):
    home_win: float
    draw: float
    away_win: float


class PredictionResponse(BaseModel):
    probabilities: OutcomeProbabilities
    confidence_level: str
    explanations: list[str]
