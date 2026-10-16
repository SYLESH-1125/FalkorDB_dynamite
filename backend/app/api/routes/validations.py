from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_admin
from app.domain.models import ExtractedFieldIn, ExtractedFieldOut, ValidationRecordOut
from app.infrastructure.db.models import Document, ExtractedField, User, ValidationRecord
from app.infrastructure.graph.publisher import publish_document_to_graph
from app.services.embeddings import embed

router = APIRouter(prefix="/api/validations", tags=["validations"])


async def _to_out(db: AsyncSession, record: ValidationRecord) -> ValidationRecordOut:
    doc = (await db.execute(select(Document).where(Document.id == record.document_id))).scalar_one()
    assignee_name = "Unassigned"
    if record.assigned_to_user_id:
        assignee = (await db.execute(select(User).where(User.id == record.assigned_to_user_id))).scalar_one_or_none()
        if assignee:
            assignee_name = assignee.name

    fields = (
        await db.execute(
            select(ExtractedField).where(ExtractedField.record_id == record.id).order_by(ExtractedField.field_order),
        )
    ).scalars().all()

    return ValidationRecordOut(
        id=record.id, document_id=record.document_id, document_name=doc.name,
        subsidiary=doc.subsidiary_code, assigned_to=assignee_name, submitted_at=record.submitted_at,
        fields=[ExtractedFieldOut(
            id=f.id, label=f.label, extracted_value=f.extracted_value,
            corrected_value=f.corrected_value, confidence=float(f.confidence),
            status=f.status, page_ref=f.page_ref, bounding_box_hint=f.bounding_box_hint,
        ) for f in fields],
    )


@router.get("", response_model=list[ValidationRecordOut])
async def list_validations(db: AsyncSession = Depends(get_db), _user: User = Depends(require_admin)):
    records = (await db.execute(select(ValidationRecord))).scalars().all()
    return [await _to_out(db, r) for r in records]


@router.get("/{record_id}", response_model=ValidationRecordOut)
async def get_validation(
    record_id: str, db: AsyncSession = Depends(get_db), _user: User = Depends(require_admin),
):
    record = (await db.execute(select(ValidationRecord).where(ValidationRecord.id == record_id))).scalar_one_or_none()
    if record is None:
        raise HTTPException(status_code=404, detail="Validation record not found")
    return await _to_out(db, record)


@router.put("/{record_id}/fields/{field_id}", response_model=ValidationRecordOut)
async def save_field(
    record_id: str, field_id: str, payload: ExtractedFieldIn,
    db: AsyncSession = Depends(get_db), _user: User = Depends(require_admin),
):
    record = (await db.execute(select(ValidationRecord).where(ValidationRecord.id == record_id))).scalar_one_or_none()
    if record is None:
        raise HTTPException(status_code=404, detail="Validation record not found")

    field = (
        await db.execute(
            select(ExtractedField).where(ExtractedField.id == field_id, ExtractedField.record_id == record_id),
        )
    ).scalar_one_or_none()
    if field is None:
        raise HTTPException(status_code=404, detail="Field not found")

    field.label = payload.label
    field.extracted_value = payload.extracted_value
    field.corrected_value = payload.corrected_value
    field.confidence = payload.confidence
    field.page_ref = payload.page_ref
    field.bounding_box_hint = payload.bounding_box_hint
    field.status = "validated"  # server always forces validated, regardless of payload

    value = field.corrected_value or field.extracted_value
    if value:
        field.embedding = embed(f"{field.label}: {value}")

    await db.commit()
    return await _to_out(db, record)


@router.post("/{record_id}/approve", response_model=ValidationRecordOut)
async def approve_record(
    record_id: str, db: AsyncSession = Depends(get_db), _user: User = Depends(require_admin),
):
    record = (await db.execute(select(ValidationRecord).where(ValidationRecord.id == record_id))).scalar_one_or_none()
    if record is None:
        raise HTTPException(status_code=404, detail="Validation record not found")

    fields = (
        await db.execute(select(ExtractedField).where(ExtractedField.record_id == record_id))
    ).scalars().all()
    for f in fields:
        f.status = "validated"

    doc = (await db.execute(select(Document).where(Document.id == record.document_id))).scalar_one()
    doc.status = "validated"
    await db.commit()

    await publish_document_to_graph(doc, fields)

    return await _to_out(db, record)
