"""Append-only Experience Memory store (file-backed, offline-first).

Design choices:
  * **Append-only JSONL of events** — each ``record_prediction`` /
    ``record_outcome`` appends one line; the current state is reduced from the
    event log on load (last-write-wins per ``match_id``). Cheap writes, fully
    inspectable, no external DB. Mirrors how ``models/*.joblib`` artifacts work.
  * **Self-contained** — the AI service owns this working-set artifact and never
    depends on Postgres/Redis being up. The backend (apps/api) is the durable
    system of record and can replay feedback into this store.
  * **Idempotent outcomes** — recording an outcome for the same ``match_id``
    twice is a no-op-by-overwrite, so re-ingestion is safe.

This is the substrate the Self-Evaluation (L4) and Dynamic Weighting /
Calibration (L5) layers read from.
"""
from __future__ import annotations

import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, Optional

from app.adaptive.config import experience_path
from app.memory.schema import ExperienceRecord


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


class ExperienceStore:
    """File-backed experience log keyed by ``match_id``.

    Loads lazily and caches the reduced state in memory; mutations append to the
    event log and update the cache so reads stay consistent within a process.
    """

    def __init__(self, path: Optional[Path] = None) -> None:
        self._path = Path(path) if path is not None else None
        self._records: dict[str, ExperienceRecord] = {}
        self._loaded = False

    # --- path / lifecycle -------------------------------------------------
    @property
    def path(self) -> Path:
        # Resolve lazily so env overrides (tests/ops) are honoured per process.
        return self._path if self._path is not None else experience_path()

    def _ensure_loaded(self) -> None:
        if self._loaded:
            return
        self._loaded = True
        self._records = {}
        path = self.path
        if not path.exists():
            return
        for line in path.read_text().splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                event = json.loads(line)
            except json.JSONDecodeError:  # pragma: no cover - skip corrupt line
                continue
            self._apply(event)

    def _apply(self, event: dict) -> None:
        match_id = event.get("match_id")
        if not match_id:
            return
        etype = event.get("type")
        existing = self._records.get(match_id)
        if etype == "prediction":
            rec = ExperienceRecord.from_dict(event)
            # Preserve an outcome that arrived before a (re)prediction.
            if existing is not None and existing.actual_outcome is not None:
                rec.actual_outcome = existing.actual_outcome
                rec.actual_goals = existing.actual_goals
                rec.resolved_at = existing.resolved_at
            self._records[match_id] = rec
        elif etype == "outcome":
            if existing is None:
                existing = ExperienceRecord(
                    match_id=match_id, league_id=event.get("league_id", "global")
                )
                self._records[match_id] = existing
            existing.actual_outcome = event.get("actual_outcome")
            existing.actual_goals = event.get("actual_goals")
            existing.resolved_at = event.get("resolved_at")

    def _append(self, event: dict) -> None:
        path = self.path
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(event, separators=(",", ":")) + "\n")

    # --- writes -----------------------------------------------------------
    def record_prediction(self, record: ExperienceRecord) -> None:
        """Persist the prediction-time portion of a match's experience row."""
        self._ensure_loaded()
        if record.predicted_at is None:
            record.predicted_at = _utcnow()
        event = {"type": "prediction", **record.to_dict()}
        # Don't write half-formed outcome fields from a fresh prediction.
        event.pop("actual_outcome", None)
        event.pop("actual_goals", None)
        event.pop("resolved_at", None)
        self._append(event)
        self._apply(event)

    def record_outcome(
        self,
        match_id: str,
        outcome: int,
        goals: Optional[dict[str, int]] = None,
        league_id: str = "global",
    ) -> None:
        """Complete a match's experience row with the actual result (idempotent)."""
        self._ensure_loaded()
        event = {
            "type": "outcome",
            "match_id": match_id,
            "league_id": league_id,
            "actual_outcome": int(outcome),
            "actual_goals": goals,
            "resolved_at": _utcnow(),
        }
        self._append(event)
        self._apply(event)

    # --- reads ------------------------------------------------------------
    def get(self, match_id: str) -> Optional[ExperienceRecord]:
        self._ensure_loaded()
        return self._records.get(match_id)

    def all(self) -> list[ExperienceRecord]:
        self._ensure_loaded()
        return list(self._records.values())

    def resolved(self, league_id: Optional[str] = None) -> list[ExperienceRecord]:
        """Resolved rows (prediction + outcome), optionally filtered by league."""
        self._ensure_loaded()
        out = [r for r in self._records.values() if r.resolved]
        if league_id is not None:
            out = [r for r in out if r.league_id == league_id]
        return out

    def leagues(self) -> list[str]:
        self._ensure_loaded()
        return sorted({r.league_id for r in self._records.values() if r.resolved})

    def counts(self) -> dict[str, int]:
        self._ensure_loaded()
        total = len(self._records)
        resolved = sum(1 for r in self._records.values() if r.resolved)
        return {"total": total, "resolved": resolved, "pending": total - resolved}

    # --- maintenance ------------------------------------------------------
    def compact(self, keep: Optional[Iterable[ExperienceRecord]] = None) -> None:
        """Rewrite the log as one snapshot line per record (drops event history).

        Atomic via a temp file + replace so a crash mid-compaction can't corrupt
        the store. ``keep`` lets a retention policy drop old rows.
        """
        self._ensure_loaded()
        records = list(keep) if keep is not None else list(self._records.values())
        path = self.path
        path.parent.mkdir(parents=True, exist_ok=True)
        fd, tmp = tempfile.mkstemp(dir=str(path.parent), suffix=".tmp")
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as fh:
                for rec in records:
                    snapshot = {"type": "prediction", **rec.to_dict()}
                    fh.write(json.dumps(snapshot, separators=(",", ":")) + "\n")
                    if rec.actual_outcome is not None:
                        fh.write(
                            json.dumps(
                                {
                                    "type": "outcome",
                                    "match_id": rec.match_id,
                                    "league_id": rec.league_id,
                                    "actual_outcome": rec.actual_outcome,
                                    "actual_goals": rec.actual_goals,
                                    "resolved_at": rec.resolved_at,
                                },
                                separators=(",", ":"),
                            )
                            + "\n"
                        )
            os.replace(tmp, path)
        finally:
            if os.path.exists(tmp):  # pragma: no cover - cleanup on error
                os.remove(tmp)
        self._records = {r.match_id: r for r in records}


# Module-level singleton used by the inference path (default artifact location).
store = ExperienceStore()
