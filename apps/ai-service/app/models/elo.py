"""Elo-based 1X2 model.

Standard Elo expected score with a home-field bump, extended to a
three-way (win/draw/loss) distribution via a Davidson-style draw model.
"""
import math

HOME_FIELD_ELO = 65.0  # home advantage expressed in Elo points
DRAW_NU = 0.30  # draw propensity parameter (higher => more draws)


def expected_score(elo_home: float, elo_away: float) -> float:
    """Classic Elo expected score for the home side (incl. home advantage)."""
    diff = (elo_home + HOME_FIELD_ELO) - elo_away
    return 1.0 / (1.0 + 10 ** (-diff / 400.0))


def outcome_probabilities(elo_home: float, elo_away: float) -> tuple[float, float, float]:
    """Return (home_win, draw, away_win) from Elo ratings.

    Uses the Davidson model: the draw term scales with the geometric mean of
    the two sides' win tendencies, so evenly matched teams draw more often.
    """
    diff = (elo_home + HOME_FIELD_ELO) - elo_away
    # Win "strengths" on a base-10 scale.
    gamma = 10 ** (diff / 400.0)
    home = gamma
    away = 1.0
    draw = DRAW_NU * math.sqrt(home * away)
    total = home + away + draw
    return home / total, draw / total, away / total
