"""Bivariate (independent) Poisson scoreline model.

Builds a scoreline probability matrix from expected goals for each side and
derives every supported goal/outcome market from it.
"""
import math

MAX_GOALS = 10
HOME_ADVANTAGE_FACTOR = 1.15


def expected_goals(
    home_attack: float,
    home_defense: float,
    away_attack: float,
    away_defense: float,
    league_avg_goals: float,
) -> tuple[float, float]:
    """Derive per-side expected goals from relative attack/defense strengths.

    strength values are relative to league average (1.0 = average). Defense
    strength > 1.0 means a team concedes more than average (weaker defense).
    """
    lambda_home = league_avg_goals * home_attack * away_defense * HOME_ADVANTAGE_FACTOR
    lambda_away = league_avg_goals * away_attack * home_defense
    # Keep within a sane footballing range.
    return _clamp(lambda_home, 0.2, 5.0), _clamp(lambda_away, 0.2, 5.0)


def _clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def _poisson_pmf(k: int, lam: float) -> float:
    return math.exp(-lam) * lam**k / math.factorial(k)


def scoreline_matrix(lambda_home: float, lambda_away: float) -> list[list[float]]:
    """P(home=i, away=j) for i,j in 0..MAX_GOALS (independent Poisson)."""
    home_pmf = [_poisson_pmf(i, lambda_home) for i in range(MAX_GOALS + 1)]
    away_pmf = [_poisson_pmf(j, lambda_away) for j in range(MAX_GOALS + 1)]
    return [[hp * ap for ap in away_pmf] for hp in home_pmf]


def outcome_probabilities(matrix: list[list[float]]) -> tuple[float, float, float]:
    home = draw = away = 0.0
    for i, row in enumerate(matrix):
        for j, p in enumerate(row):
            if i > j:
                home += p
            elif i == j:
                draw += p
            else:
                away += p
    return home, draw, away


def prob_total_goals_over(matrix: list[list[float]], line: float) -> float:
    """P(total goals > line), e.g. line=1.5 -> 2+ goals."""
    threshold = math.ceil(line)
    p = 0.0
    for i, row in enumerate(matrix):
        for j, cell in enumerate(row):
            if i + j >= threshold:
                p += cell
    return p


def prob_btts(matrix: list[list[float]]) -> float:
    """P(both teams score)."""
    p = 0.0
    for i in range(1, len(matrix)):
        for j in range(1, len(matrix[i])):
            p += matrix[i][j]
    return p
