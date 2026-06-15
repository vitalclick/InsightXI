# InsightXI AI Service

FastAPI service for explainable, probabilistic football predictions.

**Focus:** this engine exists to surface InsightXI's **Pick of the Day** — the
single strongest, highest-confidence selection. Quality over quantity: every
prediction is probabilistic and ships with its reasoning so the one daily pick
can be trusted and justified (never "sure wins").

## Structure

```txt
app/
  main.py        FastAPI app + routes (/health, /predict, /feedback,
                 /evaluation, /drift, /adaptive/state, /adaptive/recompute)
  schemas.py     Pydantic request/response models
  features/      shared feature engineering (training + inference)
  inference/     prediction orchestration (Poisson + Elo + ML ensemble blend)
  models/        Elo, Poisson, ML ensemble loader, explanations
  training/      reproducible training pipeline + historical data generator
  evaluation/    metrics (log loss, Brier, ECE), PSI drift, report loading
  memory/        Experience Memory (L3): append-only prediction↔outcome log
  adaptive/      Adaptive Intelligence Engine: self-evaluation (L4),
                 dynamic weighting + confidence calibration (L5), personality
models/          serialized artifacts: *.joblib + metrics.json + drift_reference.npz
                 + experience.jsonl + adaptive_state.json
                 (git-ignored; regenerate with training / the feedback loop)
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

## Adaptive Intelligence Engine

A continuously self-improving layer on top of the static blend. **Off by
default** (`ADAPTIVE_ENABLED=false`) — when off, predictions are byte-compatible
with the static Poisson + Elo + ML blend. Turn it on and the service starts
learning from outcomes under a *conservative & explainable* contract.

The loop:

1. **Experience Memory (L3)** — every `/predict` appends the prediction, the
   per-model 1X2 views, the published blend, and the weights used to an
   append-only log (`models/experience.jsonl`).
2. **Feedback** — `POST /feedback` (`{match_id, league_id, outcome, home_goals,
   away_goals}`) records the actual result, completing the row. Idempotent.
3. **Recompute** — `POST /adaptive/recompute` rebuilds `adaptive_state.json`
   from memory: per-league blend **weights** (Dynamic Weighting, L5a) and a
   confidence **temperature** (Calibration, L5b), plus a **League Personality**
   profile and a **Self-Evaluation** report (L4) of which models are working.
4. **Adapt** — subsequent predictions in a league use its learned weights +
   calibration, and the response carries an `adjustment_trace` explaining the
   tilt. `GET /adaptive/state` introspects everything learned.

Guardrails (all configurable — see `.env.example`): a bucket only adapts after
`ADAPTIVE_MIN_SAMPLES` resolved predictions **and** only if the learned blend
beats the static baseline on that bucket's own evidence; each weight stays
within `ADAPTIVE_WEIGHT_DRIFT_CAP` of baseline; updates are EMA-smoothed;
evidence is recency-weighted (`ADAPTIVE_RECENCY_HALFLIFE_DAYS`); calibration can
only correct confidence *toward* observed frequency, never inflate it. Deleting
`adaptive_state.json` instantly reverts to the static blend.

See [`docs/adaptive-intelligence-engine.md`](../../docs/adaptive-intelligence-engine.md)
for the full design.
