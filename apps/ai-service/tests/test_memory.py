"""Experience Memory store: round-trip, idempotency, reduction, compaction."""
from app.memory.schema import ExperienceRecord
from app.memory.store import ExperienceStore


def _prediction(match_id: str, league: str = "epl") -> ExperienceRecord:
    return ExperienceRecord(
        match_id=match_id,
        league_id=league,
        features=[1.0, 0.2, 0.1, 3.0, 0.4],
        submodel_probs={"poisson": [0.5, 0.3, 0.2], "elo": [0.6, 0.2, 0.2]},
        blended_probs=[0.54, 0.26, 0.20],
        weights_used={"poisson": 0.6, "elo": 0.4},
        confidence_published=0.54,
    )


def test_prediction_then_outcome_resolves(tmp_path):
    store = ExperienceStore(tmp_path / "exp.jsonl")
    store.record_prediction(_prediction("m1"))
    assert store.counts() == {"total": 1, "resolved": 0, "pending": 1}

    store.record_outcome("m1", outcome=1, goals={"home": 1, "away": 1}, league_id="epl")
    rec = store.get("m1")
    assert rec.resolved
    assert rec.actual_outcome == 1
    assert rec.actual_goals == {"home": 1, "away": 1}
    assert store.counts() == {"total": 1, "resolved": 1, "pending": 0}


def test_outcome_is_idempotent(tmp_path):
    store = ExperienceStore(tmp_path / "exp.jsonl")
    store.record_prediction(_prediction("m1"))
    store.record_outcome("m1", outcome=0)
    store.record_outcome("m1", outcome=2)  # correction / re-ingestion
    assert store.get("m1").actual_outcome == 2
    assert store.counts()["resolved"] == 1


def test_outcome_before_prediction_is_preserved(tmp_path):
    store = ExperienceStore(tmp_path / "exp.jsonl")
    store.record_outcome("m1", outcome=0, league_id="epl")
    store.record_prediction(_prediction("m1"))
    rec = store.get("m1")
    assert rec.resolved
    assert rec.actual_outcome == 0  # not clobbered by the later prediction


def test_reduction_persists_across_instances(tmp_path):
    path = tmp_path / "exp.jsonl"
    store = ExperienceStore(path)
    store.record_prediction(_prediction("m1"))
    store.record_outcome("m1", outcome=1)

    reloaded = ExperienceStore(path)
    assert reloaded.get("m1").actual_outcome == 1
    assert reloaded.counts()["resolved"] == 1


def test_resolved_filters_by_league(tmp_path):
    store = ExperienceStore(tmp_path / "exp.jsonl")
    for i in range(3):
        store.record_prediction(_prediction(f"e{i}", league="epl"))
        store.record_outcome(f"e{i}", outcome=0, league_id="epl")
    store.record_prediction(_prediction("s1", league="seriea"))
    store.record_outcome("s1", outcome=2, league_id="seriea")

    assert len(store.resolved("epl")) == 3
    assert len(store.resolved("seriea")) == 1
    assert set(store.leagues()) == {"epl", "seriea"}


def test_compaction_preserves_state_and_shrinks_log(tmp_path):
    path = tmp_path / "exp.jsonl"
    store = ExperienceStore(path)
    store.record_prediction(_prediction("m1"))
    store.record_outcome("m1", outcome=1)
    store.record_outcome("m1", outcome=0)  # extra event line
    before = len(path.read_text().splitlines())

    store.compact()
    after = len(path.read_text().splitlines())
    assert after < before

    reloaded = ExperienceStore(path)
    assert reloaded.get("m1").actual_outcome == 0
    assert reloaded.counts()["resolved"] == 1
