"""InsightXI AI service — FastAPI app.

Serves explainable, probabilistic football predictions. Every prediction
includes machine-generated reasoning; outputs are never presented as
guaranteed outcomes (statistical integrity is non-negotiable).
"""
from fastapi import FastAPI

from app.schemas import HealthResponse, PredictionRequest, PredictionResponse
from app.inference.predictor import predict_match

app = FastAPI(
    title="InsightXI AI Service",
    description="Explainable football prediction models",
    version="0.0.0",
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(service="insightxi-ai", status="ok")


@app.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest) -> PredictionResponse:
    """Return a probabilistic match prediction with explanations.

    NOTE: the current model is a transparent placeholder (home-advantage
    baseline). Replace with the Poisson/Elo/XGBoost ensemble in MVP phase 2.
    """
    return predict_match(request)
