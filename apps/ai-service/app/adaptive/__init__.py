"""Adaptive Intelligence Engine.

Turns the static prediction ensemble into a continuously self-improving system
under a *conservative & explainable* contract: adaptation is bounded, gated on a
minimum sample size, recency-weighted with a floor, fully audited, and instantly
reversible. When experience is sparse or the engine is disabled, behaviour is
identical to the static Poisson + Elo + ML blend.

See docs/adaptive-intelligence-engine.md for the full design.
"""
