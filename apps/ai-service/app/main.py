"""InsightXI AI service — FastAPI app.

Serves explainable, probabilistic football predictions. Every prediction
includes machine-generated reasoning; outputs are never presented as
guaranteed outcomes (statistical integrity is non-negotiable).
"""
from fastapi import FastAPI

from app.evaluation.report import drift_against_reference, load_metrics
from app.inference.predictor import predict_match
from app.models.ml_ensemble import ensemble
from app.schemas import (
    DriftRequest,
    DriftResponse,
    EvaluationResponse,
    HealthResponse,
    PredictionRequest,
    PredictionResponse,
)

app = FastAPI(
    title="InsightXI AI Service",
    description="Explainable football prediction models (Poisson + Elo + ML ensemble)",
    version="0.3.0",
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


@app.get("/evaluation", response_model=EvaluationResponse)
def evaluation() -> EvaluationResponse:
    """Latest training evaluation report (log loss, Brier, ECE, accuracy)."""
    report = load_metrics()
    if report is None:
        return EvaluationResponse(status="unavailable")
    return EvaluationResponse(status="ok", report=report)


@app.post("/drift", response_model=DriftResponse)
def drift(request: DriftRequest) -> DriftResponse:
    """PSI-based feature drift of recent fixtures vs the training distribution."""
    report = drift_against_reference(request.features)
    return DriftResponse(status=report.get("status", "ok"), report=report)
