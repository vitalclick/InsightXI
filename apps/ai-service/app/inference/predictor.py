"""Prediction orchestration — the Intelligence Engine.

Blends three football models into one explainable, probabilistic output:
  * Poisson scoreline model  -> all goal markets + a 1X2 view
  * Elo (Davidson) model     -> a ratings-based 1X2 view
  * ML ensemble (LogReg+XGB) -> data-driven 1X2 view, when trained artifacts exist

The 1X2 views are combined into an ensemble; goal markets come from Poisson.
"""
import math

from app.features.engineering import build_features
from app.models import elo, poisson
from app.models.explain import build_explanations
from app.models.ml_ensemble import ensemble as ml_ensemble
from app.schemas import (
    ExpectedGoals,
    MarketProbability,
    OutcomeProbabilities,
    PredictionRequest,
    PredictionResponse,
    TopSelection,
)


def _confidence_level(top_prob: float) -> str:
    if top_prob >= 0.90:
        return "Elite Confidence"
    if top_prob >= 0.80:
        return "Very Strong"
    if top_prob >= 0.66:
        return "Strong"
    if top_prob >= 0.50:
        return "Medium"
    return "Low"


def _normalize(triple: tuple[float, float, float]) -> tuple[float, float, float]:
    total = sum(triple) or 1.0
    return triple[0] / total, triple[1] / total, triple[2] / total


def _r(x: float) -> float:
    return round(x, 3)


def predict_match(req: PredictionRequest) -> PredictionResponse:
    home, away = req.home, req.away

    # 1) Expected goals -> Poisson scoreline matrix -> goal markets + 1X2.
    lambda_home, lambda_away = poisson.expected_goals(
        home_attack=home.attack_strength,
        home_defense=home.defense_strength,
        away_attack=away.attack_strength,
        away_defense=away.defense_strength,
        league_avg_goals=req.league_avg_goals,
    )
    matrix = poisson.scoreline_matrix(lambda_home, lambda_away)
    poisson_1x2 = _normalize(poisson.outcome_probabilities(matrix))

    # 2) Elo (Davidson) 1X2.
    elo_1x2 = elo.outcome_probabilities(home.elo, away.elo)

    # 3) ML ensemble 1X2 (optional).
    features = build_features(
        home_elo=home.elo,
        away_elo=away.elo,
        home_attack=home.attack_strength,
        away_attack=away.attack_strength,
        home_defense=home.defense_strength,
        away_defense=away.defense_strength,
        home_form=home.recent_form_points,
        away_form=away.recent_form_points,
        home_xg_for=home.avg_xg_for,
        home_xg_against=home.avg_xg_against,
        away_xg_for=away.avg_xg_for,
        away_xg_against=away.avg_xg_against,
    )
    ml_1x2 = ml_ensemble.predict_proba(features)

    # 4) Ensemble the 1X2 views.
    if ml_1x2 is not None:
        backend = "ensemble"
        weights = [(ml_1x2, 0.5), (poisson_1x2, 0.3), (elo_1x2, 0.2)]
    else:
        backend = "analytical"
        weights = [(poisson_1x2, 0.6), (elo_1x2, 0.4)]

    home_p = sum(view[0] * w for view, w in weights)
    draw_p = sum(view[1] * w for view, w in weights)
    away_p = sum(view[2] * w for view, w in weights)
    home_p, draw_p, away_p = _normalize((home_p, draw_p, away_p))

    outcome = OutcomeProbabilities(
        home_win=_r(home_p), draw=_r(draw_p), away_win=_r(away_p)
    )

    # 5) Goal markets from the Poisson matrix.
    over15 = poisson.prob_total_goals_over(matrix, 1.5)
    over25 = poisson.prob_total_goals_over(matrix, 2.5)
    under45 = 1.0 - poisson.prob_total_goals_over(matrix, 4.5)
    btts = poisson.prob_btts(matrix)
    dnb_home = home_p / (home_p + away_p) if (home_p + away_p) else 0.0
    # First-half goal: >=1 goal with half the total expected goals.
    first_half_goal = 1.0 - math.exp(-(lambda_home + lambda_away) / 2.0)

    markets = [
        MarketProbability(market="home_win", label="Home Win", probability=_r(home_p)),
        MarketProbability(market="draw", label="Draw", probability=_r(draw_p)),
        MarketProbability(market="away_win", label="Away Win", probability=_r(away_p)),
        MarketProbability(
            market="double_chance_1x", label="Home or Draw", probability=_r(home_p + draw_p)
        ),
        MarketProbability(
            market="double_chance_x2", label="Draw or Away", probability=_r(draw_p + away_p)
        ),
        MarketProbability(
            market="draw_no_bet_home", label="Home (Draw No Bet)", probability=_r(dnb_home)
        ),
        MarketProbability(market="over_1_5", label="Over 1.5 Goals", probability=_r(over15)),
        MarketProbability(market="over_2_5", label="Over 2.5 Goals", probability=_r(over25)),
        MarketProbability(market="under_4_5", label="Under 4.5 Goals", probability=_r(under45)),
        MarketProbability(market="btts", label="Both Teams To Score", probability=_r(btts)),
        MarketProbability(
            market="first_half_goal", label="First Half Goal", probability=_r(first_half_goal)
        ),
    ]

    # 6) Headline selection + confidence.
    labels = [("Home Win", home_p), ("Draw", draw_p), ("Away Win", away_p)]
    top_label, top_prob = max(labels, key=lambda kv: kv[1])

    explanations = build_explanations(home, away, lambda_home, lambda_away)

    return PredictionResponse(
        match_id=req.match_id,
        outcome=outcome,
        expected_goals=ExpectedGoals(home=_r(lambda_home), away=_r(lambda_away)),
        markets=markets,
        confidence_level=_confidence_level(top_prob),
        top_selection=TopSelection(label=top_label, probability=_r(top_prob)),
        explanations=explanations,
        model_backend=backend,
    )
