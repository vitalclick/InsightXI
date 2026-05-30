# InsightXI AI Service

FastAPI service for explainable, probabilistic football predictions.

## Structure

```txt
app/
  main.py        FastAPI app + routes (/health, /predict, /evaluation, /drift)
  schemas.py     Pydantic request/response models
  features/      shared feature engineering (training + inference)
  inference/     prediction orchestration (Poisson + Elo + ML ensemble blend)
  models/        Elo, Poisson, ML ensemble loader, explanations
  training/      reproducible training pipeline + historical data generator
  evaluation/    metrics (log loss, Brier, ECE), PSI drift, report loading
models/          serialized artifacts: *.joblib + metrics.json + drift_reference.npz
                 (git-ignored; regenerate with the training command)
tests/           pytest suite
```

## Run

```bash
cd apps/ai-service
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
pytest
```

## Models & training

The 1X2 prediction blends three models: a Poisson scoreline model (all goal
markets), an Elo/Davidson model, and a calibrated **Logistic Regression +
XGBoost ensemble**. When no trained artifacts are present the service falls
back to the analytical Poisson+Elo blend, so it always works out of the box.

Train (writes models, an evaluation report, and a drift reference):

```bash
python -m app.training.train --seasons 6        # calibrated (default)
python -m app.training.train --no-calibrate     # skip probability calibration
```

Training uses a realistic multi-season historical simulation
(`app/training/historical.py`) — team strengths evolve season to season, Elo
updates per match, goals are Poisson — so the feature/label relationship
matches how fixtures are scored in production. Probabilities are calibrated
(sigmoid CV) so confidence bands are honest.

## Evaluation & drift monitoring

* `GET /evaluation` — latest training report: log loss, Brier, ECE
  (calibration error), accuracy.
* `POST /drift` — Population Stability Index of recent feature vectors vs the
  training distribution; flags `stable` / `moderate` / `major` and recommends
  retraining on major shift.

Both degrade gracefully to `unavailable` before the first training run.
