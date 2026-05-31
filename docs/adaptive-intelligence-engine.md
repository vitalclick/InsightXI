# Adaptive Intelligence Engine — Architecture & Design

**Status:** Implemented (Phases A–D) — engine OFF by default (`ADAPTIVE_ENABLED=false`)
**Author:** InsightXI engineering
**Scope:** `apps/ai-service` (primary), `apps/api` (feedback wiring), `apps/web` (transparency surfaces)
**Supersedes / extends:** the static ensemble in `apps/ai-service/app/inference/predictor.py`
**Default posture:** **Conservative & explainable** (bounded adaptation, minimum-sample gating, full audit trail, graceful fallback to the static blend)

> **Implementation note.** This document was written as a proposal and is kept as
> the living design record. All five layers are now built and tested (offline,
> deterministic): see `app/memory/`, `app/adaptive/`, the new endpoints in
> `app/main.py`, the backend reconciliation in
> `apps/api/src/modules/predictions/adaptive-feedback.service.ts`, and the web
> transparency panel in `components/match/match-intel.tsx`. Where the build chose
> a concrete option among the proposal's alternatives, §12 records the decision.

---

## 1. Purpose

Turn InsightXI's prediction stack from a **static, occasionally-retrained** model
into a **continuously self-improving football intelligence system** — without
violating any of the platform's non-negotiables (no fake certainty, no opaque
predictions, everything probabilistic and explainable).

This document describes *what* we will build, *why*, *where it slots into the
existing code*, and the *phased plan* to get there. It is intentionally written
to be reviewed and amended before any code is written.

### The one-line objective

> The system does not try to "predict every match correctly." It tries to
> **continuously reduce its own uncertainty** — measurably, and with an
> explanation for every adjustment it makes.

### Non-goals

* "Solving football" / eliminating randomness — impossible and off-brand.
* Online gradient updates per match (unstable, hard to audit). We retrain on a
  schedule and adapt *blend weights + calibration* continuously between retrains.
* Any change to the probabilistic, explainable contract of `/predict`.

---

## 2. Where we are today (grounded in the codebase)

The skeleton is already well-positioned. Mapping the vision's five layers onto
what exists:

| Layer (vision) | Exists today? | Where |
| --- | --- | --- |
| **L1 — Statistical foundation** (Poisson, Elo, xG) | ✅ Built | `app/models/poisson.py`, `app/models/elo.py` |
| **L2 — ML layer** (LogReg + XGBoost ensemble) | ✅ Built | `app/models/ml_ensemble.py`, `app/training/train.py` |
| **L3 — Experience Memory** | ❌ Missing | — predictions are stateless, never stored, never joined to outcomes |
| **L4 — Self-Evaluation** | ⚠️ Primitives only | `app/evaluation/metrics.py` (log loss, Brier, ECE, reliability), `app/evaluation/drift.py` (PSI) exist but are **never fed real prediction-vs-outcome data** |
| **L5 — Dynamic Weighting + Calibration** | ❌ Missing | the blend is **hardcoded & global** in `predictor.py` (`0.5·ML + 0.3·Poisson + 0.2·Elo`); calibration is applied **only at train time**, not at inference |
| **League Personality** | ❌ Missing | — |

Supporting facts that shape the design:

* **The simulator already produces outcomes.** `app/training/historical.py`
  generates `(features, label∈{home,draw,away})` per match — so the entire
  feedback loop can be built and tested **fully offline and deterministically**,
  with no live provider, Postgres, or Redis required.
* **Backend already has the seam.** `apps/api` exposes
  `GET /predictions/match/:id` via `predictions.service.ts` →
  `ai-prediction.client.ts` → FastAPI `POST /predict`. A `retrain-models`
  BullMQ job already exists in `jobs/intelligence.processor.ts` — but it is a
  **placeholder log**. That is the natural trigger for closing the loop.
* **Graceful degradation is the house pattern.** `ml_ensemble.py` already falls
  back to the analytical blend when artifacts are missing; `/evaluation` and
  `/drift` already return `unavailable` before first training. The adaptive
  layer must follow the same rule: **if memory is sparse or disabled, behave
  exactly like today.**

---

## 3. Design principles (the "conservative & explainable" contract)

These are binding constraints on every adaptive component below.

1. **Bounded adaptation.** Learned blend weights may only drift within hard caps
   around the static baseline (e.g. each model's weight stays within
   `baseline ± 0.20`, renormalized). The system can *tilt*, never *lurch*.
2. **Minimum-sample gating.** No adjustment is applied for a (league, context)
   bucket until it has accumulated `MIN_SAMPLES` resolved predictions
   (default **50**). Below that, fall back to the global baseline.
3. **Recency with a floor.** Recent outcomes weigh more (exponential half-life,
   default **180 days**) but old evidence never fully disappears — prevents
   overfitting a hot/cold streak.
4. **Every adjustment is explained.** The engine emits a machine-readable
   *adjustment record* (what changed, why, on how much evidence) that surfaces
   in the API and UI. No silent weight changes — ever.
5. **Always reversible & inspectable.** Adaptation state lives in a versioned
   artifact (`adaptive_state.json`) that can be diffed, frozen, or discarded to
   instantly revert to the static blend. A kill-switch env flag disables the
   whole layer.
6. **No new certainty.** Calibration only ever *corrects* over/under-confidence
   toward observed frequencies. It can never manufacture a higher confidence
   band than the evidence supports. The "Avoid excessive 90%+" rule still holds.
7. **Statistical integrity first.** We report whether adaptation is actually
   *helping* (out-of-sample log loss / Brier / ECE vs the static baseline). If
   it is not beating baseline on held-out data, it does not ship for that bucket.

---

## 4. Target architecture

```txt
                          ┌─────────────────────────────────────────────┐
   POST /predict  ───────▶│  inference/predictor.py                      │
                          │   L1 Poisson  ─┐                             │
                          │   L2 Elo       ├─▶  ADAPTIVE BLEND  ─▶ calib ─┼──▶ PredictionResponse
                          │   L2 ML ens.  ─┘     ▲           ▲           │     (+ adjustment trace)
                          └──────────────────────┼───────────┼──────────┘
                                                 │           │
                              L5 Dynamic Weights │           │ L5 Confidence Calibration
                              (per-league/context)           (per-league isotonic/Platt)
                                                 │           │
                          ┌──────────────────────┴───────────┴──────────┐
                          │  adaptive/  (NEW PACKAGE)                     │
                          │   state.py        adaptive_state.json (I/O)   │
                          │   weighting.py    L5 weight solver            │
                          │   calibration.py  L5 confidence mapping       │
                          │   personality.py  League Personality          │
                          │   evaluate.py     L4 self-evaluation loop      │
                          └──────────────────────▲───────────────────────┘
                                                 │ reads
                          ┌──────────────────────┴───────────────────────┐
   POST /feedback ───────▶│  memory/  (NEW PACKAGE)  — L3 Experience       │
   (match resolved)       │   store.py   append-only experience log        │
                          │   schema     ExperienceRecord                  │
                          │   experience.parquet / .jsonl  (artifact)      │
                          └────────────────────────────────────────────────┘
                                                 ▲
                                                 │ POST feedback when match FINISHED
                          ┌──────────────────────┴───────────────────────┐
   apps/api               │  predictions + jobs(retrain-models)           │
                          │  store prediction → on result → POST /feedback │
                          └────────────────────────────────────────────────┘
```

Two new Python packages in `apps/ai-service/app`: **`memory/`** (L3) and
**`adaptive/`** (L4 + L5 + League Personality). The existing `evaluation/`
metrics become the measurement engine for L4. `predictor.py` gains an adaptive
path guarded by a feature flag.

---

## 5. Component specifications

### 5.1 L3 — Experience Memory  (`app/memory/`)

The differentiator. An **append-only** record of what we predicted, what
actually happened, and the full feature/sub-model state at prediction time.

**`ExperienceRecord`** (one row per resolved match):

```jsonc
{
  "match_id": "epl-2025-arsenal-newcastle",
  "league_id": "epl",
  "predicted_at": "2026-05-20T12:00:00Z",
  "resolved_at":  "2026-05-22T21:00:00Z",
  "feature_version": "v1",
  "features": [0.41, 0.22, -0.10, 3.0, 0.35],   // the L1/L2 input vector
  "submodel_probs": {                            // each model's 1X2 BEFORE blend
    "poisson": [0.58, 0.24, 0.18],
    "elo":     [0.61, 0.21, 0.18],
    "ml":      [0.55, 0.27, 0.18]
  },
  "blended_probs": [0.56, 0.26, 0.18],           // what we actually published
  "confidence_published": 0.56,
  "weights_used": {"poisson":0.30,"elo":0.20,"ml":0.50},
  "actual_outcome": 1,                            // 0 home / 1 draw / 2 away
  "actual_goals": {"home": 2, "away": 2}
}
```

**`store.py`** responsibilities:

* `record_prediction(...)` — write the prediction-time portion (called from
  `/predict`, or staged by the backend; see §6).
* `record_outcome(match_id, outcome, goals)` — completes the row (called from
  `/feedback`).
* `recent(league_id=None, since=None) -> list[ExperienceRecord]` — windowed read.
* Storage: a single append artifact under `MODELS_DIR` (reuse the existing env
  var). **JSONL** for simplicity/inspectability in Phase A; optional Parquet for
  scale later. No external DB dependency — consistent with the offline-first
  ethos. Atomic append + periodic compaction.
* **Privacy/size:** records are match-level analytics only (no PII), capped by a
  retention window (default 3 seasons) with rollups beyond that.

> **Why append-only file, not Postgres?** Keeps the AI service self-contained
> and testable offline, mirrors how `models/*.joblib` artifacts already work,
> and avoids coupling model learning to backend availability. The backend's
> Postgres (see §6) becomes the *durable system of record*; the AI service keeps
> a *working-set artifact* it owns. Both can be reconstructed from the other.

### 5.2 L4 — Self-Evaluation Loop  (`app/adaptive/evaluate.py`)

Reuses `app/evaluation/metrics.py` — we are finally feeding it **real
prediction-vs-outcome pairs** instead of a train/test split.

For each bucket (global, per-league, and optionally per-context such as
"big favourite" vs "tight match"):

* Compute, over the recency-weighted window, for **each sub-model and the blend**:
  log loss, Brier, accuracy, and ECE (calibration error) + reliability curve.
* Produce a **per-model skill score** = relative improvement over a uniform
  `[1/3,1/3,1/3]` baseline (so a model that's worse than guessing scores ≤ 0).
* Answer the vision's core questions concretely, e.g.:
  * *"Which signals are working?"* → sub-model skill ranking per league.
  * *"When are we overconfident?"* → reliability bins where confidence > accuracy.
* Emit a **`SelfEvaluationReport`** persisted alongside `metrics.json` and served
  via an extended `/evaluation` (now able to report live experience metrics, not
  just last-train metrics).

This layer is **read-only** — it measures, it never changes predictions. L5
consumes its output.

### 5.3 L5a — Dynamic Weighting Engine  (`app/adaptive/weighting.py`)

Replaces the hardcoded `0.5/0.3/0.2` with **per-league learned weights**, under
the §3 constraints.

* **Method (Phase B):** convex-combination weight search minimizing
  recency-weighted log loss of the blend on the experience window, solved per
  league. Closed, cheap, deterministic; no gradient infra.
* **Constraints:** weights ≥ 0, sum to 1, and **each within `±0.20` of the
  static baseline** (`WEIGHT_DRIFT_CAP`). Below `MIN_SAMPLES`, return baseline.
* **Smoothing:** new weights are an EMA blend with the previous state
  (`WEIGHT_STEP`, default 0.3) so weights move gradually across retrains.
* **Output:** `{league_id: {poisson, elo, ml}}` + an **adjustment record**:
  *"EPL: ML weight 0.50→0.57 (+0.07), Elo 0.20→0.15. Basis: 214 matches,
  ML log-loss 0.94 vs Elo 1.02 over last 180d."*

This realizes the vision's "league personality" of *feature/model effectiveness*
— e.g. lineup-driven ML mattering more in one league, Poisson structure in
another — but measured, capped, and explained rather than asserted.

### 5.3b L5b — Confidence Calibration Engine  (`app/adaptive/calibration.py`)

Learns, per league, a monotonic map from published confidence → empirical
frequency, from the experience window (isotonic regression, or Platt when data
is thin), applied to the blended probabilities at inference.

* Strictly **monotonic** and **shrunk toward identity** when samples are low
  (so sparse buckets are near no-ops). Renormalize the 1X2 vector after mapping.
* Can only move confidence **toward observed accuracy** — never inflate beyond
  evidence (§3.6). Confidence-band labels (`Medium/Strong/Very Strong/Elite`)
  are computed *after* calibration, keeping the published bands honest.
* Emits an adjustment record per correction (e.g. *"EPL predictions in the
  70–80% band realized 71% — confidence nudged down 4pts on average"*).

### 5.4 League Personality  (`app/adaptive/personality.py`)

A descriptive, explainable profile derived from experience memory per league:
avg goals, draw rate, realized home advantage, scoring volatility, favourite
strike-rate. Drives the existing `build_explanations()`
(`app/models/explain.py`) so reasoning becomes league-aware
(*"Serie A draws are common; the model tempers a narrow favourite here"*) and
provides priors for the Poisson `league_avg_goals` input. **Descriptive only** —
no hidden effect on probabilities beyond the audited L5 path.

### 5.5 Adaptive state artifact  (`app/adaptive/state.py`)

Single source of truth for everything learned between retrains:
`adaptive_state.json` = `{version, updated_at, weights_by_league,
calibrators_by_league (serialized), personality_by_league, evidence_counts,
last_self_eval}`. Loaded once at inference, refreshed by the
recompute job (§7). Deleting it = instant revert to static behavior.

---

## 6. Backend integration (`apps/api`) — closing the loop

Today predictions are stateless and the `retrain-models` job is a stub. To feed
L3, the backend becomes the durable system of record:

1. **Persist predictions.** New `predictions` table (Postgres schema in
   `apps/api/src/db/schema.sql`): `match_id, league_id, predicted_at, probs
   (home/draw/away), confidence, weights_used, submodel_probs (jsonb),
   model_backend`. Written when a prediction is served (or lazily, on first
   request per upcoming fixture). Gated by `DATA_BACKEND=postgres`; memory mode
   simply skips persistence (consistent with today).
2. **Detect resolution.** When the hourly `refresh-data` job
   (`jobs/intelligence.processor.ts`) ingests a match that flipped to
   `FINISHED`, look up the stored prediction and **POST it to the AI service
   `/feedback`** with the actual outcome.
3. **Drive retrain/recompute.** The `retrain-models` job (currently a log)
   triggers the AI service to (a) recompute `adaptive_state.json` from the
   experience window — cheap, frequent — and (b) optionally run full
   `python -m app.training.train` — heavier, less frequent. Both already have a
   home in `intelligence.processor.ts`.
4. **Surface adaptation.** `predictions.service.ts` passes through the new
   `adjustment_trace` so the web app can show *why* a prediction was nudged.

All four are **flag-gated and backward compatible** — with `DATA_BACKEND=memory`
and the adaptive flag off, behavior is byte-for-byte today's.

---

## 7. API surface changes (`app/main.py`)

| Endpoint | Change | Notes |
| --- | --- | --- |
| `POST /predict` | response gains optional `adjustment_trace` + `adaptive: bool` | unchanged when flag off |
| `POST /feedback` | **new** — `{match_id, outcome, goals, ...}` completes an experience row | idempotent on `match_id` |
| `GET /evaluation` | extended — can report **live experience** metrics (per-model, per-league) in addition to last-train metrics | still `unavailable` pre-data |
| `GET /adaptive/state` | **new** — current weights, calibration summary, personality, evidence counts, last self-eval | read-only introspection / debugging / UI |
| `POST /adaptive/recompute` | **new (internal)** — rebuild `adaptive_state.json` from memory | called by backend `retrain-models` job |

New Pydantic models in `app/schemas.py`: `FeedbackRequest`, `AdjustmentRecord`,
`AdaptiveState`, `SelfEvaluationReport`.

---

## 8. Configuration (env flags)

| Flag | Default | Meaning |
| --- | --- | --- |
| `ADAPTIVE_ENABLED` | `false` | Master kill-switch. Off ⇒ today's static blend. |
| `ADAPTIVE_MIN_SAMPLES` | `50` | Min resolved predictions per bucket before adapting. |
| `ADAPTIVE_WEIGHT_DRIFT_CAP` | `0.20` | Max deviation of any model weight from baseline. |
| `ADAPTIVE_WEIGHT_STEP` | `0.30` | EMA step for weight updates (smoothing). |
| `ADAPTIVE_RECENCY_HALFLIFE_DAYS` | `180` | Exponential recency half-life. |
| `ADAPTIVE_CALIBRATION` | `true` | Enable L5b confidence calibration. |
| `EXPERIENCE_RETENTION_SEASONS` | `3` | Memory retention window before rollup. |

Documented in `.env.example` and `apps/ai-service/README.md`.

---

## 9. Phased implementation plan

Each phase is independently shippable, tested, and **off by default** until
proven against baseline. Branch: `claude/beautiful-edison-y1azv`.
**All four phases are now implemented and tested** (✅).

### Phase A — Experience Memory + Feedback (foundation) ✅
* `app/memory/store.py` + `ExperienceRecord` schema; `/feedback` endpoint;
  `/predict` records prediction-time state (behind flag).
* Backend: `predictions` table + POST-to-`/feedback` on match resolution.
* **Tests:** record→resolve→read round-trip; idempotency; offline determinism.
* **Exit:** experience accrues end-to-end on the simulator; zero behavior change
  to published predictions.

### Phase B — Self-Evaluation + Dynamic Weighting ✅
* `app/adaptive/evaluate.py` (reuse `evaluation/metrics.py`) +
  `app/adaptive/weighting.py` + `state.py`; adaptive path in `predictor.py`.
* `POST /adaptive/recompute`, `GET /adaptive/state`, extended `/evaluation`.
* **Tests:** capped weights, min-sample gating, EMA smoothing, and a
  **backtest proving lower out-of-sample log loss vs static** on held-out
  simulated seasons (otherwise the bucket stays on baseline).
* **Exit:** measurable, bounded, explained improvement; full revert via artifact
  delete.

### Phase C — Confidence Calibration + League Personality ✅
* `app/adaptive/calibration.py` (isotonic/Platt, shrunk) + `personality.py`;
  league-aware explanations via `explain.py`.
* **Tests:** ECE reduction on held-out data; monotonicity; no confidence
  inflation; identity behavior on sparse buckets.

### Phase D — Closing the loop in production wiring + UI transparency ✅
* Wire `retrain-models` job to call `/adaptive/recompute` (frequent) and
  `train` (scheduled); pass `adjustment_trace` to web.
* Web: an "Adaptive Intelligence" panel showing per-league weights, calibration
  health, and recent adjustments — pure transparency, on-brand.

---

## 10. How we prove it's actually learning (acceptance metrics)

Adaptation ships for a bucket **only if** it beats the static baseline
**out-of-sample**:

* **Primary:** lower multiclass **log loss** and **Brier** on held-out seasons.
* **Calibration:** lower **ECE**; reliability curve closer to diagonal.
* **Stability:** weight trajectories stay within caps; no oscillation
  (variance bound across recompute cycles).
* **Honesty:** distribution of published confidence bands does not inflate;
  90%+ outputs remain rare (CLAUDE.md rule).
* **Auditability:** every shipped adjustment has a human-readable record.

These run as part of the AI-service test suite against the deterministic
simulator, so "is it learning?" has a reproducible, offline answer.

---

## 11. Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Overfitting recent streaks | Min-sample gating, recency floor, drift caps, EMA smoothing |
| Feedback leakage / lookahead | Features snapshotted **before** outcome (already the simulator's contract); outcome only via `/feedback` post-match |
| Silent degradation | Self-eval gate: never ship a bucket that loses to baseline; kill-switch flag |
| Opaque "AI changed its mind" | Mandatory adjustment records surfaced in API + UI |
| Coupling model learning to infra | AI service owns a self-contained artifact; works with no DB/Redis |
| False sense of certainty | Calibration can only correct toward observed frequency; band labels post-calibration |

---

## 12. Design decisions (were open questions — now resolved by the build)

1. **Experience store format** — **JSONL** (append-only event log reduced on
   load), for maximum inspectability. A Parquet adapter remains a later option.
   → `app/memory/store.py`.
2. **Context buckets** — **league-only** for now (plus a `global` bucket).
   Match-archetype bucketing (big-favourite / tight / high-total) is deferred to
   keep the first cut legible; the `resolve`/`recompute` shape already
   generalises to more buckets.
3. **Recompute cadence** — **hourly**: the `refresh-data` BullMQ job reconciles
   finished fixtures and calls `/adaptive/recompute` immediately after ingesting
   fresh results, so learned weights/calibration stay current as matches resolve.
   The daily `retrain-models` job repeats the (idempotent) reconcile/recompute as
   a catch-up and additionally drives the heavier full ensemble retrain. The
   recompute is cheap because the engine only rebuilds when something actually
   resolved (an idle hour is a near no-op).
4. **System of record** — **AI-service artifact only for the MVP**
   (`experience.jsonl` + `adaptive_state.json`). The backend stays stateless and
   reconciles outcomes by querying the AI service's *pending* list
   (`GET /feedback/pending`) against finished fixtures — no Postgres
   `predictions` table required to run the loop. The durable Postgres mirror
   proposed in §6 remains a clean future enhancement.
5. **Calibration method** — **temperature scaling** (single monotone parameter,
   multiclass-correct, identity at T=1, trivially shrinkable on thin data) rather
   than isotonic/Platt, which don't preserve the 1X2 simplex as cleanly.
   → `app/adaptive/calibration.py`.

---

### Appendix A — Files touched (summary)

```txt
apps/ai-service/app/
  memory/                 NEW  (store.py, schema, experience artifact I/O)
  adaptive/               NEW  (state.py, weighting.py, calibration.py,
                                personality.py, evaluate.py)
  inference/predictor.py  EDIT (adaptive blend + calibration path, flag-gated)
  models/explain.py       EDIT (league-aware reasoning)
  evaluation/metrics.py   REUSE (now fed real prediction↔outcome pairs)
  schemas.py / main.py    EDIT (Feedback, AdaptiveState, new endpoints)
  README.md, .env.example EDIT (flags + usage)

apps/api/src/
  db/schema.sql                         EDIT (predictions table)
  modules/predictions/*                 EDIT (persist + pass-through trace)
  modules/jobs/intelligence.processor.ts EDIT (feedback + recompute triggers)

apps/web/                 Phase D — Adaptive Intelligence transparency panel
```
