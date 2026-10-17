"""Company Brain graph tests — require FalkorDB (see README)."""

import os

import pytest

pytestmark = pytest.mark.asyncio

FALKORDB_HOST = os.getenv("FALKORDB_HOST", "localhost")
SKIP = os.getenv("SKIP_GRAPH_TESTS", "").lower() in ("1", "true", "yes")


def _graph_reachable() -> bool:
    if SKIP:
        return False
    try:
        from falkordb import FalkorDB

        client = FalkorDB(host=FALKORDB_HOST, port=int(os.getenv("FALKORDB_PORT", "6379")))
        client.select_graph(os.getenv("FALKORDB_GRAPH", "bhumi_company_brain_test")).query("RETURN 1 AS ok")
        return True
    except Exception:
        return False


requires_falkordb = pytest.mark.skipif(not _graph_reachable(), reason="FalkorDB not reachable")


@pytest.fixture
async def seeded_graph(monkeypatch):
    monkeypatch.setenv("FALKORDB_HOST", FALKORDB_HOST)
    monkeypatch.setenv("FALKORDB_GRAPH", "bhumi_company_brain_test")
    from app.config import settings
    from app.infrastructure.graph import company_brain as brain
    from app.infrastructure.graph.falkordb_client import close_graph, run_sync

    close_graph()
    object.__setattr__(settings, "falkordb_graph", "bhumi_company_brain_test")
    run_sync("MATCH (n) DETACH DELETE n")
    await brain.seed_company_brain(["BCCL", "SECL", "ECL"])
    yield brain
    close_graph()


@requires_falkordb
async def test_seed_counts(seeded_graph):
    rows = await seeded_graph.run(seeded_graph.COUNTS)
    kinds = {seeded_graph.label_of(row["kind"]): int(row["total"]) for row in rows}
    assert kinds.get("Person", 0) >= 5
    assert kinds.get("Issue", 0) >= 1
    assert kinds.get("Fact", 0) >= 2


@requires_falkordb
async def test_issue_investigation_multihop(seeded_graph):
    rows = await seeded_graph.run(
        seeded_graph.ISSUE_INVESTIGATION,
        {"id": "issue-ecl-offtake", "needle": "ECL offtake"},
    )
    assert rows
    assert any(row.get("project") == "House Question Turnaround" for row in rows)
    assert any(row.get("person") == "Vikram Sethi" for row in rows)
    assert any(row.get("decision") for row in rows)
    assert any(row.get("fact") for row in rows)


@requires_falkordb
async def test_knowledge_gaps(seeded_graph):
    rows = await seeded_graph.run(seeded_graph.KNOWLEDGE_GAPS)
    names = {row.get("project") for row in rows}
    assert "Abandoned Mine Land Rehabilitation" in names


@requires_falkordb
async def test_entity_aliases(seeded_graph):
    rows = await seeded_graph.run(seeded_graph.ENTITY_ALIASES)
    assert any("Gevra" in str(row.get("name")) for row in rows)


@requires_falkordb
async def test_upsert_fact(seeded_graph):
    await seeded_graph.upsert_fact(
        fact_id="fact-test",
        statement="Synthetic test fact for regression.",
        document_id="doc-validation-sop",
        document_name="Validation SOP 2026",
        confidence=0.99,
        page_ref=1,
        extracted_at="2026-10-17T00:00:00Z",
    )
    rows = await seeded_graph.run(
        """
        MATCH (f:Fact {id: 'fact-test'})-[:EXTRACTED_FROM]->(d:Document)
        RETURN f.statement AS statement, d.name AS document
        """
    )
    assert rows and rows[0]["statement"].startswith("Synthetic test")


def test_graph_unavailable_on_bad_host(monkeypatch):
    from app.infrastructure.graph.falkordb_client import GraphUnavailable, close_graph, run_sync

    monkeypatch.setenv("FALKORDB_HOST", "127.0.0.1")
    monkeypatch.setenv("FALKORDB_PORT", "6399")
    from app.config import settings

    object.__setattr__(settings, "falkordb_host", "127.0.0.1")
    object.__setattr__(settings, "falkordb_port", 6399)
    close_graph()
    with pytest.raises(GraphUnavailable):
        run_sync("RETURN 1")

