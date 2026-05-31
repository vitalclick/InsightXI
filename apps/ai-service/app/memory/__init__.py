"""Experience Memory (L3) — the differentiator.

An append-only record of what the system predicted, what actually happened, and
the full feature / sub-model state at prediction time. Everything the
Self-Evaluation (L4) and Dynamic Weighting / Calibration (L5) layers learn from
is reduced from this log. No PII — match-level analytics only.
"""
