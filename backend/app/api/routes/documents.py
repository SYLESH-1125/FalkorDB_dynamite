import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_admin
from app.domain.models import IngestedDocumentOut, PipelineStageOut, ProcessingJobOut
from app.infrastructure.db.base import SessionLocal
from app.infrastructure.db.models import (
    Document, DocumentChunk, ExtractedField, PipelineStage, ProcessingJob, User, ValidationRecord,
)
from app.infrastructure.storage.s3_client import delete_object, put_object
from app.services.pipeline import run_pipeline

router = APIRouter(prefix="/api/documents", tags=["documents"])

ACCEPTED_EXTENSIONS = {"pdf", "xlsx", "xls", "csv", "docx", "doc", "jpg", "jpeg", "png", "tiff"}
KIND_BY_EXT = {
    "pdf": "pdf", "xlsx": "spreadsheet", "xls": "spreadsheet", "csv": "spreadsheet",
    "docx": "docx", "doc": "docx", "jpg": "image", "jpeg": "image", "png": "image", "tiff": "scan",
}
MAX_SIZE_BYTES = 200 * 1024 * 1024


def _to_out(doc: Document, uploaded_by_name: str, subsidiary_code: str) -> IngestedDocumentOut:
    return IngestedDocumentOut(
        id=doc.id, name=doc.name, kind=doc.kind, size_bytes=doc.size_bytes,
        status=doc.status, progress=doc.progress, subsidiary=subsidiary_code,
        uploaded_by=uploaded_by_name, uploaded_at=doc.uploaded_at,
        page_count=doc.page_count, confidence=float(doc.confidence),
        error_message=doc.error_message,
    )


@router.get("", response_model=list[IngestedDocumentOut])
async def list_documents(
    db: AsyncSession = Depends(get_db), _user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Document).order_by(Document.uploaded_at.desc()),
    )
    docs = result.scalars().all()
    out = []
    for d in docs:
        uploader = (await db.execute(select(User).where(User.id == d.uploaded_by_user_id))).scalar_one()
        out.append(_to_out(d, uploader.name, d.subsidiary_code))
    return out


@router.post("", response_model=list[IngestedDocumentOut], status_code=201)
async def upload_documents(
    background_tasks: BackgroundTasks,
    files: list[UploadFile],
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_admin),
):
    created: list[Document] = []

    for file in files:
        ext = (file.filename or "").rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else ""
        if ext not in ACCEPTED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: .{ext}")

        content = await file.read()
        if len(content) > MAX_SIZE_BYTES:
            raise HTTPException(status_code=413, detail=f"{file.filename} exceeds 200MB limit")

        doc_id = str(uuid.uuid4())
        storage_key = f"documents/{doc_id}/{file.filename}"

        put_object(storage_key, content, file.content_type or "application/octet-stream")

        doc = Document(
            id=doc_id,
            name=file.filename or "untitled",
            kind=KIND_BY_EXT.get(ext, "pdf"),
            size_bytes=len(content),
            status="queued",
            progress=0,
            subsidiary_code=user.subsidiary_code,
            uploaded_by_user_id=user.id,
            uploaded_at=datetime.now(timezone.utc),
            page_count=0,
            confidence=0,
            storage_bucket="bhumi-documents",
            storage_key=storage_key,
            content_type=file.content_type or "application/octet-stream",
        )
        db.add(doc)
        created.append(doc)

    await db.commit()

    for doc in created:
        background_tasks.add_task(run_pipeline, doc.id, SessionLocal)

    return [_to_out(d, user.name, d.subsidiary_code) for d in created]


@router.post("/{document_id}/retry", response_model=IngestedDocumentOut)
async def retry_document(
    document_id: str, background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db), user: User = Depends(require_admin),
):
    doc = (await db.execute(select(Document).where(Document.id == document_id))).scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")

    job = (await db.execute(select(ProcessingJob).where(ProcessingJob.document_id == document_id))).scalar_one_or_none()
    if job:
        await db.execute(PipelineStage.__table__.delete().where(PipelineStage.job_id == job.id))
        await db.execute(ProcessingJob.__table__.delete().where(ProcessingJob.id == job.id))

    record = (
        await db.execute(select(ValidationRecord).where(ValidationRecord.document_id == document_id))
    ).scalar_one_or_none()
    if record:
        await db.execute(ExtractedField.__table__.delete().where(ExtractedField.record_id == record.id))
        await db.execute(ValidationRecord.__table__.delete().where(ValidationRecord.id == record.id))

    await db.execute(DocumentChunk.__table__.delete().where(DocumentChunk.document_id == document_id))

    doc.status = "processing"
    doc.progress = 12
    doc.error_message = None
    await db.commit()

    background_tasks.add_task(run_pipeline, doc.id, SessionLocal)

    uploader = (await db.execute(select(User).where(User.id == doc.uploaded_by_user_id))).scalar_one()
    return _to_out(doc, uploader.name, doc.subsidiary_code)


@router.delete("/{document_id}", status_code=204)
async def remove_document(
    document_id: str, db: AsyncSession = Depends(get_db), _user: User = Depends(require_admin),
):
    doc = (await db.execute(select(Document).where(Document.id == document_id))).scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")

    record = (
        await db.execute(select(ValidationRecord).where(ValidationRecord.document_id == document_id))
    ).scalar_one_or_none()
    if record:
        await db.execute(ExtractedField.__table__.delete().where(ExtractedField.record_id == record.id))
        await db.execute(ValidationRecord.__table__.delete().where(ValidationRecord.id == record.id))

    job = (await db.execute(select(ProcessingJob).where(ProcessingJob.document_id == document_id))).scalar_one_or_none()
    if job:
        await db.execute(PipelineStage.__table__.delete().where(PipelineStage.job_id == job.id))
        await db.execute(ProcessingJob.__table__.delete().where(ProcessingJob.id == job.id))

    await db.execute(DocumentChunk.__table__.delete().where(DocumentChunk.document_id == document_id))

    try:
        delete_object(doc.storage_key)
    except Exception:
        pass

    await db.delete(doc)
    await db.commit()


@router.get("/jobs", response_model=list[ProcessingJobOut])
async def list_jobs(db: AsyncSession = Depends(get_db), _user: User = Depends(require_admin)):
    jobs = (await db.execute(select(ProcessingJob))).scalars().all()
    out = []
    for job in jobs:
        doc = (await db.execute(select(Document).where(Document.id == job.document_id))).scalar_one()
        stages = (
            await db.execute(
                select(PipelineStage).where(PipelineStage.job_id == job.id).order_by(PipelineStage.stage_order),
            )
        ).scalars().all()
        out.append(ProcessingJobOut(
            id=job.id, document_id=job.document_id, document_name=doc.name,
            stages=[PipelineStageOut(
                name=s.name, status=s.status, progress=s.progress,
                duration_ms=s.duration_ms, message=s.message,
            ) for s in stages],
            started_at=job.started_at, ocr_engine=job.ocr_engine, language=job.language,
        ))
    return out
