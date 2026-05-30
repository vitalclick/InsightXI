"""Generate human-readable explanations for a prediction.

Explainability is non-negotiable: every prediction must ship with the
reasoning behind it. Explanations are derived from the same features that
drive the model, so they are faithful rather than decorative.
"""
from app.schemas import TeamRating


def build_explanations(
    home: TeamRating,
    away: TeamRating,
    lambda_home: float,
    lambda_away: float,
) -> list[str]:
    reasons: list[str] = []

    elo_gap = home.elo - away.elo
    if abs(elo_gap) >= 40:
        stronger, weaker = (home, away) if elo_gap > 0 else (away, home)
        reasons.append(
            f"{stronger.name} carries the stronger Elo rating "
            f"({stronger.elo:.0f} vs {weaker.elo:.0f})"
        )

    home_xg_bal = home.avg_xg_for - home.avg_xg_against
    away_xg_bal = away.avg_xg_for - away.avg_xg_against
    if abs(home_xg_bal - away_xg_bal) >= 0.3:
        better = home if home_xg_bal > away_xg_bal else away
        reasons.append(f"{better.name} has the superior underlying xG balance")

    if abs(home.recent_form_points - away.recent_form_points) >= 3:
        in_form = home if home.recent_form_points > away.recent_form_points else away
        reasons.append(
            f"{in_form.name} is in better recent form "
            f"({in_form.recent_form_points:.0f}/15 pts)"
        )

    if away.defense_strength - home.defense_strength >= 0.2:
        reasons.append(f"{home.name} has the more solid defensive profile")
    elif home.defense_strength - away.defense_strength >= 0.2:
        reasons.append(f"{away.name} has the more solid defensive profile")

    reasons.append(
        f"Model expects roughly {lambda_home:.1f}–{lambda_away:.1f} goals "
        "(home advantage applied)"
    )
    return reasons
