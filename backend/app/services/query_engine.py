from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.models import Document, DocumentChunk, ExtractedField, ValidationRecord
from app.services.embeddings import embed_async
from app.services.llm import LlmNotConfigured, generate_answer, generate_general_knowledge_answer

TOP_K = 6

# cosine distance above this is treated as "not actually relevant" — pgvector's
# ORDER BY always returns TOP_K rows regardless of how poor the match is, so without
# this cutoff every query would look like a retrieval hit even when nothing relates
MAX_RELEVANT_DISTANCE = 0.45


async def _search_chunks(db: AsyncSession, query_vector: list[float]) -> list[DocumentChunk]:
    distance = DocumentChunk.embedding.cosine_distance(query_vector)
    result = await db.execute(
        select(DocumentChunk)
        .where(DocumentChunk.embedding.is_not(None), distance <= MAX_RELEVANT_DISTANCE)
        .order_by(distance)
        .limit(TOP_K),
    )
    return list(result.scalars().all())


async def _search_fields(db: AsyncSession, query_vector: list[float]) -> list[tuple[ExtractedField, str]]:
    """Returns (field, document_id) pairs — joined so the caller never needs a lazy load."""
    distance = ExtractedField.embedding.cosine_distance(query_vector)
    result = await db.execute(
        select(ExtractedField, ValidationRecord.document_id)
        .join(ValidationRecord, ExtractedField.record_id == ValidationRecord.id)
        .where(
            ExtractedField.embedding.is_not(None),
            ExtractedField.extracted_value != "",
            distance <= MAX_RELEVANT_DISTANCE,
        )
        .order_by(distance)
        .limit(TOP_K),
    )
    return [(row[0], row[1]) for row in result.all()]


async def answer_question(db: AsyncSession, question: str) -> tuple[str, list[dict]]:
    """Semantic retrieval over embedded document chunks + extracted fields (pgvector cosine
    similarity), then a grounded answer synthesized by an LLM over the retrieved evidence."""
    query_vector = await embed_async(question)

    chunks = await _search_chunks(db, query_vector)
    fields = await _search_fields(db, query_vector)

    if not chunks and not fields:
        try:
            body = await generate_general_knowledge_answer(question)
        except LlmNotConfigured:
            return (
                "No indexed documents matched this question yet. Upload and validate documents "
                "on the Data Pipeline pages, then ask again once extraction completes.",
                [],
            )
        except Exception as exc:
            return (f"No indexed documents matched this question, and the language model call failed ({exc}).", [])

        return (
            body,
            [{
                "document_name": "General knowledge — not from indexed documents",
                "page": 0,
                "snippet": "This answer was not found in the indexed corpus and is based on the model's general knowledge. It has not been verified against a source document.",
                "relevance": 0.0,
            }],
        )

    doc_ids = {c.document_id for c in chunks} | {doc_id for _, doc_id in fields}
    docs = {
        d.id: d
        for d in (await db.execute(select(Document).where(Document.id.in_(doc_ids)))).scalars().all()
    }

    context_blocks: list[str] = []
    citations: list[dict] = []

    for c in chunks:
        doc = docs.get(c.document_id)
        if not doc:
            continue
        context_blocks.append(f"[{doc.name}, p.{c.page_ref}]: {c.text}")
        citations.append({
            "document_name": doc.name, "page": c.page_ref,
            "snippet": c.text[:180], "relevance": 0.9,
        })

    for f, doc_id in fields:
        doc = docs.get(doc_id)
        if not doc:
            continue
        value = f.corrected_value or f.extracted_value
        context_blocks.append(f"[{doc.name}, p.{f.page_ref}]: {f.label}: {value}")
        citations.append({
            "document_name": doc.name, "page": f.page_ref,
            "snippet": f"{f.label}: {value}", "relevance": 0.85,
        })

    try:
        body = await generate_answer(question, context_blocks)
    except LlmNotConfigured:
        body = "Based on the indexed and validated corpus:\n\n" + "\n".join(
            f"- {b}" for b in context_blocks[:6]
        )
    except Exception as exc:
        body = (
            f"Retrieved {len(context_blocks)} relevant evidence block(s) but the language "
            f"model call failed ({exc}). Raw evidence:\n\n" + "\n".join(f"- {b}" for b in context_blocks[:6])
        )

    return body, citations[:6]
