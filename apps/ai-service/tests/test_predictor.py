from app.inference.predictor import predict_match
from app.models import poisson
from app.schemas import PredictionRequest, TeamRating


def _request(**overrides) -> PredictionRequest:
    home = TeamRating(
        name="Arsenal", elo=1620, attack_strength=1.3, defense_strength=0.8,
        recent_form_points=13, avg_xg_for=2.1, avg_xg_against=0.9,
    )
    away = TeamRating(
        name="Burnley", elo=1410, attack_strength=0.8, defense_strength=1.4,
        recent_form_points=4, avg_xg_for=1.0, avg_xg_against=1.7,
    )
    return PredictionRequest(match_id="m1", home=home, away=away, **overrides)


def test_outcome_probabilities_sum_to_one():
    res = predict_match(_request())
    o = res.outcome
    assert abs(o.home_win + o.draw + o.away_win - 1.0) < 0.01


def test_stronger_home_side_is_favoured():
    res = predict_match(_request())
    assert res.outcome.home_win > res.outcome.away_win
    assert res.top_selection.label == "Home Win"


def test_markets_present_and_bounded():
    res = predict_match(_request())
    markets = {m.market for m in res.markets}
    for required in {"home_win", "draw", "away_win", "over_1_5", "under_4_5", "btts"}:
        assert required in markets
    for m in res.markets:
        assert 0.0 <= m.probability <= 1.0


def test_double_chance_consistency():
    res = predict_match(_request())
    by = {m.market: m.probability for m in res.markets}
    # 1X should be at least as likely as the home win alone.
    assert by["double_chance_1x"] >= by["home_win"] - 1e-6


def test_explanations_present():
    res = predict_match(_request())
    assert len(res.explanations) >= 2


def test_confidence_band_valid():
    res = predict_match(_request())
    assert res.confidence_level in {
        "Low", "Medium", "Strong", "Very Strong", "Elite Confidence"
    }


def test_poisson_scoreline_matrix_is_a_distribution():
    matrix = poisson.scoreline_matrix(1.5, 1.2)
    total = sum(cell for row in matrix for cell in row)
    # Truncated at MAX_GOALS, so close to but <= 1.
    assert 0.98 <= total <= 1.0001
