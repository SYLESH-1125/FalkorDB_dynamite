from app.infrastructure.graph.neo4j_client import get_driver
from app.infrastructure.db.models import Document, ExtractedField


NODE_LABELS = ["Document", "Subsidiary", "Mine"]


def _node_label(labels: list[str]) -> str:
    return next((l for l in labels if l in NODE_LABELS), labels[0] if labels else "Unknown")


def _node_display(kind: str, properties: dict) -> str:
    return str(properties.get("name") or properties.get("code") or properties.get("id") or kind)


async def fetch_knowledge_graph(limit: int = 500) -> tuple[list[dict], list[dict]]:
    driver = get_driver()
    nodes: dict[str, dict] = {}
    edges: list[dict] = []

    async with driver.session() as session:
        result = await session.run(
            "MATCH (a)-[r]->(b) RETURN a, r, b LIMIT $limit", limit=limit,
        )
        async for record in result:
            for node in (record["a"], record["b"]):
                if node.element_id not in nodes:
                    kind = _node_label(list(node.labels))
                    properties = {k: str(v) for k, v in dict(node).items()}
                    nodes[node.element_id] = {
                        "id": node.element_id,
                        "kind": kind,
                        "label": _node_display(kind, properties),
                        "properties": properties,
                    }
            rel = record["r"]
            edges.append({
                "id": rel.element_id,
                "source": rel.start_node.element_id,
                "target": rel.end_node.element_id,
                "type": rel.type,
            })

    return list(nodes.values()), edges


async def seed_subsidiaries(codes: list[str]) -> None:
    driver = get_driver()
    async with driver.session() as session:
        for code in codes:
            await session.run(
                "MERGE (s:Subsidiary {code: $code}) SET s.name = $code", code=code,
            )


async def publish_document_to_graph(document: Document, fields: list[ExtractedField]) -> None:
    driver = get_driver()
    async with driver.session() as session:
        await session.run(
            """
            MERGE (d:Document {id: $id})
            SET d.name = $name, d.kind = $kind
            MERGE (s:Subsidiary {code: $subsidiaryCode})
            MERGE (d)-[:BELONGS_TO]->(s)
            """,
            id=document.id,
            name=document.name,
            kind=document.kind,
            subsidiaryCode=document.subsidiary_code,
        )

        mine_name = next(
            (
                f.corrected_value or f.extracted_value
                for f in fields
                if f.label == "Mine Name" and f.status == "validated"
                and (f.corrected_value or f.extracted_value)
            ),
            None,
        )
        if mine_name:
            await session.run(
                """
                MATCH (d:Document {id: $id})
                MERGE (m:Mine {name: $mineName})
                MERGE (d)-[:REFERENCES]->(m)
                """,
                id=document.id,
                mineName=mine_name,
            )
