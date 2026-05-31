"""Adaptive Intelligence Engine — weighting, calibration, evaluation, personality, state."""
from datetime import datetime, timedelta, timezone

import numpy as np

from app.adaptive import calibration, evaluate, personality, weighting
from app.adaptive.state import recompute
from app.adaptive.weighting import baseline_weights, blend
from app.memory.schema import ExperienceRecord
from app.memory.store import ExperienceStore


# --- helpers --------------------------------------------------------------
def _confident(y: int) -> list[float]:
    p = [0.1, 0.1, 0.1]
    p[y] = 0.8
    total = sum(p)
    return [v / total for v in p]


def _record(i: int, y: int, league: str = "epl", strong: str = "elo") -> ExperienceRecord:
    """A resolved record where ``strong`` nails the outcome and the other is uniform."""
    confident = _confident(y)
    uniform = [1 / 3, 1 / 3, 1 / 3]
    sub = {"elo": uniform[:], "poisson": uniform[:]}
    sub[strong] = confident
    ts = (datetime(2026, 1, 1, tzinfo=timezone.utc) + timedelta(days=i)).isoformat()
    rec = ExperienceRecord(
        match_id=f"{league}-{i}",
        league_id=league,
        predicted_at=ts,
        submodel_probs=sub,
        blended_probs=blend(sub, baseline_weights(["elo", "poisson"]))[:],  # type: ignore[index]
        weights_used=baseline_weights(["elo", "poisson"]),
        actual_outcome=y,
        actual_goals={"home": 2 if y == 0 else 1, "away": 2 if y == 2 else 1},
    )
    return rec


def _dataset(n: int = 60, strong: str = "elo", league: str = "epl") -> list[ExperienceRecord]:
    rng = np.random.default_rng(0)
    return [_record(i, int(rng.integers(0, 3)), league=league, strong=strong) for i in range(n)]


# --- weighting ------------------------------------------------------------
def test_baseline_weights_match_legacy_blend():
    assert baseline_weights(["poisson", "elo"]) == {"poisson": 0.6, "elo": 0.4}
    ens = baseline_weights(["ml", "poisson", "elo"])
    assert ens == {"ml": 0.5, "poisson": 0.3, "elo": 0.2}


def test_blend_is_normalised_weighted_average():
    probs = {"elo": (0.6, 0.2, 0.2), "poisson": (0.4, 0.4, 0.2)}
    h, d, a = blend(probs, {"elo": 0.5, "poisson": 0.5})
    assert abs(h + d + a - 1.0) < 1e-9
    assert abs(h - 0.5) < 1e-9


def test_solver_tilts_toward_stronger_model_within_cap():
    records = _dataset(strong="elo")
    base = baseline_weights(["elo", "poisson"])
    solved = weighting.solve_weights(records, ["elo", "poisson"], base, cap=0.2, halflife_days=180)
    # Elo dominates -> weight rises, but never past baseline + cap (0.4 + 0.2).
    assert solved["elo"] > base["elo"]
    assert solved["elo"] <= base["elo"] + 0.2 + 1e-9
    assert abs(sum(solved.values()) - 1.0) < 1e-9


def test_recency_weights_decay_with_age():
    records = _dataset(n=10)
    w = weighting.recency_weights(records, halflife_days=2.0)
    assert w[-1] == 1.0  # most recent record anchors at 1
    assert w[0] < w[-1]  # oldest is downweighted


def test_smooth_and_clip_moves_partway_and_respects_cap():
    base = baseline_weights(["elo", "poisson"])
    solved = {"elo": 0.6, "poisson": 0.4}
    smoothed = weighting.smooth_and_clip(solved, None, base, cap=0.2, step=0.3)
    assert base["elo"] < smoothed["elo"] < solved["elo"]  # EMA partial step
    assert abs(sum(smoothed.values()) - 1.0) < 1e-9
    for m, v in smoothed.items():
        assert abs(v - base[m]) <= 0.2 + 1e-9


# --- calibration ----------------------------------------------------------
def test_apply_temperature_flattens_and_preserves_argmax():
    flat = calibration.apply_temperature([0.7, 0.2, 0.1], temperature=2.0)
    assert abs(sum(flat) - 1.0) < 1e-9
    assert max(flat) < 0.7  # less confident
    assert int(np.argmax(flat)) == 0  # top selection unchanged


def test_apply_temperature_identity_at_one():
    same = calibration.apply_temperature([0.7, 0.2, 0.1], temperature=1.0)
    assert np.allclose(same, [0.7, 0.2, 0.1])


def test_fit_temperature_damps_overconfidence():
    # Predictions scream 0.9 on class 0 but it only happens ~60% of the time.
    records = []
    for i in range(100):
        y = 0 if i < 60 else (1 if i % 2 else 2)
        records.append(
            ExperienceRecord(
                match_id=f"m{i}",
                submodel_probs={"only": [0.9, 0.05, 0.05]},
                blended_probs=[0.9, 0.05, 0.05],
                actual_outcome=y,
            )
        )
    T = calibration.fit_temperature(records, {"only": 1.0}, halflife_days=1e6, min_samples=10)
    assert T > 1.05  # overconfident -> temperature above 1


# --- self-evaluation ------------------------------------------------------
def test_self_evaluation_ranks_stronger_model_first():
    records = _dataset(strong="elo")
    report = evaluate.self_evaluate(records, ["elo", "poisson"], baseline_weights(["elo", "poisson"]))
    assert report["model_ranking"][0] == "elo"
    assert report["models"]["elo"]["skill"] > report["models"]["poisson"]["skill"]


def test_beats_baseline_true_when_candidate_better():
    records = _dataset(strong="elo")
    base = baseline_weights(["elo", "poisson"])
    better = {"elo": 0.6, "poisson": 0.4}  # lean into the stronger model
    assert evaluate.beats_baseline(records, better, base)
    assert not evaluate.beats_baseline(records, base, base)


# --- personality ----------------------------------------------------------
def test_league_personality_summary():
    records = _dataset(n=30)
    prof = personality.league_personality(records)
    assert prof["n"] == 30
    assert 0.0 <= prof["draw_rate"] <= 1.0
    assert prof["avg_goals"] is not None
    assert abs(prof["home_win_rate"] + prof["draw_rate"] + prof["away_win_rate"] - 1.0) < 1e-6


def test_personality_explanations_flag_draw_heavy_leagues():
    lines = personality.personality_explanations({"n": 50, "draw_rate": 0.35, "avg_goals": 2.2})
    assert any("draw" in line.lower() for line in lines)


# --- state recompute + resolve -------------------------------------------
def test_recompute_adapts_league_with_enough_evidence(tmp_path):
    store = ExperienceStore(tmp_path / "exp.jsonl")
    for rec in _dataset(n=60, strong="elo", league="epl"):
        store.record_prediction(rec)
        store.record_outcome(rec.match_id, rec.actual_outcome, rec.actual_goals, "epl")

    # step=1.0 -> no EMA smoothing, so the solved tilt shows through directly.
    state = recompute(store, min_samples=20, cap=0.2, step=1.0, halflife=180, calibrate=True)
    assert "epl" in state.leagues and "global" in state.leagues
    epl = state.leagues["epl"]
    assert epl.adapted
    assert epl.weights["elo"] > epl.weights["poisson"]
    assert epl.evidence_count == 60
    assert any("tilted" in a or "calibration" in a for a in epl.adjustments)

    base = baseline_weights(["elo", "poisson"])
    res = state.resolve("epl", ["elo", "poisson"], base)
    assert res.adapted
    assert res.weights["elo"] > base["elo"]


def test_recompute_holds_baseline_when_evidence_sparse(tmp_path):
    store = ExperienceStore(tmp_path / "exp.jsonl")
    for rec in _dataset(n=5, strong="elo", league="epl"):
        store.record_prediction(rec)
        store.record_outcome(rec.match_id, rec.actual_outcome, rec.actual_goals, "epl")

    state = recompute(store, min_samples=50, cap=0.2, step=0.3, halflife=180, calibrate=True)
    epl = state.leagues["epl"]
    assert not epl.adapted
    assert epl.weights == baseline_weights(["elo", "poisson"])
    # resolve falls back to baseline for an unadapted bucket.
    res = state.resolve("epl", ["elo", "poisson"], epl.weights)
    assert not res.adapted


def test_state_serialises_round_trip(tmp_path):
    store = ExperienceStore(tmp_path / "exp.jsonl")
    for rec in _dataset(n=40, strong="elo", league="epl"):
        store.record_prediction(rec)
        store.record_outcome(rec.match_id, rec.actual_outcome, rec.actual_goals, "epl")
    state = recompute(store, min_samples=20)

    out = tmp_path / "adaptive_state.json"
    state.save(out)
    from app.adaptive.state import AdaptiveState

    reloaded = AdaptiveState.load(out)
    assert reloaded is not None
    assert reloaded.leagues["epl"].weights == state.leagues["epl"].weights
    assert reloaded.leagues["epl"].adapted == state.leagues["epl"].adapted
