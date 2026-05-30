"""InsightXI AI service — FastAPI app.

Serves explainable, probabilistic football predictions. Every prediction
includes machine-generated reasoning; outputs are never presented as
guaranteed outcomes (statistical integrity is non-negotiable).
"""
from fastapi import FastAPI

from app.inference.predictor import predict_match
from app.models.ml_ensemble import ensemble
from app.schemas import HealthResponse, PredictionRequest, PredictionResponse

app = FastAPI(
    title="InsightXI AI Service",
    description="Explainable football prediction models (Poisson + Elo + ML ensemble)",
    version="0.2.0",
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
