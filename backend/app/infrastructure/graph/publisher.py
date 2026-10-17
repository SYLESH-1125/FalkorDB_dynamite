from app.infrastructure.db.models import Document, ExtractedField
from app.infrastructure.graph.company_brain import fetch_graph, publish_document, seed_company_brain


async def fetch_knowledge_graph(limit: int = 500) -> tuple[list[dict], list[dict]]:
    return await fetch_graph(limit)


async def seed_subsidiaries(codes: list[str]) -> None:
    await seed_company_brain(codes)


async def publish_document_to_graph(document: Document, fields: list[ExtractedField]) -> None:
    mine_name = next(
        (
            f.corrected_value or f.extracted_value
            for f in fields
            if f.label == "Mine Name" and f.status == "validated"
            and (f.corrected_value or f.extracted_value)
        ),
        None,
    )
    await publish_document(
        document_id=document.id,
        name=document.name,
        kind=document.kind,
        subsidiary_code=document.subsidiary_code,
        mine_name=mine_name,
    )
