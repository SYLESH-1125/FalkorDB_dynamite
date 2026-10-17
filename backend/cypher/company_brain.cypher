// Company Brain queries. FalkorDB is the only store these run against.
// Graph: bhumi_company_brain
// Synthetic organisation: people, teams, projects, documents, decisions, tickets, chats.

// Who owns a project, mine, or document
MATCH (person:Person)-[:OWNS]->(thing {id: $id})
RETURN person.id AS personId, person.name AS person, person.role AS role;

MATCH (team:Team)-[:OWNS]->(thing {id: $id})
RETURN team.id AS teamId, team.name AS team;

// Who knows what — expertise, authorship, and past work
MATCH (person:Person)-[r:KNOWS_ABOUT|WORKED_ON|AUTHORED]->(thing {id: $id})
RETURN person.id AS personId, person.name AS person, person.role AS role, type(r) AS rel;

MATCH (person:Person {id: $id})-[r:KNOWS_ABOUT|WORKED_ON|AUTHORED|OWNS]->(thing)
RETURN person.name AS person, type(r) AS rel, coalesce(thing.name, thing.title) AS thing,
       labels(thing) AS kind, thing.id AS thingId;

// Trace a decision back to the person and the source document
MATCH (d:Decision {id: $id})
OPTIONAL MATCH (d)-[:DECIDED_BY]->(p:Person)
OPTIONAL MATCH (d)-[:BASED_ON]->(doc:Document)
OPTIONAL MATCH (d)-[:AFFECTS]->(affected)
RETURN d.id AS id, d.title AS title, d.summary AS summary, d.decidedOn AS decidedOn,
       p.name AS person, doc.name AS document, coalesce(affected.name, affected.title) AS affects;

MATCH (d:Decision)-[:AFFECTS|DECIDED_BY|BASED_ON]->(thing {id: $id})
OPTIONAL MATCH (d)-[:DECIDED_BY]->(p:Person)
OPTIONAL MATCH (d)-[:BASED_ON]->(doc:Document)
OPTIONAL MATCH (d)-[:AFFECTS]->(affected)
RETURN d.title AS title, d.summary AS summary, d.decidedOn AS decidedOn,
       p.name AS person, doc.name AS document, coalesce(affected.name, affected.title) AS affects;

// What breaks if a mine, subsidiary, or project stops
MATCH (thing {id: $id})
OPTIONAL MATCH (proj:Project)-[:DEPENDS_ON]->(thing)
OPTIONAL MATCH (d:Decision)-[:AFFECTS]->(thing)
OPTIONAL MATCH (t:Ticket)-[:ABOUT]->(thing)
OPTIONAL MATCH (doc:Document)-[:ABOUT|REFERENCES]->(thing)
OPTIONAL MATCH (chat:Chat)-[:MENTIONS]->(thing)
RETURN coalesce(thing.name, thing.title) AS name,
       collect(DISTINCT proj.name) AS projects,
       collect(DISTINCT d.title) AS decisions,
       collect(DISTINCT t.title) AS tickets,
       collect(DISTINCT doc.name) AS documents,
       collect(DISTINCT chat.name) AS chats;

// Shortest path between two company nodes
MATCH (a {id: $fromId}), (b {id: $toId})
MATCH p = shortestPath((a)-[*..8]-(b))
RETURN [n IN nodes(p) | coalesce(n.name, n.title, n.id)] AS names,
       [rel IN relationships(p) | type(rel)] AS rels;

// Who is central — PageRank over who-knows-what, with degree as the fallback
CALL algo.pageRank('Person', 'KNOWS_ABOUT')
YIELD node, score
RETURN node.name AS name, node.role AS role, score
ORDER BY score DESC
LIMIT 5;

MATCH (p:Person)
OPTIONAL MATCH (p)-[r]-()
RETURN p.name AS name, p.role AS role, count(r) AS connections
ORDER BY connections DESC
LIMIT 5;

// Memory across sessions
MATCH (m:Memory)-[:ABOUT]->(n {id: $id})
RETURN m.question AS question, m.answer AS answer, m.askedAt AS askedAt
ORDER BY m.askedAt DESC
LIMIT 3;

// Keep knowledge current — a newly recorded decision
MERGE (d:Decision {id: $id})
SET d.title = $title, d.name = $title, d.summary = $summary, d.decidedOn = $on
MERGE (p:Person {name: $decidedBy})
MERGE (d)-[:DECIDED_BY]->(p)
MERGE (doc:Document {name: $basedOn})
MERGE (d)-[:BASED_ON]->(doc);

// Issue ownership + multi-hop evidence (project, decision, document, fact)
MATCH (i:Issue)
WHERE i.id = $id OR toLower(coalesce(i.title, i.name, '')) CONTAINS toLower($needle)
WITH i ORDER BY size(coalesce(i.title, i.name, '')) DESC LIMIT 1
OPTIONAL MATCH (i)-[:AFFECTS]->(proj:Project)
OPTIONAL MATCH (person:Person)-[pr:OWNS|RESPONSIBLE_FOR]->(proj)
OPTIONAL MATCH (d:Decision)-[:AFFECTS]->(proj)
OPTIONAL MATCH (d)-[:BASED_ON]->(doc:Document)
OPTIONAL MATCH (f:Fact)-[:EXTRACTED_FROM]->(doc)
RETURN i.title AS issue, proj.name AS project, person.name AS responsible, d.title AS decision,
       doc.name AS document, f.statement AS fact;

// Related projects through shared dependencies, teams, or decisions
MATCH (p:Project {id: $id})
OPTIONAL MATCH (p)-[:DEPENDS_ON]->(shared)<-[:DEPENDS_ON]-(other:Project)
WHERE other.id <> p.id
OPTIONAL MATCH (team:Team)-[:OWNS]->(p)
OPTIONAL MATCH (team)-[:OWNS]->(peer:Project)
WHERE peer.id <> p.id
RETURN collect(DISTINCT other.name) AS sharedDependency, collect(DISTINCT peer.name) AS sharedTeam;

// Knowledge gaps — missing owner, decision, or supporting facts
MATCH (p:Project)
OPTIONAL MATCH (owner:Person)-[:OWNS|RESPONSIBLE_FOR]->(p)
OPTIONAL MATCH (d:Decision)-[:AFFECTS]->(p)
OPTIONAL MATCH (doc:Document)-[:ABOUT]->(p)
OPTIONAL MATCH (f:Fact)-[:EXTRACTED_FROM]->(doc)
WITH p, owner, collect(DISTINCT d.id) AS decisionIds, collect(DISTINCT f.id) AS factIds
WHERE owner IS NULL OR size([x IN decisionIds WHERE x IS NOT NULL]) = 0
   OR size([x IN factIds WHERE x IS NOT NULL]) = 0
RETURN p.name AS project, owner.name AS owner;

// Entity resolution — explicit aliases and exact duplicate names
MATCH (n)
WHERE n.alias IS NOT NULL
RETURN n.name AS name, n.alias AS alias, labels(n) AS kind;

// Upsert a fact with document provenance
MERGE (f:Fact {id: $id})
SET f.statement = $statement, f.confidence = $confidence, f.pageRef = $pageRef, f.extractedAt = $extractedAt
MERGE (doc:Document {id: $documentId})
MERGE (f)-[:EXTRACTED_FROM]->(doc);
