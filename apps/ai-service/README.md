# InsightXI AI Service

FastAPI service for explainable, probabilistic football predictions.

## Structure (from the InsightXI AI service spec)

```txt
app/
  main.py        FastAPI app + routes
  schemas.py     Pydantic request/response models
  inference/     model loading + prediction (present: predictor.py baseline)
models/          serialized trained models (versioned artifacts)
training/        training pipelines (reproducible)
datasets/        dataset versioning
features/        feature engineering pipelines
evaluation/      metrics + prediction drift monitoring
tests/           pytest suite
```

## Run

```bash
cd apps/ai-service
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"          # or: pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
pytest                            # run tests
```

The current `/predict` uses a transparent **baseline** (home-advantage +
xG/form heuristic), not a trained model — replace with the Poisson / Elo /
XGBoost ensemble in MVP Phase 2.
