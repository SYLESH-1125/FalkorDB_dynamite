import time
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.infrastructure.db.models import (
    Document, DocumentChunk, ExtractedField, PipelineStage, ProcessingJob, ValidationRecord,
)
from app.infrastructure.storage.s3_client import get_object_bytes, put_json
from app.services.embeddings import chunk_text, embed_batch
from app.services.extraction import extract_fields
from app.services.parsers.docx_parser import parse_docx
from app.services.parsers.image_parser import parse_image
from app.services.parsers.pdf_parser import parse_pdf
from app.services.parsers.spreadsheet_parser import parse_spreadsheet

STAGE_NAMES = ["Ingestion", "OCR / Digitization", "Table Extraction", "Entity Recognition", "Indexing"]


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def _set_stage(db, job_id: str, name: str, **fields) -> None:
    result = await db.execute(
        select(PipelineStage).where(PipelineStage.job_id == job_id, PipelineStage.name == name),
    )
    stage = result.scalar_one()
    for k, v in fields.items():
        setattr(stage, k, v)
    await db.commit()


async def run_pipeline(document_id: str, session_factory: async_sessionmaker) -> None:
    async with session_factory() as db:
        try:
            await _capture(db, document_id)
            parsed = await _parse(db, document_id)
            await _entity_recognition(db, document_id, parsed)
            await _indexing(db, document_id, parsed)
        except Exception as exc:
            await _fail(db, document_id, str(exc))


async def _capture(db, document_id: str) -> ProcessingJob:
    document = (await db.execute(select(Document).where(Document.id == document_id))).scalar_one()

    ocr_engine = "Tesseract 5.3" if document.kind in ("scan", "image") else "Native text layer"
    language = "English"

    job = ProcessingJob(
        id=str(uuid.uuid4()),
        document_id=document.id,
        started_at=_now(),
        ocr_engine=ocr_engine,
        language=language,
    )
    db.add(job)
    await db.flush()

    for i, name in enumerate(STAGE_NAMES):
        db.add(PipelineStage(
            job_id=job.id, name=name, stage_order=i,
            status="running" if name == "Ingestion" else "pending",
            progress=0, duration_ms=0, message="",
        ))
    await db.commit()

    document.status = "processing"
    document.progress = 20
    await db.commit()

    start = time.monotonic()
    await _set_stage(
        db, job.id, "Ingestion",
        status="complete", progress=100,
        duration_ms=int((time.monotonic() - start) * 1000), message="Completed",
    )
    return job


async def _parse(db, document_id: str) -> dict:
    document = (await db.execute(select(Document).where(Document.id == document_id))).scalar_one()
    job = (await db.execute(select(ProcessingJob).where(ProcessingJob.document_id == document_id))).scalar_one()

    file_bytes = get_object_bytes(document.storage_key)

    start = time.monotonic()
    if document.kind == "pdf":
        parsed = parse_pdf(file_bytes)
        ocr_msg = "OCR applied to scanned pages" if parsed["used_ocr"] else "Native text layer detected, OCR skipped"
    elif document.kind == "spreadsheet":
        parsed = parse_spreadsheet(file_bytes, document.name)
        ocr_msg = "No OCR required for spreadsheet"
    elif document.kind == "docx":
        parsed = parse_docx(file_bytes)
        ocr_msg = "No OCR required for document"
    else:
        parsed = parse_image(file_bytes)
        ocr_msg = "Full-page OCR applied"

    await _set_stage(
        db, job.id, "OCR / Digitization",
        status="complete", progress=100,
        duration_ms=int((time.monotonic() - start) * 1000), message=ocr_msg,
    )

    table_msg = (
        f"{len(parsed['tables'])} table(s) extracted" if parsed["tables"]
        else "No tabular data found" if document.kind not in ("image", "scan")
        else "Not applicable for image documents"
    )
    await _set_stage(
        db, job.id, "Table Extraction",
        status="complete", progress=100, duration_ms=0, message=table_msg,
    )

    put_json(f"documents/{document.id}/parsed.json", {
        "text": parsed["text"][:20000],
        "tables": parsed["tables"],
        "page_count": parsed["page_count"],
    })

    document.page_count = parsed["page_count"]
    document.progress = 60
    await db.commit()

    return parsed


async def _entity_recognition(db, document_id: str, parsed: dict) -> None:
    document = (await db.execute(select(Document).where(Document.id == document_id))).scalar_one()
    job = (await db.execute(select(ProcessingJob).where(ProcessingJob.document_id == document_id))).scalar_one()

    start = time.monotonic()
    field_dicts = extract_fields(parsed["text"], parsed["tables"])

    record = ValidationRecord(
        id=str(uuid.uuid4()), document_id=document.id, assigned_to_user_id=None, submitted_at=_now(),
    )
    db.add(record)
    await db.flush()

    for fd in field_dicts:
        db.add(ExtractedField(id=str(uuid.uuid4()), record_id=record.id, **fd))

    matched = sum(1 for f in field_dicts if f["extracted_value"])
    await db.commit()

    await _set_stage(
        db, job.id, "Entity Recognition",
        status="complete", progress=100,
        duration_ms=int((time.monotonic() - start) * 1000),
        message=f"{matched} of {len(field_dicts)} fields identified",
    )

    document.progress = 85
    await db.commit()


async def _indexing(db, document_id: str, parsed: dict) -> None:
    document = (await db.execute(select(Document).where(Document.id == document_id))).scalar_one()
    job = (await db.execute(select(ProcessingJob).where(ProcessingJob.document_id == document_id))).scalar_one()
    record = (
        await db.execute(select(ValidationRecord).where(ValidationRecord.document_id == document_id))
    ).scalar_one()
    fields = (
        await db.execute(select(ExtractedField).where(ExtractedField.record_id == record.id))
    ).scalars().all()

    confidences = [float(f.confidence) for f in fields if f.confidence]
    document.confidence = round(sum(confidences) / len(confidences), 1) if confidences else 0.0
    document.status = "extracted"
    document.progress = 100
    await db.commit()

    start = time.monotonic()
    chunk_count = await _embed_document(db, document, fields, parsed)

    await _set_stage(
        db, job.id, "Indexing",
        status="complete", progress=100,
        duration_ms=int((time.monotonic() - start) * 1000),
        message=f"Indexed and query-ready ({chunk_count} chunk(s) embedded)",
    )


async def _embed_document(db, document: Document, fields: list[ExtractedField], parsed: dict) -> int:
    """Embeds parsed text chunks and non-empty extracted field values for semantic search."""
    chunks = chunk_text(parsed.get("text", ""))
    if chunks:
        chunk_vectors = embed_batch(chunks)
        for i, (text, vector) in enumerate(zip(chunks, chunk_vectors)):
            db.add(DocumentChunk(
                document_id=document.id, chunk_index=i, page_ref=1, text=text, embedding=vector,
            ))

    labeled = [f for f in fields if f.extracted_value]
    if labeled:
        field_texts = [f"{f.label}: {f.corrected_value or f.extracted_value}" for f in labeled]
        field_vectors = embed_batch(field_texts)
        for field, vector in zip(labeled, field_vectors):
            field.embedding = vector

    await db.commit()
    return len(chunks)


async def _fail(db, document_id: str, error: str) -> None:
    document = (await db.execute(select(Document).where(Document.id == document_id))).scalar_one()
    document.status = "error"
    document.error_message = error[:500]
    await db.commit()

    job = (
        await db.execute(select(ProcessingJob).where(ProcessingJob.document_id == document_id))
    ).scalar_one_or_none()
    if job:
        running = (
            await db.execute(
                select(PipelineStage).where(
                    PipelineStage.job_id == job.id, PipelineStage.status.in_(["running", "pending"]),
                ),
            )
        ).scalars().first()
        if running:
            running.status = "failed"
            running.message = error[:500]
            await db.commit()
