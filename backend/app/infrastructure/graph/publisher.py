from app.infrastructure.graph.neo4j_client import get_driver
from app.infrastructure.db.models import Document, ExtractedField


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
