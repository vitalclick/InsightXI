from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["model_backend"] in {"analytical", "ensemble"}


def test_predict_endpoint():
    payload = {
        "match_id": "m1",
        "home": {"name": "Real Madrid", "elo": 1680, "attack_strength": 1.4},
        "away": {"name": "Cadiz", "elo": 1380, "defense_strength": 1.5},
        "league_avg_goals": 1.4,
    }
    res = client.post("/predict", json=payload)
    assert res.status_code == 200
    body = res.json()
    assert body["match_id"] == "m1"
    assert len(body["markets"]) >= 6
    assert len(body["explanations"]) >= 1
