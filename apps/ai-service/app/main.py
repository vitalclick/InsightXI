"""InsightXI AI service — FastAPI app.

Serves explainable, probabilistic football predictions. Every prediction
includes machine-generated reasoning; outputs are never presented as
guaranteed outcomes (statistical integrity is non-negotiable).

The Adaptive Intelligence Engine (feature-flagged via ``ADAPTIVE_ENABLED``)
adds an Experience Memory + feedback loop, per-league dynamic blend weighting,
and confidence calibration on top of the static Poisson + Elo + ML blend.
"""
from fastapi import FastAPI

from app.adaptive import config
from app.adaptive.state import GLOBAL_BUCKET, get_adaptive_state, recompute_and_persist
from app.evaluation.report import drift_against_reference, load_metrics
from app.inference.predictor import predict_match
from app.memory.store import store
from app.models.ml_ensemble import ensemble
from app.schemas import (
    AdaptiveStateResponse,
    DriftRequest,
    DriftResponse,
    EvaluationResponse,
    FeedbackRequest,
    FeedbackResponse,
    HealthResponse,
    PredictionRequest,
    PredictionResponse,
    RecomputeResponse,
)

app = FastAPI(
    title="InsightXI AI Service",
    description="Explainable football prediction models (Poisson + Elo + ML ensemble) "
    "with a continuously self-improving Adaptive Intelligence Engine",
    version="0.4.0",
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        service="insightxi-ai",
        status="ok",
        model_backend="ensemble" if ensemble.available else "analytical",
    )


@app.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest) -> PredictionResponse:
    """Return a probabilistic, explainable match prediction with markets."""
    return predict_match(request)


@app.post("/feedback", response_model=FeedbackResponse)
def feedback(request: FeedbackRequest) -> FeedbackResponse:
    """Record a finished match's actual result, completing its memory row.

    Idempotent on ``match_id``. This is the signal that drives continuous
    learning; recompute the adaptive state afterwards (job or ``/adaptive/recompute``).
    """
    goals = None
    if request.home_goals is not None and request.away_goals is not None:
        goals = {"home": request.home_goals, "away": request.away_goals}
    store.record_outcome(
        request.match_id,
        outcome=request.outcome,
        goals=goals,
        league_id=request.league_id,
    )
    return FeedbackResponse(status="ok", match_id=request.match_id, counts=store.counts())


@app.get("/evaluation", response_model=EvaluationResponse)
def evaluation() -> EvaluationResponse:
    """Training evaluation report, plus live experience metrics when available."""
    report = load_metrics()
    state = get_adaptive_state()
    live = None
    if state is not None:
        glob = state.leagues.get(GLOBAL_BUCKET)
        if glob is not None:
            live = {
                "n": glob.evidence_count,
                "blend": glob.self_eval.get("blend"),
                "model_ranking": glob.self_eval.get("model_ranking"),
            }
    if report is None and live is None:
        return EvaluationResponse(status="unavailable")
    merged = dict(report or {})
    if live is not None:
        merged["experience"] = live
    return EvaluationResponse(status="ok", report=merged)


@app.post("/drift", response_model=DriftResponse)
def drift(request: DriftRequest) -> DriftResponse:
    """PSI-based feature drift of recent fixtures vs the training distribution."""
    report = drift_against_reference(request.features)
    return DriftResponse(status=report.get("status", "ok"), report=report)


def _league_summary(state) -> dict:
    out = {}
    for lid, ls in state.leagues.items():
        out[lid] = {
            "evidence_count": ls.evidence_count,
            "adapted": ls.adapted,
            "weights": ls.weights,
            "temperature": ls.temperature,
            "model_set": ls.model_set,
            "personality": ls.personality,
            "self_eval": {
                "blend": ls.self_eval.get("blend"),
                "model_ranking": ls.self_eval.get("model_ranking"),
            },
            "adjustments": ls.adjustments,
        }
    return out


@app.get("/adaptive/state", response_model=AdaptiveStateResponse)
def adaptive_state() -> AdaptiveStateResponse:
    """Introspect the current learned state: weights, calibration, personality."""
    enabled = config.adaptive_enabled()
    state = get_adaptive_state()
    if state is None:
        return AdaptiveStateResponse(
            status="unavailable", enabled=enabled, counts=store.counts()
        )
    return AdaptiveStateResponse(
        status="ok",
        enabled=enabled,
        updated_at=state.updated_at,
        feature_version=state.feature_version,
        leagues=_league_summary(state),
        counts=store.counts(),
    )


@app.post("/adaptive/recompute", response_model=RecomputeResponse)
def adaptive_recompute() -> RecomputeResponse:
    """Rebuild adaptive state from Experience Memory (called by the retrain job)."""
    state = recompute_and_persist(store)
    return RecomputeResponse(
        status="ok",
        updated_at=state.updated_at,
        leagues=_league_summary(state),
        counts=store.counts(),
    )
