import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, ForeignKey, Numeric, SmallInteger, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector

from app.infrastructure.db.base import Base

EMBEDDING_DIM = 384


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Subsidiary(Base):
    __tablename__ = "subsidiaries"

    code: Mapped[str] = mapped_column(primary_key=True)
    name: Mapped[str]
    production_mt: Mapped[float] = mapped_column(Numeric(6, 1), default=0)
    target_mt: Mapped[float] = mapped_column(Numeric(6, 1), default=0)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(primary_key=True, default=_uuid)
    employee_id: Mapped[str] = mapped_column(unique=True)
    name: Mapped[str]
    email: Mapped[str]
    password_hash: Mapped[str]
    role: Mapped[str]
    subsidiary_code: Mapped[str] = mapped_column(ForeignKey("subsidiaries.code"))
    designation: Mapped[str]
    status: Mapped[str] = mapped_column(default="active")
    created_at: Mapped[datetime] = mapped_column(default=_now)


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(primary_key=True, default=_uuid)
    name: Mapped[str]
    kind: Mapped[str]
    size_bytes: Mapped[int]
    status: Mapped[str] = mapped_column(default="uploading")
    progress: Mapped[int] = mapped_column(default=0)
    subsidiary_code: Mapped[str] = mapped_column(ForeignKey("subsidiaries.code"))
    uploaded_by_user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    uploaded_at: Mapped[datetime] = mapped_column(default=_now)
    page_count: Mapped[int] = mapped_column(default=0)
    confidence: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    error_message: Mapped[str | None] = mapped_column(default=None)
    storage_bucket: Mapped[str]
    storage_key: Mapped[str]
    content_type: Mapped[str]

    uploaded_by: Mapped["User"] = relationship()
    subsidiary: Mapped["Subsidiary"] = relationship()
    job: Mapped["ProcessingJob | None"] = relationship(back_populates="document", uselist=False)
    validation_record: Mapped["ValidationRecord | None"] = relationship(
        back_populates="document", uselist=False,
    )


class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id: Mapped[str] = mapped_column(primary_key=True, default=_uuid)
    document_id: Mapped[str] = mapped_column(ForeignKey("documents.id"), unique=True)
    started_at: Mapped[datetime] = mapped_column(default=_now)
    ocr_engine: Mapped[str]
    language: Mapped[str]

    document: Mapped["Document"] = relationship(back_populates="job")
    stages: Mapped[list["PipelineStage"]] = relationship(
        back_populates="job", order_by="PipelineStage.stage_order", cascade="all, delete-orphan",
    )


class PipelineStage(Base):
    __tablename__ = "pipeline_stages"
    __table_args__ = (UniqueConstraint("job_id", "name"),)

    id: Mapped[str] = mapped_column(primary_key=True, default=_uuid)
    job_id: Mapped[str] = mapped_column(ForeignKey("processing_jobs.id"))
    name: Mapped[str]
    stage_order: Mapped[int] = mapped_column(SmallInteger)
    status: Mapped[str] = mapped_column(default="pending")
    progress: Mapped[int] = mapped_column(default=0)
    duration_ms: Mapped[int] = mapped_column(default=0)
    message: Mapped[str] = mapped_column(default="")

    job: Mapped["ProcessingJob"] = relationship(back_populates="stages")


class ValidationRecord(Base):
    __tablename__ = "validation_records"

    id: Mapped[str] = mapped_column(primary_key=True, default=_uuid)
    document_id: Mapped[str] = mapped_column(ForeignKey("documents.id"), unique=True)
    assigned_to_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), default=None)
    submitted_at: Mapped[datetime] = mapped_column(default=_now)

    document: Mapped["Document"] = relationship(back_populates="validation_record")
    assigned_to: Mapped["User | None"] = relationship()
    fields: Mapped[list["ExtractedField"]] = relationship(
        back_populates="record", order_by="ExtractedField.field_order", cascade="all, delete-orphan",
    )


class ExtractedField(Base):
    __tablename__ = "extracted_fields"

    id: Mapped[str] = mapped_column(primary_key=True, default=_uuid)
    record_id: Mapped[str] = mapped_column(ForeignKey("validation_records.id"))
    label: Mapped[str]
    extracted_value: Mapped[str]
    corrected_value: Mapped[str | None] = mapped_column(default=None)
    confidence: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    status: Mapped[str] = mapped_column(default="pending")
    page_ref: Mapped[int] = mapped_column(default=1)
    bounding_box_hint: Mapped[str] = mapped_column(default="")
    field_order: Mapped[int] = mapped_column(SmallInteger, default=0)
    embedding: Mapped[list[float] | None] = mapped_column(Vector(EMBEDDING_DIM), default=None)

    record: Mapped["ValidationRecord"] = relationship(back_populates="fields")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id: Mapped[str] = mapped_column(primary_key=True, default=_uuid)
    document_id: Mapped[str] = mapped_column(ForeignKey("documents.id"))
    chunk_index: Mapped[int] = mapped_column(SmallInteger)
    page_ref: Mapped[int] = mapped_column(default=1)
    text: Mapped[str]
    embedding: Mapped[list[float] | None] = mapped_column(Vector(EMBEDDING_DIM), default=None)
    created_at: Mapped[datetime] = mapped_column(default=_now)


class ChatThread(Base):
    __tablename__ = "chat_threads"

    id: Mapped[str] = mapped_column(primary_key=True, default=_uuid)
    title: Mapped[str] = mapped_column(default="New conversation")
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    updated_at: Mapped[datetime] = mapped_column(default=_now)

    messages: Mapped[list["ChatMessage"]] = relationship(
        back_populates="thread", order_by="ChatMessage.created_at", cascade="all, delete-orphan",
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(primary_key=True, default=_uuid)
    thread_id: Mapped[str] = mapped_column(ForeignKey("chat_threads.id"))
    role: Mapped[str]
    content: Mapped[str]
    created_at: Mapped[datetime] = mapped_column(default=_now)

    thread: Mapped["ChatThread"] = relationship(back_populates="messages")
    citations: Mapped[list["Citation"]] = relationship(back_populates="message", cascade="all, delete-orphan")


class Citation(Base):
    __tablename__ = "citations"

    id: Mapped[str] = mapped_column(primary_key=True, default=_uuid)
    message_id: Mapped[str] = mapped_column(ForeignKey("chat_messages.id"))
    document_name: Mapped[str]
    page: Mapped[int]
    snippet: Mapped[str]
    relevance: Mapped[float] = mapped_column(Numeric(4, 2))

    message: Mapped["ChatMessage"] = relationship(back_populates="citations")


class ReportTemplate(Base):
    __tablename__ = "report_templates"

    id: Mapped[str] = mapped_column(primary_key=True, default=_uuid)
    name: Mapped[str]
    category: Mapped[str]
    description: Mapped[str]
    sections: Mapped[list[dict]] = mapped_column(JSON, default=list)
    updated_at: Mapped[datetime] = mapped_column(default=_now)
    usage_count: Mapped[int] = mapped_column(default=0)
    is_default: Mapped[bool] = mapped_column(default=False)


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(primary_key=True, default=_uuid)
    title: Mapped[str]
    template_id: Mapped[str] = mapped_column(ForeignKey("report_templates.id"))
    status: Mapped[str] = mapped_column(default="draft")
    version: Mapped[int] = mapped_column(default=1)
    subsidiary_code: Mapped[str] = mapped_column(ForeignKey("subsidiaries.code"))
    created_by_user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(default=_now)
    updated_at: Mapped[datetime] = mapped_column(default=_now)
    page_count: Mapped[int] = mapped_column(default=0)
    formats: Mapped[list[str]] = mapped_column(JSON, default=list)

    versions: Mapped[list["ReportVersionRow"]] = relationship(
        back_populates="report", order_by="ReportVersionRow.version.desc()", cascade="all, delete-orphan",
    )


class ReportVersionRow(Base):
    __tablename__ = "report_versions"

    id: Mapped[str] = mapped_column(primary_key=True, default=_uuid)
    report_id: Mapped[str] = mapped_column(ForeignKey("reports.id"))
    version: Mapped[int]
    changed_by_user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    changed_at: Mapped[datetime] = mapped_column(default=_now)
    summary: Mapped[str]

    report: Mapped["Report"] = relationship(back_populates="versions")


class ParliamentaryQueryRow(Base):
    __tablename__ = "parliamentary_queries"

    id: Mapped[str] = mapped_column(primary_key=True, default=_uuid)
    reference_no: Mapped[str]
    subject: Mapped[str]
    house: Mapped[str]
    member_name: Mapped[str]
    priority: Mapped[str] = mapped_column(default="normal")
    stage: Mapped[str] = mapped_column(default="received")
    received_at: Mapped[datetime] = mapped_column(default=_now)
    due_at: Mapped[datetime]
    assigned_to_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), default=None)
    subsidiary_code: Mapped[str] = mapped_column(ForeignKey("subsidiaries.code"))
    linked_report_ids: Mapped[list[str]] = mapped_column(JSON, default=list)


class AuditEntry(Base):
    __tablename__ = "audit_entries"

    id: Mapped[str] = mapped_column(primary_key=True, default=_uuid)
    timestamp: Mapped[datetime] = mapped_column(default=_now)
    actor_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), default=None)
    action: Mapped[str]
    resource: Mapped[str]
    resource_id: Mapped[str]
    ip_address: Mapped[str] = mapped_column(default="")
    outcome: Mapped[str] = mapped_column(default="success")
    details: Mapped[str] = mapped_column(default="")


class Integration(Base):
    __tablename__ = "integrations"

    id: Mapped[str] = mapped_column(primary_key=True, default=_uuid)
    name: Mapped[str]
    subsidiary_code: Mapped[str] = mapped_column(ForeignKey("subsidiaries.code"))
    description: Mapped[str]
    status: Mapped[str] = mapped_column(default="disconnected")
    endpoint: Mapped[str]
    last_sync_at: Mapped[datetime] = mapped_column(default=_now)
    records_synced: Mapped[int] = mapped_column(default=0)
    sync_interval_minutes: Mapped[int] = mapped_column(default=60)


class AppNotification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str]
    body: Mapped[str]
    severity: Mapped[str] = mapped_column(default="info")
    created_at: Mapped[datetime] = mapped_column(default=_now)
    read: Mapped[bool] = mapped_column(default=False)
    source: Mapped[str] = mapped_column(default="system")
    link: Mapped[str | None] = mapped_column(default=None)


class HelpResource(Base):
    __tablename__ = "help_resources"

    id: Mapped[str] = mapped_column(primary_key=True, default=_uuid)
    title: Mapped[str]
    description: Mapped[str]
    kind: Mapped[str]
    category: Mapped[str]
    duration: Mapped[str] = mapped_column(default="")
    updated_at: Mapped[datetime] = mapped_column(default=_now)


class FaqItem(Base):
    __tablename__ = "faq_items"

    id: Mapped[str] = mapped_column(primary_key=True, default=_uuid)
    question: Mapped[str]
    answer: Mapped[str]
    category: Mapped[str]
