"""Service-to-service auth on the AI service."""
import importlib

from fastapi.testclient import TestClient


def _client(monkeypatch, token: str | None):
    if token is None:
        monkeypatch.delenv("AI_SERVICE_TOKEN", raising=False)
    else:
        monkeypatch.setenv("AI_SERVICE_TOKEN", token)
    # Reimport so the module-level app picks up the env (dependency reads env
    # per-request, but reimporting keeps the test hermetic).
    main = importlib.import_module("app.main")
    return TestClient(main.app)


def test_health_is_public_even_with_token(monkeypatch):
    client = _client(monkeypatch, "secret-key")
    assert client.get("/health").status_code == 200


def test_protected_endpoint_rejects_without_key(monkeypatch):
    client = _client(monkeypatch, "secret-key")
    res = client.get("/feedback/pending")
    assert res.status_code == 401


def test_protected_endpoint_accepts_valid_key(monkeypatch):
    client = _client(monkeypatch, "secret-key")
    res = client.get("/feedback/pending", headers={"x-internal-key": "secret-key"})
    assert res.status_code == 200


def test_open_when_no_token_configured(monkeypatch):
    client = _client(monkeypatch, None)
    # No token set → endpoints are reachable without a header (sandbox/dev).
    assert client.get("/feedback/pending").status_code == 200
