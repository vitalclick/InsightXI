"""Realistic historical match-data generator.

Rather than drawing every match i.i.d., this simulates multiple seasons of a
league: each team has latent attack/defence quality that evolves season to
season (mean-reversion + form momentum), Elo updates after every match, and
goals are drawn from a Poisson process. The result is a labelled dataset whose
feature/label relationship mirrors how the production models actually score
fixtures — a far better training distribution than pure noise.
"""
from __future__ import annotations

import numpy as np

from app.models.elo import HOME_FIELD_ELO

ELO_K = 24.0
HOME_ADV_GOALS = 1.12


def _expected_elo(home: float, away: float) -> float:
    return 1.0 / (1.0 + 10 ** (((away) - (home + HOME_FIELD_ELO)) / 400.0))


def generate(
    n_teams: int = 20,
    n_seasons: int = 6,
    rng: np.random.Generator | None = None,
) -> tuple[np.ndarray, np.ndarray]:
    """Return (X, y) over n_seasons double round-robins.

    Feature order matches app.features.engineering.FEATURE_NAMES:
      [elo_diff, attack_diff, defense_diff, form_diff, xg_diff]
    Labels: 0 home win, 1 draw, 2 away win.
    """
    rng = rng or np.random.default_rng(7)

    # Persistent latent quality per team (mean-reverts across seasons).
    attack = rng.normal(1.0, 0.22, n_teams).clip(0.5, 1.7)
    defense = rng.normal(1.0, 0.22, n_teams).clip(0.5, 1.7)
    elo = np.full(n_teams, 1500.0)

    rows: list[list[float]] = []
    labels: list[int] = []

    for _ in range(n_seasons):
        # Season-to-season drift: revert toward 1.0, add small shock.
        attack = (0.85 * attack + 0.15 * 1.0 + rng.normal(0, 0.05, n_teams)).clip(0.5, 1.8)
        defense = (0.85 * defense + 0.15 * 1.0 + rng.normal(0, 0.05, n_teams)).clip(0.5, 1.8)

        # Rolling form (recent points, 0..15) and recent xG, per team.
        form = np.full(n_teams, 7.5)
        roll_xg_for = attack * 1.4
        roll_xg_against = defense * 1.4

        fixtures = [(h, a) for h in range(n_teams) for a in range(n_teams) if h != a]
        rng.shuffle(fixtures)

        for home, away in fixtures:
            lam_home = float(np.clip(1.4 * attack[home] * defense[away] * HOME_ADV_GOALS, 0.2, 5))
            lam_away = float(np.clip(1.4 * attack[away] * defense[home], 0.2, 5))
            hg = int(rng.poisson(lam_home))
            ag = int(rng.poisson(lam_away))
            label = 0 if hg > ag else (1 if hg == ag else 2)

            # Feature snapshot BEFORE updating state (no leakage).
            xg_home_bal = roll_xg_for[home] - roll_xg_against[home]
            xg_away_bal = roll_xg_for[away] - roll_xg_against[away]
            rows.append(
                [
                    (elo[home] + HOME_FIELD_ELO) - elo[away],
                    attack[home] - attack[away],
                    defense[away] - defense[home],
                    form[home] - form[away],
                    xg_home_bal - xg_away_bal,
                ]
            )
            labels.append(label)

            # --- update dynamic state ---
            exp_home = _expected_elo(elo[home], elo[away])
            score_home = 1.0 if label == 0 else (0.5 if label == 1 else 0.0)
            elo[home] += ELO_K * (score_home - exp_home)
            elo[away] += ELO_K * ((1.0 - score_home) - (1.0 - exp_home))

            pts_home = 3 if label == 0 else (1 if label == 1 else 0)
            pts_away = 3 if label == 2 else (1 if label == 1 else 0)
            form[home] = float(np.clip(0.8 * form[home] + 0.2 * pts_home * 5, 0, 15))
            form[away] = float(np.clip(0.8 * form[away] + 0.2 * pts_away * 5, 0, 15))
            roll_xg_for[home] = 0.7 * roll_xg_for[home] + 0.3 * lam_home
            roll_xg_against[home] = 0.7 * roll_xg_against[home] + 0.3 * lam_away
            roll_xg_for[away] = 0.7 * roll_xg_for[away] + 0.3 * lam_away
            roll_xg_against[away] = 0.7 * roll_xg_against[away] + 0.3 * lam_home

    return np.array(rows, dtype=float), np.array(labels, dtype=int)
