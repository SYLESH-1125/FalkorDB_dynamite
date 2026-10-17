"""Company Brain graph: people, teams, projects, documents, decisions, tickets, chats.

Every read and write the agent depends on goes through FalkorDB. The synthetic
organisation below is fictional and safe to publish.
"""

import logging
from typing import Any

from app.infrastructure.graph.falkordb_client import run

log = logging.getLogger(__name__)

# Cypher the product actually executes. Kept in sync with backend/cypher/company_brain.cypher.
OWNS_PEOPLE = """
MATCH (person:Person)-[r:OWNS|RESPONSIBLE_FOR]->(thing {id: $id})
RETURN person.id AS personId, person.name AS person, person.role AS role, type(r) AS rel
"""

# Backward-compatible alias used in docs; OWNS_PEOPLE includes RESPONSIBLE_FOR.
RESPONSIBLE_PEOPLE = OWNS_PEOPLE

OWNS_TEAMS = """
MATCH (team:Team)-[:OWNS]->(thing {id: $id})
RETURN team.id AS teamId, team.name AS team
"""

KNOWS = """
MATCH (person:Person)-[r:KNOWS_ABOUT|WORKED_ON|AUTHORED]->(thing {id: $id})
RETURN person.id AS personId, person.name AS person, person.role AS role, type(r) AS rel
"""

PERSON_REACH = """
MATCH (person:Person {id: $id})-[r:KNOWS_ABOUT|WORKED_ON|AUTHORED|OWNS]->(thing)
RETURN person.name AS person, type(r) AS rel, coalesce(thing.name, thing.title) AS thing,
       labels(thing) AS kind, thing.id AS thingId
"""

DECISION_TRACE = """
MATCH (d:Decision)-[:AFFECTS|DECIDED_BY|BASED_ON]->(thing {id: $id})
OPTIONAL MATCH (d)-[:DECIDED_BY]->(p:Person)
OPTIONAL MATCH (d)-[:BASED_ON]->(doc:Document)
OPTIONAL MATCH (d)-[:AFFECTS]->(affected)
RETURN d.id AS id, d.title AS title, d.summary AS summary, d.decidedOn AS decidedOn,
       p.name AS person, p.id AS personId, doc.name AS document, doc.id AS documentId,
       coalesce(affected.name, affected.title) AS affects, affected.id AS affectsId
"""

DECISION_BY_ID = """
MATCH (d:Decision {id: $id})
OPTIONAL MATCH (d)-[:DECIDED_BY]->(p:Person)
OPTIONAL MATCH (d)-[:BASED_ON]->(doc:Document)
OPTIONAL MATCH (d)-[:AFFECTS]->(affected)
RETURN d.id AS id, d.title AS title, d.summary AS summary, d.decidedOn AS decidedOn,
       p.name AS person, p.id AS personId, doc.name AS document, doc.id AS documentId,
       coalesce(affected.name, affected.title) AS affects, affected.id AS affectsId
"""

IMPACT = """
MATCH (thing {id: $id})
OPTIONAL MATCH (proj:Project)-[:DEPENDS_ON]->(thing)
OPTIONAL MATCH (d:Decision)-[:AFFECTS]->(thing)
OPTIONAL MATCH (t:Ticket)-[:ABOUT]->(thing)
OPTIONAL MATCH (iss:Issue)-[:AFFECTS]->(thing)
OPTIONAL MATCH (doc:Document)-[:ABOUT|REFERENCES]->(thing)
OPTIONAL MATCH (chat:Chat)-[:MENTIONS]->(thing)
RETURN coalesce(thing.name, thing.title) AS name,
       collect(DISTINCT proj.name) AS projects,
       collect(DISTINCT d.title) AS decisions,
       collect(DISTINCT t.title) AS tickets,
       collect(DISTINCT coalesce(iss.title, iss.name)) AS issues,
       collect(DISTINCT doc.name) AS documents,
       collect(DISTINCT chat.name) AS chats
"""

NEIGHBORS = """
MATCH (n {id: $id})-[r]->(m)
RETURN 'out' AS dir, type(r) AS rel, coalesce(m.name, m.title, m.id) AS other,
       labels(m) AS kind, m.id AS otherId
UNION
MATCH (m)-[r]->(n {id: $id})
RETURN 'in' AS dir, type(r) AS rel, coalesce(m.name, m.title, m.id) AS other,
       labels(m) AS kind, m.id AS otherId
"""

SHORTEST_PATH = """
MATCH (a {id: $fromId}), (b {id: $toId})
MATCH p = shortestPath((a)-[*..8]-(b))
RETURN [n IN nodes(p) | coalesce(n.name, n.title, n.id)] AS names,
       [n IN nodes(p) | n.id] AS ids,
       [rel IN relationships(p) | type(rel)] AS rels
"""

CATALOG = """
MATCH (n)
WHERE n.name IS NOT NULL OR n.title IS NOT NULL
RETURN n.id AS id, coalesce(n.name, n.title) AS name, labels(n) AS kind
"""

COUNTS = """
MATCH (n)
RETURN labels(n) AS kind, count(n) AS total
"""

CENTRALITY = """
MATCH (p:Person)
OPTIONAL MATCH (p)-[r]-()
RETURN p.name AS name, p.role AS role, count(r) AS connections
ORDER BY connections DESC
LIMIT 5
"""

PAGE_RANK = """
CALL algo.pageRank('Person', 'KNOWS_ABOUT')
YIELD node, score
RETURN node.name AS name, node.role AS role, score
ORDER BY score DESC
LIMIT 5
"""

RECENT_DECISIONS = """
MATCH (d:Decision)
RETURN d.title AS title, d.decidedOn AS decidedOn, d.summary AS summary
ORDER BY d.decidedOn DESC
LIMIT 5
"""

MEMORIES_ABOUT = """
MATCH (m:Memory)-[:ABOUT]->(n {id: $id})
RETURN m.question AS question, m.answer AS answer, m.askedAt AS askedAt
ORDER BY m.askedAt DESC
LIMIT 3
"""

RECENT_MEMORIES = """
MATCH (m:Memory)
RETURN m.question AS question, m.answer AS answer, m.askedAt AS askedAt
ORDER BY m.askedAt DESC
LIMIT 5
"""

ISSUE_INVESTIGATION = """
MATCH (i:Issue)
WHERE i.id = $id OR toLower(coalesce(i.title, i.name, '')) CONTAINS toLower($needle)
WITH i ORDER BY size(coalesce(i.title, i.name, '')) DESC LIMIT 1
OPTIONAL MATCH (i)-[:AFFECTS]->(proj:Project)
OPTIONAL MATCH (i)-[:AFFECTS]->(sub:Subsidiary)
OPTIONAL MATCH (person:Person)-[pr:OWNS|RESPONSIBLE_FOR]->(proj)
OPTIONAL MATCH (team:Team)-[:OWNS]->(proj)
OPTIONAL MATCH (d:Decision)-[:AFFECTS]->(proj)
OPTIONAL MATCH (d)-[:BASED_ON]->(doc:Document)
OPTIONAL MATCH (f:Fact)-[:EXTRACTED_FROM]->(doc)
RETURN i.id AS issueId, coalesce(i.title, i.name) AS issueTitle, i.status AS issueStatus,
       proj.id AS projectId, proj.name AS project,
       sub.id AS subsidiaryId, sub.name AS subsidiary,
       person.id AS personId, person.name AS person, person.role AS role, type(pr) AS personRel,
       team.id AS teamId, team.name AS team,
       d.id AS decisionId, d.title AS decision, d.decidedOn AS decidedOn,
       doc.id AS documentId, doc.name AS document,
       f.id AS factId, f.statement AS fact, f.confidence AS confidence, f.pageRef AS pageRef
"""

EVIDENCE_FROM_PROJECT = """
MATCH (proj:Project {id: $id})
OPTIONAL MATCH (d:Decision)-[:AFFECTS]->(proj)
OPTIONAL MATCH (d)-[:BASED_ON]->(doc:Document)
OPTIONAL MATCH (f:Fact)-[:EXTRACTED_FROM]->(doc)
OPTIONAL MATCH (issue:Issue)-[:AFFECTS]->(proj)
RETURN proj.name AS project,
       d.id AS decisionId, d.title AS decision,
       doc.id AS documentId, doc.name AS document,
       f.id AS factId, f.statement AS fact, f.confidence AS confidence, f.pageRef AS pageRef,
       issue.id AS issueId, coalesce(issue.title, issue.name) AS issue
"""

RELATED_PROJECTS = """
MATCH (p:Project {id: $id})
OPTIONAL MATCH (p)-[:DEPENDS_ON]->(shared)<-[:DEPENDS_ON]-(other:Project)
WHERE other.id <> p.id
OPTIONAL MATCH (team:Team)-[:OWNS]->(p)
OPTIONAL MATCH (team)-[:OWNS]->(peer:Project)
WHERE peer.id <> p.id
OPTIONAL MATCH (d:Decision)-[:AFFECTS]->(p)
OPTIONAL MATCH (d)-[:AFFECTS]->(viaDecision:Project)
WHERE viaDecision.id <> p.id
RETURN collect(DISTINCT other.name) AS sharedDependency,
       collect(DISTINCT peer.name) AS sharedTeam,
       collect(DISTINCT viaDecision.name) AS sharedDecision
"""

KNOWLEDGE_GAPS = """
MATCH (p:Project)
OPTIONAL MATCH (owner:Person)-[:OWNS|RESPONSIBLE_FOR]->(p)
OPTIONAL MATCH (d:Decision)-[:AFFECTS]->(p)
OPTIONAL MATCH (doc:Document)-[:ABOUT]->(p)
OPTIONAL MATCH (f:Fact)-[:EXTRACTED_FROM]->(doc)
WITH p, owner, collect(DISTINCT d.id) AS decisionIds, collect(DISTINCT f.id) AS factIds
WITH p, owner,
     size([x IN decisionIds WHERE x IS NOT NULL]) AS decisionCount,
     size([x IN factIds WHERE x IS NOT NULL]) AS factCount
WHERE owner IS NULL OR decisionCount = 0 OR factCount = 0
RETURN p.id AS projectId, p.name AS project, p.status AS status,
       owner.name AS owner, decisionCount, factCount
ORDER BY project
"""

ENTITY_ALIASES = """
MATCH (n)
WHERE n.alias IS NOT NULL AND n.name IS NOT NULL
RETURN n.id AS id, n.name AS name, n.alias AS alias, labels(n) AS kind
UNION
MATCH (a), (b)
WHERE a.id < b.id AND a.name IS NOT NULL AND b.name IS NOT NULL
  AND toLower(trim(a.name)) = toLower(trim(b.name))
RETURN a.id AS id, a.name AS name, b.name AS alias, labels(a) AS kind
"""

UPSERT_FACT = """
MERGE (f:Fact {id: $id})
SET f.statement = $statement, f.confidence = $confidence, f.pageRef = $pageRef,
    f.extractedAt = $extractedAt, f.name = left($statement, 80)
MERGE (doc:Document {id: $documentId})
ON CREATE SET doc.name = $documentName, doc.kind = 'source'
MERGE (f)-[:EXTRACTED_FROM]->(doc)
"""

GRAPH_SLICE = """
MATCH (a)-[r]->(b)
RETURN a.id AS aid, labels(a) AS akind, coalesce(a.name, a.title, a.id) AS alabel,
       a.role AS arole, a.status AS astatus, a.decidedOn AS adecided,
       type(r) AS rtype,
       b.id AS bid, labels(b) AS bkind, coalesce(b.name, b.title, b.id) AS blabel,
       b.role AS brole, b.status AS bstatus, b.decidedOn AS bdecided
LIMIT $limit
"""


def label_of(value: Any) -> str:
    if isinstance(value, list) and value:
        return str(value[0])
    if value:
        return str(value)
    return "Unknown"


def _props(role: Any, status: Any, decided: Any) -> dict[str, str]:
    props: dict[str, str] = {}
    if role:
        props["role"] = str(role)
    if status:
        props["status"] = str(status)
    if decided:
        props["decidedOn"] = str(decided)
    return props


async def fetch_graph(limit: int = 500) -> tuple[list[dict], list[dict]]:
    rows = await run(GRAPH_SLICE, {"limit": limit})
    nodes: dict[str, dict] = {}
    edges: list[dict] = []
    for row in rows:
        for side, id_key, kind_key, label_key, role_key, status_key, decided_key in (
            ("a", "aid", "akind", "alabel", "arole", "astatus", "adecided"),
            ("b", "bid", "bkind", "blabel", "brole", "bstatus", "bdecided"),
        ):
            node_id = row.get(id_key)
            if not node_id or node_id in nodes:
                continue
            kind = label_of(row.get(kind_key))
            nodes[str(node_id)] = {
                "id": str(node_id),
                "kind": kind,
                "label": str(row.get(label_key) or kind),
                "properties": _props(row.get(role_key), row.get(status_key), row.get(decided_key)),
            }
        if row.get("aid") and row.get("bid") and row.get("rtype"):
            edges.append({
                "id": f"{row['aid']}:{row['rtype']}:{row['bid']}",
                "source": str(row["aid"]),
                "target": str(row["bid"]),
                "type": str(row["rtype"]),
            })
    return list(nodes.values()), edges


async def catalog() -> list[dict[str, str]]:
    rows = await run(CATALOG)
    found: list[dict[str, str]] = []
    for row in rows:
        name = row.get("name")
        node_id = row.get("id")
        if not name or not node_id:
            continue
        found.append({"id": str(node_id), "name": str(name), "kind": label_of(row.get("kind"))})
    return found


async def seed_company_brain(subsidiary_codes: list[str]) -> None:
    for code in subsidiary_codes:
        await run(
            """
            MERGE (s:Subsidiary {id: $id})
            SET s.name = $id, s.code = $id
            """,
            {"id": code},
        )
    for statement in _SEED:
        await run(statement)
    for statement in _INDEXES:
        try:
            await run(statement)
        except Exception:
            log.info("index skipped: %s", statement.split("\n", 1)[0])


async def publish_document(document_id: str, name: str, kind: str, subsidiary_code: str, mine_name: str | None) -> None:
    await run(
        """
        MERGE (d:Document {id: $id})
        SET d.name = $name, d.kind = $kind
        MERGE (s:Subsidiary {id: $subsidiary})
        SET s.name = $subsidiary, s.code = $subsidiary
        MERGE (d)-[:BELONGS_TO]->(s)
        """,
        {"id": document_id, "name": name, "kind": kind, "subsidiary": subsidiary_code},
    )
    if mine_name:
        await run(
            """
            MATCH (d:Document {id: $id})
            MERGE (m:Mine {id: $mineId})
            SET m.name = $mineName
            MERGE (d)-[:REFERENCES]->(m)
            MERGE (sub:Subsidiary {id: $subsidiary})
            MERGE (m)-[:BELONGS_TO]->(sub)
            """,
            {
                "id": document_id,
                "mineId": f"mine-{mine_name.lower().replace(' ', '-')}",
                "mineName": mine_name,
                "subsidiary": subsidiary_code,
            },
        )


async def remember(memory_id: str, question: str, answer: str, asked_at: str, intent: str, about_ids: list[str], actor_id: str, actor_name: str) -> None:
    short = question[:80]
    await run(
        """
        CREATE (m:Memory {id: $id})
        SET m.name = $short, m.question = $question, m.answer = $answer,
            m.askedAt = $askedAt, m.intent = $intent
        """,
        {
            "id": memory_id,
            "short": short,
            "question": question,
            "answer": answer[:1200],
            "askedAt": asked_at,
            "intent": intent,
        },
    )
    for node_id in about_ids:
        await run(
            """
            MATCH (m:Memory {id: $id}), (n {id: $nodeId})
            MERGE (m)-[:ABOUT]->(n)
            """,
            {"id": memory_id, "nodeId": node_id},
        )
    await run(
        """
        MATCH (m:Memory {id: $id})
        MERGE (u:Person {id: $actorId})
        ON CREATE SET u.name = $actorName, u.role = 'Signed-in colleague'
        MERGE (m)-[:ASKED_BY]->(u)
        """,
        {"id": memory_id, "actorId": actor_id, "actorName": actor_name},
    )


async def upsert_fact(
    fact_id: str,
    statement: str,
    document_id: str,
    document_name: str,
    confidence: float,
    page_ref: int,
    extracted_at: str,
) -> None:
    await run(
        UPSERT_FACT,
        {
            "id": fact_id,
            "statement": statement,
            "documentId": document_id,
            "documentName": document_name,
            "confidence": confidence,
            "pageRef": page_ref,
            "extractedAt": extracted_at,
        },
    )


async def record_decision(decision_id: str, title: str, summary: str, decided_on: str, decided_by: str, based_on: str, affects: str) -> None:
    await run(
        """
        MERGE (d:Decision {id: $id})
        SET d.title = $title, d.name = $title, d.summary = $summary, d.decidedOn = $on
        MERGE (p:Person {name: $decidedBy})
        ON CREATE SET p.id = $personId, p.role = 'Recorded during a session'
        MERGE (d)-[:DECIDED_BY]->(p)
        MERGE (doc:Document {name: $basedOn})
        ON CREATE SET doc.id = $docId, doc.kind = 'recorded'
        MERGE (d)-[:BASED_ON]->(doc)
        """,
        {
            "id": decision_id,
            "title": title,
            "summary": summary,
            "on": decided_on,
            "decidedBy": decided_by,
            "personId": f"person-{_slug(decided_by)}",
            "basedOn": based_on,
            "docId": f"doc-{_slug(based_on)}",
        },
    )
    matched = await run(
        """
        MATCH (thing)
        WHERE thing.name = $affects OR thing.title = $affects
        RETURN thing.id AS id
        LIMIT 1
        """,
        {"affects": affects},
    )
    if matched and matched[0].get("id"):
        await run(
            """
            MATCH (d:Decision {id: $id}), (thing {id: $thingId})
            MERGE (d)-[:AFFECTS]->(thing)
            """,
            {"id": decision_id, "thingId": matched[0]["id"]},
        )
        return
    await run(
        """
        MATCH (d:Decision {id: $id})
        MERGE (proj:Project {id: $projId})
        SET proj.name = $affects, proj.status = 'recorded'
        MERGE (d)-[:AFFECTS]->(proj)
        """,
        {"id": decision_id, "projId": f"proj-{_slug(affects)}", "affects": affects},
    )


def _slug(value: str) -> str:
    cleaned = "".join(ch.lower() if ch.isalnum() else "-" for ch in value)
    return "-".join(part for part in cleaned.split("-") if part)[:48] or "node"


_INDEXES = [
    "CREATE INDEX FOR (p:Person) ON (p.id)",
    "CREATE INDEX FOR (t:Team) ON (t.id)",
    "CREATE INDEX FOR (p:Project) ON (p.id)",
    "CREATE INDEX FOR (d:Document) ON (d.id)",
    "CREATE INDEX FOR (d:Decision) ON (d.id)",
]

# Fictional ministry organisation. Names are not real officials.
_SEED = [
    """
    MERGE (t:Team {id: 'team-policy'})
    SET t.name = 'Policy & Monitoring', t.mandate = 'National coal policy and subsidiary oversight'
    """,
    """
    MERGE (t:Team {id: 'team-parliament'})
    SET t.name = 'Parliamentary Response', t.mandate = 'House questions and briefings'
    """,
    """
    MERGE (t:Team {id: 'team-geology'})
    SET t.name = 'CMPDI Geology', t.mandate = 'Geological notes, fires and subsidence'
    """,
    """
    MERGE (t:Team {id: 'team-ops'})
    SET t.name = 'CIL Operations', t.mandate = 'Dispatch, offtake and mine output'
    """,
    """
    MERGE (t:Team {id: 'team-safety'})
    SET t.name = 'Safety & Environment', t.mandate = 'Clearances, safety and land'
    """,
    """
    MERGE (p:Person {id: 'person-ananya'})
    SET p.name = 'Ananya Rao', p.role = 'Joint Secretary, Policy'
    MERGE (t:Team {id: 'team-policy'})
    MERGE (p)-[:MEMBER_OF]->(t)
    """,
    """
    MERGE (p:Person {id: 'person-vikram'})
    SET p.name = 'Vikram Sethi', p.role = 'Director, Parliamentary Affairs'
    MERGE (t:Team {id: 'team-parliament'})
    MERGE (p)-[:MEMBER_OF]->(t)
    """,
    """
    MERGE (p:Person {id: 'person-meera'})
    SET p.name = 'Meera Iyer', p.role = 'CMPDI domain lead'
    MERGE (t:Team {id: 'team-geology'})
    MERGE (p)-[:MEMBER_OF]->(t)
    """,
    """
    MERGE (p:Person {id: 'person-rohan'})
    SET p.name = 'Rohan Deshmukh', p.role = 'Director, Operations'
    MERGE (t:Team {id: 'team-ops'})
    MERGE (p)-[:MEMBER_OF]->(t)
    """,
    """
    MERGE (p:Person {id: 'person-leela'})
    SET p.name = 'Leela Nair', p.role = 'Director, Safety & Environment'
    MERGE (t:Team {id: 'team-safety'})
    MERGE (p)-[:MEMBER_OF]->(t)
    """,
    """
    MERGE (p:Project {id: 'proj-digitisation'})
    SET p.name = 'Legacy Record Digitisation', p.status = 'active'
    """,
    """
    MERGE (p:Project {id: 'proj-jharia'})
    SET p.name = 'Jharia Fire Monitoring', p.status = 'active'
    """,
    """
    MERGE (p:Project {id: 'proj-production'})
    SET p.name = 'Subsidiary Production Brief', p.status = 'active'
    """,
    """
    MERGE (p:Project {id: 'proj-house'})
    SET p.name = 'House Question Turnaround', p.status = 'active'
    """,
    """
    MATCH (person:Person {id: 'person-ananya'}), (proj:Project {id: 'proj-digitisation'}), (team:Team {id: 'team-policy'})
    MERGE (person)-[:OWNS]->(proj)
    MERGE (team)-[:OWNS]->(proj)
    """,
    """
    MATCH (person:Person {id: 'person-vikram'}), (proj:Project {id: 'proj-house'}), (team:Team {id: 'team-parliament'})
    MERGE (person)-[:OWNS]->(proj)
    MERGE (team)-[:OWNS]->(proj)
    """,
    """
    MATCH (person:Person {id: 'person-rohan'}), (proj:Project {id: 'proj-production'}), (team:Team {id: 'team-ops'})
    MERGE (person)-[:OWNS]->(proj)
    MERGE (team)-[:OWNS]->(proj)
    """,
    """
    MATCH (team:Team {id: 'team-safety'}), (proj:Project {id: 'proj-jharia'})
    MERGE (team)-[:OWNS]->(proj)
    """,
    """
    MATCH (person:Person {id: 'person-meera'}), (proj:Project {id: 'proj-jharia'})
    MERGE (person)-[:WORKED_ON]->(proj)
    """,
    """
    MATCH (person:Person {id: 'person-leela'}), (proj:Project {id: 'proj-jharia'})
    MERGE (person)-[:WORKED_ON]->(proj)
    """,
    """
    MERGE (m:Mine {id: 'mine-jharia'})
    SET m.name = 'Jharia'
    MERGE (s:Subsidiary {id: 'BCCL'})
    SET s.name = 'BCCL', s.code = 'BCCL'
    MERGE (m)-[:BELONGS_TO]->(s)
    """,
    """
    MERGE (m:Mine {id: 'mine-gevra'})
    SET m.name = 'Gevra'
    MERGE (s:Subsidiary {id: 'SECL'})
    SET s.name = 'SECL', s.code = 'SECL'
    MERGE (m)-[:BELONGS_TO]->(s)
    """,
    """
    MERGE (m:Mine {id: 'mine-kusmunda'})
    SET m.name = 'Kusmunda'
    WITH m
    MATCH (s:Subsidiary {id: 'SECL'})
    MERGE (m)-[:BELONGS_TO]->(s)
    """,
    """
    MATCH (proj:Project {id: 'proj-jharia'}), (m:Mine {id: 'mine-jharia'})
    MERGE (proj)-[:DEPENDS_ON]->(m)
    """,
    """
    MATCH (proj:Project {id: 'proj-production'}), (m:Mine {id: 'mine-gevra'})
    MERGE (proj)-[:DEPENDS_ON]->(m)
    """,
    """
    MATCH (person:Person {id: 'person-meera'}), (m:Mine {id: 'mine-jharia'})
    MERGE (person)-[:KNOWS_ABOUT]->(m)
    """,
    """
    MATCH (person:Person {id: 'person-rohan'}), (m:Mine {id: 'mine-gevra'})
    MERGE (person)-[:KNOWS_ABOUT]->(m)
    """,
    """
    MATCH (person:Person {id: 'person-vikram'}), (s:Subsidiary {id: 'ECL'})
    MERGE (person)-[:KNOWS_ABOUT]->(s)
    """,
    """
    MERGE (d:Document {id: 'doc-validation-sop'})
    SET d.name = 'Validation SOP 2026', d.kind = 'procedure'
    """,
    """
    MERGE (d:Document {id: 'doc-jharia-note'})
    SET d.name = 'Jharia Status Note', d.kind = 'note'
    """,
    """
    MERGE (d:Document {id: 'doc-q1-annexure'})
    SET d.name = 'Q1 Production Annexure', d.kind = 'annexure'
    """,
    """
    MERGE (d:Document {id: 'doc-pq-log'})
    SET d.name = 'Parliamentary Question Log', d.kind = 'log'
    """,
    """
    MATCH (person:Person {id: 'person-ananya'}), (d:Document {id: 'doc-validation-sop'}), (proj:Project {id: 'proj-digitisation'})
    MERGE (person)-[:AUTHORED]->(d)
    MERGE (d)-[:ABOUT]->(proj)
    """,
    """
    MATCH (person:Person {id: 'person-meera'}), (d:Document {id: 'doc-jharia-note'}), (m:Mine {id: 'mine-jharia'})
    MERGE (person)-[:AUTHORED]->(d)
    MERGE (d)-[:ABOUT]->(m)
    """,
    """
    MATCH (person:Person {id: 'person-rohan'}), (d:Document {id: 'doc-q1-annexure'}), (proj:Project {id: 'proj-production'})
    MERGE (person)-[:AUTHORED]->(d)
    MERGE (d)-[:ABOUT]->(proj)
    """,
    """
    MATCH (person:Person {id: 'person-vikram'}), (d:Document {id: 'doc-pq-log'}), (proj:Project {id: 'proj-house'})
    MERGE (person)-[:AUTHORED]->(d)
    MERGE (d)-[:ABOUT]->(proj)
    """,
    """
    MERGE (d:Decision {id: 'dec-hil'})
    SET d.name = 'Adopt human-in-loop validation before publication',
        d.title = 'Adopt human-in-loop validation before publication',
        d.summary = 'No extracted figure is published until a reviewer confirms it against the source page.',
        d.decidedOn = '2026-03-12'
    """,
    """
    MATCH (d:Decision {id: 'dec-hil'}), (p:Person {id: 'person-ananya'}), (doc:Document {id: 'doc-validation-sop'}), (proj:Project {id: 'proj-digitisation'})
    MERGE (d)-[:DECIDED_BY]->(p)
    MERGE (d)-[:BASED_ON]->(doc)
    MERGE (d)-[:AFFECTS]->(proj)
    """,
    """
    MERGE (d:Decision {id: 'dec-jharia'})
    SET d.name = 'Prioritise Jharia subsidence questions in the House cycle',
        d.title = 'Prioritise Jharia subsidence questions in the House cycle',
        d.summary = 'Jharia fire and subsidence questions jump the parliamentary queue.',
        d.decidedOn = '2026-06-02'
    """,
    """
    MATCH (d:Decision {id: 'dec-jharia'}), (p:Person {id: 'person-vikram'}), (doc:Document {id: 'doc-jharia-note'}), (proj:Project {id: 'proj-jharia'})
    MERGE (d)-[:DECIDED_BY]->(p)
    MERGE (d)-[:BASED_ON]->(doc)
    MERGE (d)-[:AFFECTS]->(proj)
    """,
    """
    MERGE (d:Decision {id: 'dec-gevra'})
    SET d.name = 'Hold the Gevra dispatch brief until the annexure is validated',
        d.title = 'Hold the Gevra dispatch brief until the annexure is validated',
        d.summary = 'The production brief waits on the Q1 annexure passing validation.',
        d.decidedOn = '2026-07-18'
    """,
    """
    MATCH (d:Decision {id: 'dec-gevra'}), (p:Person {id: 'person-rohan'}), (doc:Document {id: 'doc-q1-annexure'}), (m:Mine {id: 'mine-gevra'})
    MERGE (d)-[:DECIDED_BY]->(p)
    MERGE (d)-[:BASED_ON]->(doc)
    MERGE (d)-[:AFFECTS]->(m)
    """,
    """
    MERGE (t:Ticket {id: 'ticket-441'})
    SET t.name = 'House question on ECL offtake', t.title = 'House question on ECL offtake', t.status = 'open'
    """,
    """
    MATCH (t:Ticket {id: 'ticket-441'}), (p:Person {id: 'person-vikram'}), (s:Subsidiary {id: 'ECL'}), (proj:Project {id: 'proj-house'})
    MERGE (t)-[:RAISED_BY]->(p)
    MERGE (t)-[:ABOUT]->(s)
    MERGE (t)-[:ABOUT]->(proj)
    """,
    """
    MERGE (t:Ticket {id: 'ticket-448'})
    SET t.name = 'Scan quality on the 1998 lease file', t.title = 'Scan quality on the 1998 lease file', t.status = 'open'
    """,
    """
    MATCH (t:Ticket {id: 'ticket-448'}), (p:Person {id: 'person-meera'}), (proj:Project {id: 'proj-digitisation'})
    MERGE (t)-[:RAISED_BY]->(p)
    MERGE (t)-[:ABOUT]->(proj)
    """,
    """
    MERGE (c:Chat {id: 'chat-441'})
    SET c.name = 'ECL offtake thread',
        c.excerpt = 'Vikram asked Meera whether the ECL offtake note can cite the Jharia status only as context, not as the figure.',
        c.channel = 'parliamentary-desk'
    """,
    """
    MATCH (c:Chat {id: 'chat-441'}), (t:Ticket {id: 'ticket-441'}), (p:Person {id: 'person-vikram'})
    MERGE (c)-[:MENTIONS]->(t)
    MERGE (c)-[:MENTIONS]->(p)
    """,
    """
    MERGE (o:Organization {id: 'org-bhumi'})
    SET o.name = 'Bharat Hub for Unified Mining Intelligence', o.kind = 'synthetic ministry desk'
    """,
    """
    MATCH (o:Organization {id: 'org-bhumi'})
    UNWIND ['BCCL', 'SECL', 'ECL'] AS code
    MATCH (s:Subsidiary {id: code})
    MERGE (o)-[:HAS_SUBSIDIARY]->(s)
    """,
    """
    MERGE (m:Mine {id: 'mine-gevra'})
    SET m.alias = 'Gevra OC Mine'
    """,
    """
    MERGE (top:Topic {id: 'topic-subsidence'})
    SET top.name = 'Mine subsidence'
    MERGE (top2:Topic {id: 'topic-offtake'})
    SET top2.name = 'Coal offtake'
    """,
    """
    MATCH (d:Document {id: 'doc-jharia-note'}), (t:Topic {id: 'topic-subsidence'})
    MERGE (d)-[:MENTIONS]->(t)
    """,
    """
    MATCH (d:Document {id: 'doc-pq-log'}), (t:Topic {id: 'topic-offtake'})
    MERGE (d)-[:MENTIONS]->(t)
    """,
    """
    MERGE (f:Fact {id: 'fact-jharia-active'})
    SET f.statement = 'Active fire pockets remain within the Jharia lease boundary on the latest survey.',
        f.confidence = 0.91, f.pageRef = 2, f.extractedAt = '2026-05-10T09:00:00Z',
        f.name = 'Active fire pockets remain within the Jharia lease boundary'
    """,
    """
    MATCH (f:Fact {id: 'fact-jharia-active'}), (d:Document {id: 'doc-jharia-note'})
    MERGE (f)-[:EXTRACTED_FROM]->(d)
    """,
    """
    MERGE (f:Fact {id: 'fact-ecl-offtake'})
    SET f.statement = 'ECL offtake trailed plan by 6% in Q1 due to rake allocation.',
        f.confidence = 0.88, f.pageRef = 4, f.extractedAt = '2026-04-02T11:30:00Z',
        f.name = 'ECL offtake trailed plan by 6% in Q1'
    """,
    """
    MATCH (f:Fact {id: 'fact-ecl-offtake'}), (d:Document {id: 'doc-pq-log'})
    MERGE (f)-[:EXTRACTED_FROM]->(d)
    """,
    """
    MERGE (i:Issue {id: 'issue-ecl-offtake'})
    SET i.title = 'ECL offtake variance in the House briefing', i.name = 'ECL offtake variance',
        i.status = 'open'
    """,
    """
    MATCH (i:Issue {id: 'issue-ecl-offtake'}), (s:Subsidiary {id: 'ECL'}), (p:Project {id: 'proj-house'})
    MERGE (i)-[:AFFECTS]->(s)
    MERGE (i)-[:AFFECTS]->(p)
    """,
    """
    MATCH (person:Person {id: 'person-vikram'}), (p:Project {id: 'proj-house'})
    MERGE (person)-[:RESPONSIBLE_FOR]->(p)
    """,
    """
    MERGE (d:Decision {id: 'dec-ecl-brief'})
    SET d.name = 'Answer ECL offtake variance from validated PQ log only',
        d.title = 'Answer ECL offtake variance from validated PQ log only',
        d.summary = 'House answers on ECL offtake must cite the PQ log fact, not draft annexure figures.',
        d.decidedOn = '2026-04-15'
    """,
    """
    MATCH (d:Decision {id: 'dec-ecl-brief'}), (p:Person {id: 'person-vikram'}),
          (doc:Document {id: 'doc-pq-log'}), (proj:Project {id: 'proj-house'})
    MERGE (d)-[:DECIDED_BY]->(p)
    MERGE (d)-[:BASED_ON]->(doc)
    MERGE (d)-[:AFFECTS]->(proj)
    """,
    """
    MERGE (p:Project {id: 'proj-land-rehab'})
    SET p.name = 'Abandoned Mine Land Rehabilitation', p.status = 'planning'
    """,
    """
    MATCH (m:Mine {id: 'mine-kusmunda'}), (p:Project {id: 'proj-land-rehab'})
    MERGE (p)-[:DEPENDS_ON]->(m)
    """,
]
