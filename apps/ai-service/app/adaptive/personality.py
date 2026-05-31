"""League Personality — a descriptive, explainable profile per league.

Derived purely from resolved experience: how many goals, how often draws, the
realised home advantage, how reliably the favourite wins. It is *descriptive
only* — it never silently changes a probability. Its sole effects are:
  * enriching the human-readable explanations (league-aware reasoning), and
  * providing a sensible ``league_avg_goals`` prior for the Poisson model.

"EPL = high tempo, Serie A = tactical/low-scoring, ..." stops being an assertion
and becomes something the system measures from its own track record.
"""
from __future__ import annotations

from typing import Optional, Sequence

import numpy as np

from app.memory.schema import AWAY, DRAW, HOME, ExperienceRecord


def league_personality(records: Sequence[ExperienceRecord]) -> Optional[dict]:
    """Summary stats for a league, or None when there is no resolved evidence."""
    if not records:
        return None

    outcomes = np.array([int(r.actual_outcome) for r in records])
    n = len(outcomes)

    goals = [
        (r.actual_goals or {}).get("home", 0) + (r.actual_goals or {}).get("away", 0)
        for r in records
        if r.actual_goals is not None
    ]
    avg_goals = round(float(np.mean(goals)), 3) if goals else None

    home_rate = round(float(np.mean(outcomes == HOME)), 4)
    draw_rate = round(float(np.mean(outcomes == DRAW)), 4)
    away_rate = round(float(np.mean(outcomes == AWAY)), 4)

    favourite_hits = sum(
        1
        for r in records
        if r.blended_probs and int(np.argmax(r.blended_probs)) == int(r.actual_outcome)
    )
    favourite_strike_rate = round(favourite_hits / n, 4)

    return {
        "n": n,
        "avg_goals": avg_goals,
        "home_win_rate": home_rate,
        "draw_rate": draw_rate,
        "away_win_rate": away_rate,
        # Realised home edge in outcome share (positive => home advantage holds).
        "home_advantage": round(home_rate - away_rate, 4),
        "favourite_strike_rate": favourite_strike_rate,
    }


def personality_explanations(personality: Optional[dict]) -> list[str]:
    """Optional league-aware lines appended to a prediction's reasoning."""
    if not personality or personality.get("n", 0) < 1:
        return []
    out: list[str] = []
    draw_rate = personality.get("draw_rate")
    if draw_rate is not None and draw_rate >= 0.30:
        out.append(
            f"This league draws often ({draw_rate * 100:.0f}% historically) — "
            "the model tempers narrow favourites accordingly"
        )
    avg_goals = personality.get("avg_goals")
    if avg_goals is not None:
        if avg_goals >= 2.9:
            out.append(f"High-scoring league profile (~{avg_goals:.1f} goals/match historically)")
        elif avg_goals <= 2.3:
            out.append(f"Low-scoring league profile (~{avg_goals:.1f} goals/match historically)")
    return out
