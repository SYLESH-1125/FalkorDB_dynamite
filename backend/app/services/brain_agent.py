import re
import uuid
from datetime import datetime, timezone

from app.infrastructure.graph import company_brain as brain
from app.infrastructure.graph.falkordb_client import GraphUnavailable

_INTENTS = [
    ("gaps", re.compile(r"\b(knowledge gap|missing evidence|no owner|without supporting|gaps in)\b", re.I)),
    ("aliases", re.compile(r"\b(alias|aliases|duplicate entit|entity resolution|same name)\b", re.I)),
    ("related", re.compile(r"\b(related project|similar project|connected project|other project)\b", re.I)),
    ("evidence", re.compile(r"\b(evidence|what supports|prove|provenance|source facts)\b", re.I)),
    ("issue", re.compile(r"\b(issue|offtake variance|which project owns this)\b", re.I)),
    ("impact", re.compile(r"\b(break|breaks|impact|goes down|depend|outage|what fails)\b", re.I)),
    ("owns", re.compile(r"\b(who owns|owner of|responsible for|who is responsible)\b", re.I)),
    ("knows", re.compile(r"\b(who knows|who has worked|worked on|expert|who authored)\b", re.I)),
    ("decision", re.compile(r"\b(decision|trace|why did|based on|source of)\b", re.I)),
    ("path", re.compile(r"\b(connected|shortest path|how is|path between)\b", re.I)),
    ("memory", re.compile(r"\b(last time|remember|earlier|previous session|what did we ask)\b", re.I)),
]


def classify(question: str) -> str | None:
    for name, pattern in _INTENTS:
        if pattern.search(question):
            return name
    return None


def match_entities(question: str, catalog: list[dict[str, str]]) -> list[dict[str, str]]:
    folded = question.lower()
    hits = [item for item in catalog if len(item["name"]) >= 3 and item["name"].lower() in folded]
    hits.sort(key=lambda item: len(item["name"]), reverse=True)
    chosen: list[dict[str, str]] = []
    for hit in hits:
        needle = hit["name"].lower()
        if any(needle in earlier["name"].lower() and needle != earlier["name"].lower() for earlier in chosen):
            continue
        chosen.append(hit)
    return chosen[:3]


def _source(label: str, kind: str, node_id: str, detail: str) -> dict:
    return {"label": label, "kind": kind, "node_id": node_id, "detail": detail}


async def answer(question: str, actor_id: str, actor_name: str) -> dict | None:
    """Return a graph-backed answer, or None when the question names nothing in the graph."""
    items = await brain.catalog()
    entities = match_entities(question, items)
    intent = classify(question)
    if intent is None and not entities:
        return None
    if intent is None:
        intent = "brief"

    primary = entities[0] if entities else None
    if primary and primary.get("kind") == "Issue" and intent in (None, "owns", "brief", "evidence"):
        intent = "issue"
    cypher: list[str] = []
    steps: list[dict] = []
    sources: list[dict] = []
    tool = intent or "brief"
    remembered = await _earlier_sessions(entities, cypher)

    if intent == "memory":
        text = await _memory_answer(cypher)
    elif intent == "path" and len(entities) >= 2:
        text = await _path_answer(entities[0], entities[1], cypher, steps, sources)
    elif intent == "owns" and primary:
        text = await _owns_answer(primary, cypher, steps, sources)
    elif intent == "knows" and primary:
        text = await _knows_answer(primary, cypher, steps, sources)
    elif intent == "decision" and primary:
        text = await _decision_answer(primary, cypher, steps, sources)
    elif intent == "impact" and primary:
        text = await _impact_answer(primary, cypher, steps, sources)
    elif intent == "issue" and primary:
        tool = "issue_investigation"
        text = await _issue_answer(primary, cypher, steps, sources)
    elif intent == "evidence" and primary:
        tool = "evidence_from_project"
        text = await _evidence_answer(primary, cypher, steps, sources)
    elif intent == "related" and primary:
        tool = "related_projects"
        text = await _related_answer(primary, cypher, steps, sources)
    elif intent == "gaps":
        tool = "knowledge_gaps"
        text = await _gaps_answer(cypher, steps, sources)
    elif intent == "aliases":
        tool = "entity_aliases"
        text = await _aliases_answer(cypher, steps, sources)
    elif primary:
        text = await _brief_answer(primary, cypher, steps, sources)
    else:
        text = (
            "The company graph is up, and this question does not name a person, team, project, "
            "document, decision, ticket, or mine that is in it."
        )
        cypher.append(brain.CATALOG.strip())

    if remembered:
        earlier = " Earlier session: " + " ".join(remembered)
        text = text.rstrip() + earlier

    about_ids = [entity["id"] for entity in entities]
    await brain.remember(
        memory_id=f"mem-{uuid.uuid4().hex[:10]}",
        question=question,
        answer=text,
        asked_at=datetime.now(timezone.utc).isoformat(),
        intent=intent,
        about_ids=about_ids,
        actor_id=f"user-{actor_id}",
        actor_name=actor_name,
    )

    return {
        "answer": text,
        "intent": intent or "none",
        "tool": tool,
        "path": steps,
        "sources": sources,
        "cypher": "\n\n".join(cypher),
        "remembered": remembered,
    }


async def _earlier_sessions(entities: list[dict[str, str]], cypher: list[str]) -> list[str]:
    if not entities:
        return []
    cypher.append(brain.MEMORIES_ABOUT.strip())
    rows = await brain.run(brain.MEMORIES_ABOUT, {"id": entities[0]["id"]})
    lines = []
    for row in rows:
        if row.get("question") and row.get("answer"):
            lines.append(f"On {row.get('askedAt') or 'a previous session'} the desk asked “{row['question']}”.")
    return lines[:2]


async def _memory_answer(cypher: list[str]) -> str:
    cypher.append(brain.RECENT_MEMORIES.strip())
    rows = await brain.run(brain.RECENT_MEMORIES)
    if not rows:
        return "No earlier session is stored in the graph yet. Ask a company question and it will be remembered."
    parts = [f"“{row['question']}” — {row['answer']}" for row in rows if row.get("question")]
    return "Remembered from the graph, newest first: " + " | ".join(parts[:3])


async def _owns_answer(entity: dict, cypher: list[str], steps: list[dict], sources: list[dict]) -> str:
    cypher.append(brain.OWNS_PEOPLE.strip())
    cypher.append(brain.OWNS_TEAMS.strip())
    people = await brain.run(brain.OWNS_PEOPLE, {"id": entity["id"]})
    teams = await brain.run(brain.OWNS_TEAMS, {"id": entity["id"]})
    sources.append(_source(entity["name"], entity["kind"], entity["id"], "matched node"))
    for row in people:
        steps.append({"from_label": row["person"], "relationship": "OWNS", "to_label": entity["name"]})
        sources.append(_source(row["person"], "Person", row["personId"], row.get("role") or "owner"))
    for row in teams:
        steps.append({"from_label": row["team"], "relationship": "OWNS", "to_label": entity["name"]})
        sources.append(_source(row["team"], "Team", row["teamId"], "owning team"))
    if not people and not teams:
        return f"Nothing in the graph OWNS {entity['name']} ({entity['kind']})."
    owners = ", ".join(f"{row['person']} ({row.get('role') or 'owner'})" for row in people)
    team_names = ", ".join(row["team"] for row in teams)
    text = f"{owners} owns {entity['name']}." if owners else f"No single person owns {entity['name']}."
    if team_names:
        text += f" Owning team: {team_names}."
    return text


async def _knows_answer(entity: dict, cypher: list[str], steps: list[dict], sources: list[dict]) -> str:
    sources.append(_source(entity["name"], entity["kind"], entity["id"], "matched node"))
    if entity["kind"] == "Person":
        cypher.append(brain.PERSON_REACH.strip())
        rows = await brain.run(brain.PERSON_REACH, {"id": entity["id"]})
        if not rows:
            return f"{entity['name']} has no KNOWS_ABOUT, WORKED_ON, AUTHORED, or OWNS edges."
        bits = []
        for row in rows:
            steps.append({"from_label": entity["name"], "relationship": row["rel"], "to_label": row["thing"]})
            sources.append(_source(str(row["thing"]), brain.label_of(row.get("kind")), str(row["thingId"]), row["rel"]))
            bits.append(f"{row['rel'].replace('_', ' ').lower()} {row['thing']}")
        return f"{entity['name']} {'; '.join(bits)}."
    cypher.append(brain.KNOWS.strip())
    rows = await brain.run(brain.KNOWS, {"id": entity["id"]})
    if not rows:
        return f"Nobody in the graph knows, worked on, or authored {entity['name']}."
    bits = []
    for row in rows:
        steps.append({"from_label": row["person"], "relationship": row["rel"], "to_label": entity["name"]})
        sources.append(_source(row["person"], "Person", row["personId"], row.get("role") or row["rel"]))
        bits.append(f"{row['person']} ({row.get('role') or row['rel']}) — {row['rel']}")
    return f"Who knows {entity['name']}: " + "; ".join(bits) + "."


async def _decision_answer(entity: dict, cypher: list[str], steps: list[dict], sources: list[dict]) -> str:
    query = brain.DECISION_BY_ID if entity["kind"] == "Decision" else brain.DECISION_TRACE
    cypher.append(query.strip())
    rows = await brain.run(query, {"id": entity["id"]})
    if not rows:
        return f"No decision in the graph traces back through {entity['name']}."
    grouped: dict[str, dict] = {}
    for row in rows:
        item = grouped.setdefault(row["id"], {
            "title": row.get("title"),
            "summary": row.get("summary"),
            "decidedOn": row.get("decidedOn"),
            "people": set(),
            "docs": set(),
            "affects": set(),
        })
        if row.get("person"):
            item["people"].add((row["person"], row.get("personId")))
        if row.get("document"):
            item["docs"].add((row["document"], row.get("documentId")))
        if row.get("affects"):
            item["affects"].add((row["affects"], row.get("affectsId")))
    paragraphs = []
    for item in grouped.values():
        people = ", ".join(name for name, _ in item["people"]) or "an unrecorded owner"
        docs = ", ".join(name for name, _ in item["docs"]) or "no source document"
        affects = ", ".join(name for name, _ in item["affects"]) or entity["name"]
        paragraphs.append(
            f"{item['title']} ({item['decidedOn']}) was decided by {people}, based on {docs}, and affects {affects}. {item['summary']}"
        )
        for name, node_id in item["people"]:
            steps.append({"from_label": item["title"], "relationship": "DECIDED_BY", "to_label": name})
            sources.append(_source(name, "Person", str(node_id), "decided by"))
        for name, node_id in item["docs"]:
            steps.append({"from_label": item["title"], "relationship": "BASED_ON", "to_label": name})
            sources.append(_source(name, "Document", str(node_id), "source document"))
        for name, node_id in item["affects"]:
            steps.append({"from_label": item["title"], "relationship": "AFFECTS", "to_label": name})
            sources.append(_source(name, "Affected", str(node_id or ""), "affected"))
    return " ".join(paragraphs)


async def _issue_answer(entity: dict, cypher: list[str], steps: list[dict], sources: list[dict]) -> str:
    cypher.append(brain.ISSUE_INVESTIGATION.strip())
    rows = await brain.run(
        brain.ISSUE_INVESTIGATION,
        {"id": entity["id"], "needle": entity["name"]},
    )
    if not rows:
        return f"No Issue node in the graph matches {entity['name']}."
    row = rows[0]
    issue_title = row.get("issueTitle") or entity["name"]
    sources.append(_source(issue_title, "Issue", str(row.get("issueId") or entity["id"]), row.get("issueStatus") or "open"))
    project = next((r.get("project") for r in rows if r.get("project")), None)
    subsidiary = next((r.get("subsidiary") for r in rows if r.get("subsidiary")), None)
    person = next((r.get("person") for r in rows if r.get("person")), None)
    team = next((r.get("team") for r in rows if r.get("team")), None)
    decision = next((r.get("decision") for r in rows if r.get("decision")), None)
    document = next((r.get("document") for r in rows if r.get("document")), None)
    fact = next((r.get("fact") for r in rows if r.get("fact")), None)
    project_id = next((r.get("projectId") for r in rows if r.get("projectId")), None)
    person_row = next((r for r in rows if r.get("person")), row)
    if project:
        steps.append({"from_label": issue_title, "relationship": "AFFECTS", "to_label": str(project)})
        sources.append(_source(str(project), "Project", str(project_id or ""), "owning project"))
    if subsidiary:
        sub_id = next((r.get("subsidiaryId") for r in rows if r.get("subsidiaryId")), "")
        steps.append({"from_label": issue_title, "relationship": "AFFECTS", "to_label": str(subsidiary)})
        sources.append(_source(str(subsidiary), "Subsidiary", str(sub_id), "affected subsidiary"))
    if person and project:
        rel = str(person_row.get("personRel") or "RESPONSIBLE_FOR")
        steps.append({"from_label": str(person), "relationship": rel, "to_label": str(project)})
        sources.append(_source(str(person), "Person", str(person_row.get("personId") or ""), person_row.get("role") or rel))
    if team and project:
        team_id = next((r.get("teamId") for r in rows if r.get("teamId")), "")
        steps.append({"from_label": str(team), "relationship": "OWNS", "to_label": str(project)})
        sources.append(_source(str(team), "Team", str(team_id), "owning team"))
    if decision:
        dec_id = next((r.get("decisionId") for r in rows if r.get("decisionId")), "")
        decided = next((r.get("decidedOn") for r in rows if r.get("decidedOn")), "")
        steps.append({"from_label": str(decision), "relationship": "AFFECTS", "to_label": str(project or subsidiary or issue_title)})
        sources.append(_source(str(decision), "Decision", str(dec_id), str(decided)))
    if document and decision:
        doc_id = next((r.get("documentId") for r in rows if r.get("documentId")), "")
        steps.append({"from_label": str(decision), "relationship": "BASED_ON", "to_label": str(document)})
        sources.append(_source(str(document), "Document", str(doc_id), "source document"))
    if fact and document:
        fact_id = next((r.get("factId") for r in rows if r.get("factId")), "")
        conf = next((r.get("confidence") for r in rows if r.get("confidence")), None)
        page = next((r.get("pageRef") for r in rows if r.get("pageRef")), None)
        steps.append({"from_label": str(fact)[:60], "relationship": "EXTRACTED_FROM", "to_label": str(document)})
        sources.append(_source(str(fact)[:80], "Fact", str(fact_id), f"confidence={conf}, page={page}"))
    if not project and not subsidiary:
        return f"{issue_title} is in the graph but is not linked to a project or subsidiary yet — missing ownership evidence."
    owner = f"{person} ({row.get('role') or 'responsible'})" if person else "no named responsible person in the graph"
    proj_part = f"Project: {project}." if project else ""
    sub_part = f" Subsidiary: {subsidiary}." if subsidiary else ""
    if decision and document:
        support = f" Decision “{decision}” is based on {document}."
    elif decision:
        support = f" Decision “{decision}” is recorded, but no source document is linked."
    else:
        support = " No decision in the graph supports this issue yet — cannot defend a House answer from relationships alone."
    fact_part = f" Supporting fact: {fact} (page {row.get('pageRef')})." if fact else ""
    return f"Issue “{issue_title}”. {proj_part}{sub_part} Responsible: {owner}.{support}{fact_part}"


async def _evidence_answer(entity: dict, cypher: list[str], steps: list[dict], sources: list[dict]) -> str:
    project_id = entity["id"] if entity["kind"] == "Project" else None
    if not project_id:
        cypher.append(brain.ISSUE_INVESTIGATION.strip())
        rows = await brain.run(brain.ISSUE_INVESTIGATION, {"id": entity["id"], "needle": entity["name"]})
        if rows and rows[0].get("projectId"):
            project_id = rows[0]["projectId"]
    if not project_id:
        return f"Cannot traverse evidence from {entity['name']} without a linked Project node."
    cypher.append(brain.EVIDENCE_FROM_PROJECT.strip())
    rows = await brain.run(brain.EVIDENCE_FROM_PROJECT, {"id": project_id})
    if not rows:
        return "The graph returned no evidence rows for that project."
    decisions: set[str] = set()
    docs: set[str] = set()
    facts: list[str] = []
    for row in rows:
        if row.get("decision"):
            decisions.add(str(row["decision"]))
            if row.get("document"):
                steps.append({"from_label": str(row["decision"]), "relationship": "BASED_ON", "to_label": str(row["document"])})
                docs.add(str(row["document"]))
                sources.append(_source(str(row["document"]), "Document", str(row.get("documentId") or ""), "source"))
            sources.append(_source(str(row["decision"]), "Decision", str(row.get("decisionId") or ""), "affects project"))
        if row.get("fact"):
            facts.append(str(row["fact"]))
            steps.append({"from_label": str(row["fact"])[:50], "relationship": "EXTRACTED_FROM", "to_label": str(row.get("document") or "document")})
            sources.append(_source(str(row["fact"])[:80], "Fact", str(row.get("factId") or ""), f"page {row.get('pageRef')}"))
    if not decisions and not facts:
        return f"No Decision or Fact nodes support {rows[0].get('project') or entity['name']} in the graph."
    return (
        f"Evidence for {rows[0].get('project')}: decisions — {', '.join(sorted(decisions)) or 'none'}; "
        f"documents — {', '.join(sorted(docs)) or 'none'}; facts — {' | '.join(facts) or 'none'}."
    )


async def _related_answer(entity: dict, cypher: list[str], steps: list[dict], sources: list[dict]) -> str:
    if entity["kind"] != "Project":
        return "Name a project to discover related work through shared mines, teams, or decisions."
    cypher.append(brain.RELATED_PROJECTS.strip())
    rows = await brain.run(brain.RELATED_PROJECTS, {"id": entity["id"]})
    if not rows:
        return f"No related projects found for {entity['name']}."
    row = rows[0]
    shared = _listish(row.get("sharedDependency"))
    teams = _listish(row.get("sharedTeam"))
    decisions = _listish(row.get("sharedDecision"))
    sources.append(_source(entity["name"], "Project", entity["id"], "anchor project"))
    for name in shared:
        steps.append({"from_label": name, "relationship": "SHARED_DEPENDENCY", "to_label": entity["name"]})
    for name in teams:
        steps.append({"from_label": entity["name"], "relationship": "SHARED_TEAM", "to_label": name})
    for name in decisions:
        steps.append({"from_label": entity["name"], "relationship": "SHARED_DECISION", "to_label": name})
    if not any([shared, teams, decisions]):
        return f"{entity['name']} has no other projects linked through shared dependencies, teams, or decisions."
    parts = []
    if shared:
        parts.append("shared mine or dependency with " + ", ".join(shared))
    if teams:
        parts.append("same owning team as " + ", ".join(teams))
    if decisions:
        parts.append("linked through decisions to " + ", ".join(decisions))
    return f"Projects related to {entity['name']}: " + "; ".join(parts) + "."


async def _gaps_answer(cypher: list[str], steps: list[dict], sources: list[dict]) -> str:
    cypher.append(brain.KNOWLEDGE_GAPS.strip())
    rows = await brain.run(brain.KNOWLEDGE_GAPS)
    if not rows:
        return "Every project in the graph has an owner, a decision, and at least one supporting fact."
    lines = []
    for row in rows:
        project = row.get("project") or row.get("projectId")
        gaps = []
        if not row.get("owner"):
            gaps.append("no Person OWNS/RESPONSIBLE_FOR")
        if int(row.get("decisionCount") or 0) == 0:
            gaps.append("no Decision AFFECTS")
        if int(row.get("factCount") or 0) == 0:
            gaps.append("no Fact EXTRACTED_FROM documents")
        lines.append(f"{project}: {', '.join(gaps)}")
        steps.append({"from_label": str(project), "relationship": "GAP", "to_label": ", ".join(gaps)})
        sources.append(_source(str(project), "Project", str(row.get("projectId") or ""), "knowledge gap"))
    return "Knowledge gaps detected: " + "; ".join(lines) + "."


async def _aliases_answer(cypher: list[str], steps: list[dict], sources: list[dict]) -> str:
    cypher.append(brain.ENTITY_ALIASES.strip())
    rows = await brain.run(brain.ENTITY_ALIASES)
    if not rows:
        return "No aliases or duplicate names are recorded in the graph."
    bits = []
    for row in rows:
        name = row.get("name")
        alias = row.get("alias")
        kind = brain.label_of(row.get("kind"))
        bits.append(f"{name} ({kind}) also known as {alias}")
        steps.append({"from_label": str(name), "relationship": "ALIAS", "to_label": str(alias)})
        sources.append(_source(str(name), kind, str(row.get("id") or ""), f"alias={alias}"))
    return "Possible duplicate or aliased entities (original names preserved): " + "; ".join(bits) + "."


def _listish(value) -> list[str]:
    if isinstance(value, list):
        return [str(item) for item in value if item]
    return [str(value)] if value else []


async def _impact_answer(entity: dict, cypher: list[str], steps: list[dict], sources: list[dict]) -> str:
    cypher.append(brain.IMPACT.strip())
    rows = await brain.run(brain.IMPACT, {"id": entity["id"]})
    sources.append(_source(entity["name"], entity["kind"], entity["id"], "impact root"))
    if not rows:
        return f"Nothing in the graph depends on {entity['name']}."
    row = rows[0]

    def names(key: str) -> list[str]:
        value = row.get(key) or []
        if isinstance(value, list):
            return [str(item) for item in value if item]
        return [str(value)] if value else []

    projects, decisions, tickets, issues, documents, chats = (
        names("projects"), names("decisions"), names("tickets"), names("issues"), names("documents"), names("chats"),
    )
    if not any([projects, decisions, tickets, issues, documents, chats]):
        return f"The graph has {entity['name']}, and no project, decision, ticket, issue, document, or chat depends on it."
    for project in projects:
        steps.append({"from_label": project, "relationship": "DEPENDS_ON", "to_label": entity["name"]})
    for title in decisions:
        steps.append({"from_label": title, "relationship": "AFFECTS", "to_label": entity["name"]})
    parts = [f"If {entity['name']} stops, the graph shows:"]
    if projects:
        parts.append("projects that depend on it: " + ", ".join(projects) + ".")
    if decisions:
        parts.append("decisions that affect it: " + ", ".join(decisions) + ".")
    if tickets:
        parts.append("open tickets: " + ", ".join(tickets) + ".")
    if issues:
        parts.append("open issues: " + ", ".join(issues) + ".")
    if documents:
        parts.append("documents about it: " + ", ".join(documents) + ".")
    if chats:
        parts.append("chats that mention the thread: " + ", ".join(chats) + ".")
    return " ".join(parts)


async def _path_answer(left: dict, right: dict, cypher: list[str], steps: list[dict], sources: list[dict]) -> str:
    cypher.append(brain.SHORTEST_PATH.strip())
    try:
        rows = await brain.run(brain.SHORTEST_PATH, {"fromId": left["id"], "toId": right["id"]})
    except GraphUnavailable:
        raise
    except Exception:
        return await _brief_answer(left, cypher, steps, sources)
    if not rows:
        return f"No path of length 8 or less connects {left['name']} to {right['name']}."
    names = rows[0].get("names") or []
    rels = rows[0].get("rels") or []
    ids = rows[0].get("ids") or []
    if isinstance(names, str):
        names = [names]
    for index, rel in enumerate(rels):
        if index + 1 < len(names):
            steps.append({"from_label": str(names[index]), "relationship": str(rel), "to_label": str(names[index + 1])})
    for index, name in enumerate(names):
        node_id = str(ids[index]) if index < len(ids) else ""
        sources.append(_source(str(name), "Path", node_id, "shortest path"))
    chain = " → ".join(str(name) for name in names)
    return f"Shortest path from {left['name']} to {right['name']}: {chain}."


async def _brief_answer(entity: dict, cypher: list[str], steps: list[dict], sources: list[dict]) -> str:
    cypher.append(brain.NEIGHBORS.strip())
    rows = await brain.run(brain.NEIGHBORS, {"id": entity["id"]})
    sources.append(_source(entity["name"], entity["kind"], entity["id"], "matched node"))
    if not rows:
        return f"{entity['name']} is a {entity['kind']} in the company graph and has no relationships yet."
    bits = []
    for row in rows:
        other = str(row.get("other") or "")
        rel = str(row.get("rel") or "RELATED")
        if row.get("dir") == "out":
            steps.append({"from_label": entity["name"], "relationship": rel, "to_label": other})
            bits.append(f"{rel.replace('_', ' ').lower()} {other}")
        else:
            steps.append({"from_label": other, "relationship": rel, "to_label": entity["name"]})
            bits.append(f"{other} {rel.replace('_', ' ').lower()} this")
        sources.append(_source(other, brain.label_of(row.get("kind")), str(row.get("otherId") or ""), rel))
    return f"{entity['name']} ({entity['kind']}) — " + "; ".join(bits[:8]) + "."


async def brief() -> dict:
    counts_rows = await brain.run(brain.COUNTS)
    counts: dict[str, int] = {}
    for row in counts_rows:
        kind = brain.label_of(row.get("kind"))
        total = row.get("total") or 0
        counts[kind] = counts.get(kind, 0) + int(total)
    try:
        people = await brain.run(brain.PAGE_RANK)
        central = [
            {"name": row.get("name"), "role": row.get("role") or "", "connections": int(float(row.get("score") or 0))}
            for row in people if row.get("name")
        ]
    except Exception:
        people = await brain.run(brain.CENTRALITY)
        central = [
            {"name": row.get("name"), "role": row.get("role") or "", "connections": int(row.get("connections") or 0)}
            for row in people if row.get("name")
        ]
    decisions = await brain.run(brain.RECENT_DECISIONS)
    return {
        "graph": "falkordb",
        "counts": counts,
        "central_people": central,
        "recent_decisions": [
            {
                "title": row.get("title") or "",
                "decided_on": str(row.get("decidedOn") or ""),
                "summary": row.get("summary") or "",
            }
            for row in decisions
        ],
    }


# re-export for the query engine's offline check
__all__ = ["GraphUnavailable", "answer", "brief", "classify"]
