"""Placeholder prediction logic.

Transparent baseline so the API contract and explainability format are
testable end-to-end before real models land. It applies a small home
advantage and nudges by xG balance and recent form, then normalises to
probabilities. NOT a trained model — clearly labelled as a baseline.
"""
from app.schemas import (
    OutcomeProbabilities,
    PredictionRequest,
    PredictionResponse,
)

HOME_ADVANTAGE = 0.15


def _confidence_level(top_prob: float) -> str:
    """Map a probability to InsightXI confidence bands."""
    if top_prob >= 0.90:
        return "Elite Confidence"
    if top_prob >= 0.80:
        return "Very Strong"
    if top_prob >= 0.66:
        return "Strong"
    if top_prob >= 0.50:
        return "Medium"
    return "Low"


def predict_match(request: PredictionRequest) -> PredictionResponse:
    home, away = request.home, request.away

    # Crude scoring inputs (baseline only).
    home_score = home.recent_xg - away.recent_xga + home.form_points / 15
    away_score = away.recent_xg - home.recent_xga + away.form_points / 15

    home_raw = max(home_score + HOME_ADVANTAGE, 0.01)
    away_raw = max(away_score, 0.01)
    draw_raw = max((home_raw + away_raw) / 3, 0.01)

    total = home_raw + away_raw + draw_raw
    probs = OutcomeProbabilities(
        home_win=round(home_raw / total, 3),
        draw=round(draw_raw / total, 3),
        away_win=round(away_raw / total, 3),
    )

    explanations: list[str] = []
    if home.recent_xg > away.recent_xg:
        explanations.append(f"{home.name} has the stronger recent xG trend")
    if home.form_points > away.form_points:
        explanations.append(f"{home.name} is in better recent form")
    explanations.append("Home advantage applied")

    top = max(probs.home_win, probs.draw, probs.away_win)
    return PredictionResponse(
        probabilities=probs,
        confidence_level=_confidence_level(top),
        explanations=explanations,
    )
