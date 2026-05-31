"""End-to-end adaptive loop over the HTTP API: predict -> feedback -> recompute."""
import pytest
from fastapi.testclient import TestClient

import app.adaptive.state as state_mod
import app.memory.store as store_mod
from app.main import app

client = TestClient(app)


def _reset_singletons():
    store_mod.store._loaded = False
    store_mod.store._records = {}
    store_mod.store._path = None
    state_mod._cache.reset()


@pytest.fixture
def adaptive_env(tmp_path, monkeypatch):
    monkeypatch.setenv("ADAPTIVE_ENABLED", "1")
    monkeypatch.setenv("ADAPTIVE_CALIBRATION", "1")
    monkeypatch.setenv("ADAPTIVE_MIN_SAMPLES", "20")
    monkeypatch.setenv("EXPERIENCE_PATH", str(tmp_path / "exp.jsonl"))
    monkeypatch.setenv("ADAPTIVE_STATE_PATH", str(tmp_path / "adaptive_state.json"))
    _reset_singletons()
    yield
    _reset_singletons()


def _predict_payload(i: int, league: str = "epl") -> dict:
    # Alternate strong-home / strong-away so outcomes vary across the bucket.
    home_strong = i % 2 == 0
    return {
        "match_id": f"{league}-{i}",
        "league_id": league,
        "home": {
            "name": "Home",
            "elo": 1650 if home_strong else 1450,
            "attack_strength": 1.3 if home_strong else 0.9,
            "defense_strength": 0.8 if home_strong else 1.2,
        },
        "away": {
            "name": "Away",
            "elo": 1450 if home_strong else 1650,
            "attack_strength": 0.9 if home_strong else 1.3,
            "defense_strength": 1.2 if home_strong else 0.8,
        },
        "league_avg_goals": 1.4,
    }


def test_predict_records_and_marks_adaptive(adaptive_env):
    res = client.post("/predict", json=_predict_payload(1))
    assert res.status_code == 200
    body = res.json()
    assert body["adaptive"] is True
    assert "adjustment_trace" in body

    state = client.get("/adaptive/state").json()
    assert state["enabled"] is True
    assert state["counts"]["total"] == 1
    assert state["counts"]["pending"] == 1  # no outcome yet


def test_feedback_resolves_and_is_idempotent(adaptive_env):
    client.post("/predict", json=_predict_payload(1))
    r1 = client.post(
        "/feedback",
        json={"match_id": "epl-1", "league_id": "epl", "outcome": 0, "home_goals": 2, "away_goals": 0},
    )
    assert r1.status_code == 200
    assert r1.json()["counts"]["resolved"] == 1

    # Re-posting the same match must not double-count.
    client.post("/feedback", json={"match_id": "epl-1", "league_id": "epl", "outcome": 0})
    assert client.get("/adaptive/state").json()["counts"]["resolved"] == 1


def test_full_loop_recompute_builds_buckets_and_evaluation(adaptive_env):
    n = 40
    for i in range(n):
        client.post("/predict", json=_predict_payload(i))
        # Home wins when home is the strong side, else away wins.
        outcome = 0 if i % 2 == 0 else 2
        client.post(
            "/feedback",
            json={"match_id": f"epl-{i}", "league_id": "epl", "outcome": outcome,
                  "home_goals": 2, "away_goals": 0},
        )

    recompute = client.post("/adaptive/recompute").json()
    assert recompute["status"] == "ok"
    assert recompute["counts"]["resolved"] == n
    assert "epl" in recompute["leagues"]
    assert "global" in recompute["leagues"]
    epl = recompute["leagues"]["epl"]
    assert epl["evidence_count"] == n
    assert epl["adjustments"]  # always explains what it did
    assert epl["personality"]["n"] == n

    # Live experience metrics now surface through /evaluation.
    ev = client.get("/evaluation").json()
    assert ev["status"] == "ok"
    assert ev["report"]["experience"]["n"] == n

    # A subsequent prediction reflects the (now adapted) league bucket if it adapted.
    body = client.post("/predict", json=_predict_payload(99)).json()
    assert body["adaptive"] is True
    if epl["adapted"]:
        assert body["adjustment_trace"]


def test_disabled_engine_does_not_record_or_adapt(tmp_path, monkeypatch):
    monkeypatch.setenv("ADAPTIVE_ENABLED", "0")
    monkeypatch.setenv("EXPERIENCE_PATH", str(tmp_path / "exp.jsonl"))
    monkeypatch.setenv("ADAPTIVE_STATE_PATH", str(tmp_path / "adaptive_state.json"))
    _reset_singletons()
    try:
        body = client.post("/predict", json=_predict_payload(1)).json()
        assert body["adaptive"] is False
        assert body["adjustment_trace"] == []
        # Nothing is written to memory when the engine is off.
        assert store_mod.store.counts()["total"] == 0
    finally:
        _reset_singletons()
