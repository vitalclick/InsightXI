"""Feature engineering for the 1X2 classifier.

A single source of truth for the feature vector, shared by training and
inference so the two never drift (feature versioning).
"""
from app.models.elo import HOME_FIELD_ELO

FEATURE_NAMES = [
    "elo_diff",
    "attack_diff",
    "defense_diff",
    "form_diff",
    "xg_diff",
]
FEATURE_VERSION = "v1"


def build_features(
    *,
    home_elo: float,
    away_elo: float,
    home_attack: float,
    away_attack: float,
    home_defense: float,
    away_defense: float,
    home_form: float,
    away_form: float,
    home_xg_for: float,
    home_xg_against: float,
    away_xg_for: float,
    away_xg_against: float,
) -> list[float]:
    return [
        (home_elo + HOME_FIELD_ELO) - away_elo,
        home_attack - away_attack,
        # Positive => home concedes less than away (stronger home defense).
        away_defense - home_defense,
        home_form - away_form,
        (home_xg_for - home_xg_against) - (away_xg_for - away_xg_against),
    ]
