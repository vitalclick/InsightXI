"""Prediction orchestration — the Intelligence Engine.

Blends three football models into one explainable, probabilistic output:
  * Poisson scoreline model  -> all goal markets + a 1X2 view
  * Elo (Davidson) model     -> a ratings-based 1X2 view
  * ML ensemble (LogReg+XGB) -> data-driven 1X2 view, when trained artifacts exist

The 1X2 views are combined into an ensemble; goal markets come from Poisson.

When the **Adaptive Intelligence Engine** is enabled (``ADAPTIVE_ENABLED``), the
blend weights and a confidence-calibration temperature are looked up per league
from learned state, every prediction is recorded to Experience Memory for the
feedback loop, and the response carries an ``adjustment_trace`` explaining any
tilt. When it is disabled (default) — or when a league lacks enough resolved
evidence — the blend is exactly the static baseline below.
"""
import math
from typing import Optional

from app.adaptive import config
from app.adaptive.calibration import apply_temperature
from app.adaptive.state import AdaptiveState, get_adaptive_state
from app.adaptive.weighting import baseline_weights, blend
from app.features.engineering import FEATURE_VERSION, build_features
from app.memory.schema import ExperienceRecord
from app.memory.store import ExperienceStore, store as default_store
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


def predict_match(
    req: PredictionRequest,
    *,
    state: Optional[AdaptiveState] = None,
    store: Optional[ExperienceStore] = None,
) -> PredictionResponse:
    home, away = req.home, req.away
    adaptive_on = config.adaptive_enabled()

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

    # 4) Assemble the per-model views and choose blend weights.
    model_probs: dict[str, tuple[float, float, float]] = {
        "poisson": poisson_1x2,
        "elo": elo_1x2,
    }
    if ml_1x2 is not None:
        model_probs["ml"] = ml_1x2

    backend = "ensemble" if ml_1x2 is not None else "analytical"
    baseline = baseline_weights(model_probs.keys())

    adjustment_trace: list[str] = []
    temperature = 1.0
    personality = None
    weights = baseline

    if adaptive_on:
        active_state = state if state is not None else get_adaptive_state()
        if active_state is not None:
            resolved = active_state.resolve(req.league_id, model_probs.keys(), baseline)
            weights = resolved.weights
            personality = resolved.personality
            if resolved.adapted:
                temperature = resolved.temperature if config.calibration_enabled() else 1.0
                adjustment_trace = list(resolved.adjustments)

    home_p, draw_p, away_p = blend(model_probs, weights)
    if temperature != 1.0:
        home_p, draw_p, away_p = apply_temperature((home_p, draw_p, away_p), temperature)
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

    explanations = build_explanations(
        home, away, lambda_home, lambda_away, personality=personality
    )

    # 7) Record this prediction to Experience Memory (feedback loop) when enabled.
    if adaptive_on:
        active_store = store if store is not None else default_store
        active_store.record_prediction(
            ExperienceRecord(
                match_id=req.match_id,
                league_id=req.league_id,
                feature_version=FEATURE_VERSION,
                features=[round(float(f), 6) for f in features],
                submodel_probs={k: [round(p, 6) for p in v] for k, v in model_probs.items()},
                blended_probs=[_r(home_p), _r(draw_p), _r(away_p)],
                weights_used={k: round(v, 4) for k, v in weights.items()},
                confidence_published=_r(top_prob),
            )
        )

    return PredictionResponse(
        match_id=req.match_id,
        outcome=outcome,
        expected_goals=ExpectedGoals(home=_r(lambda_home), away=_r(lambda_away)),
        markets=markets,
        confidence_level=_confidence_level(top_prob),
        top_selection=TopSelection(label=top_label, probability=_r(top_prob)),
        explanations=explanations,
        model_backend=backend,
        adaptive=adaptive_on,
        adjustment_trace=adjustment_trace,
    )
