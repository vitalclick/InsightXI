from app.schemas import PredictionRequest, TeamFeatures
from app.inference.predictor import predict_match


def _request() -> PredictionRequest:
    return PredictionRequest(
        home=TeamFeatures(name="Arsenal", recent_xg=2.1, recent_xga=0.9, form_points=12),
        away=TeamFeatures(name="Everton", recent_xg=1.0, recent_xga=1.6, form_points=5),
    )


def test_probabilities_sum_to_one():
    res = predict_match(_request())
    total = (
        res.probabilities.home_win
        + res.probabilities.draw
        + res.probabilities.away_win
    )
    assert abs(total - 1.0) < 0.01


def test_includes_explanations():
    res = predict_match(_request())
    assert len(res.explanations) >= 1


def test_confidence_level_is_valid_band():
    res = predict_match(_request())
    assert res.confidence_level in {
        "Low",
        "Medium",
        "Strong",
        "Very Strong",
        "Elite Confidence",
    }
