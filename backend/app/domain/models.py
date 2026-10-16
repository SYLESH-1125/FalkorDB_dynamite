from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


def to_camel(s: str) -> str:
    parts = s.split("_")
    return parts[0] + "".join(p.title() for p in parts[1:])


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class IngestedDocumentOut(CamelModel):
    id: str
    name: str
    kind: str
    size_bytes: int
    status: str
    progress: int
    subsidiary: str
    uploaded_by: str
    uploaded_at: datetime
    page_count: int
    confidence: float
    error_message: str | None = None


class PipelineStageOut(CamelModel):
    name: str
    status: str
    progress: int
    duration_ms: int
    message: str


class ProcessingJobOut(CamelModel):
    id: str
    document_id: str
    document_name: str
    stages: list[PipelineStageOut]
    started_at: datetime
    ocr_engine: str
    language: str


class ExtractedFieldOut(CamelModel):
    id: str
    label: str
    extracted_value: str
    corrected_value: str | None = None
    confidence: float
    status: str
    page_ref: int
    bounding_box_hint: str


class ExtractedFieldIn(CamelModel):
    id: str
    label: str
    extracted_value: str
    corrected_value: str | None = None
    confidence: float
    status: str
    page_ref: int
    bounding_box_hint: str


class ValidationRecordOut(CamelModel):
    id: str
    document_id: str
    document_name: str
    subsidiary: str
    assigned_to: str = Field(default="Unassigned")
    submitted_at: datetime
    fields: list[ExtractedFieldOut]


class UserOut(CamelModel):
    id: str
    name: str
    email: str
    role: str
    subsidiary: str
    designation: str
    status: str
    last_active: datetime
    created_at: datetime


class SessionOut(CamelModel):
    user: UserOut
    token: str
    issued_at: datetime


class CitationOut(CamelModel):
    id: str
    document_name: str
    page: int
    snippet: str
    relevance: float


class ChatMessageOut(CamelModel):
    id: str
    role: str
    content: str
    created_at: datetime
    citations: list[CitationOut]


class ChatThreadOut(CamelModel):
    id: str
    title: str
    updated_at: datetime
    messages: list[ChatMessageOut]


class AskRequest(CamelModel):
    question: str


class ReportSectionOut(CamelModel):
    id: str
    title: str
    enabled: bool
    description: str


class ReportTemplateOut(CamelModel):
    id: str
    name: str
    category: str
    description: str
    sections: list[ReportSectionOut]
    updated_at: datetime
    usage_count: int
    is_default: bool


class ReportOut(CamelModel):
    id: str
    title: str
    template_id: str
    template_name: str
    status: str
    version: int
    subsidiary: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    page_count: int
    formats: list[str]


class ReportVersionOut(CamelModel):
    version: int
    changed_by: str
    changed_at: datetime
    summary: str


class ReportWizardConfigIn(CamelModel):
    data_source_ids: list[str]
    template_id: str
    title: str
    period: str
    subsidiary: str
    include_charts: bool
    include_citations: bool
    format: str


class TopicTermOut(CamelModel):
    text: str
    weight: float
    document_count: int
    category: str


class TopicClusterOut(CamelModel):
    id: str
    label: str
    frequency: int
    sentiment: float
    terms: list[str]


class ParliamentaryQueryOut(CamelModel):
    id: str
    reference_no: str
    subject: str
    house: str
    member_name: str
    priority: str
    stage: str
    received_at: datetime
    due_at: datetime
    assigned_to: str
    subsidiary: str
    linked_report_ids: list[str]


class KpiMetricOut(CamelModel):
    id: str
    label: str
    value: str
    raw_value: float
    delta: float
    unit: str
    trend: str
    help_text: str


class TimeSeriesPointOut(CamelModel):
    period: str
    reports: int
    queries: int
    documents: int


class CategoryDatumOut(CamelModel):
    name: str
    value: int


class SubsidiaryPerformanceOut(CamelModel):
    subsidiary: str
    production: float
    target: float
    accuracy: float
    reports: int
    pending_queries: int
    variance: float


class ActivityEventOut(CamelModel):
    id: str
    actor: str
    action: str
    target: str
    created_at: datetime
    kind: str


class PipelineStageSummaryOut(CamelModel):
    stage: str
    count: int
    share: float


class IngestionHeatCellOut(CamelModel):
    day: str
    hour: int
    value: int


class AccuracyTrendPointOut(CamelModel):
    period: str
    accuracy: float
    human_corrections: int


class StorageBreakdownOut(CamelModel):
    kind: str
    documents: int
    size_gb: float


class QueryHighlightOut(CamelModel):
    id: str
    question: str
    asked_by: str
    asked_at: datetime
    citation_count: int
    response_ms: int


class DeadlineItemOut(CamelModel):
    id: str
    reference_no: str
    subject: str
    due_at: datetime
    priority: str
    assigned_to: str


class SystemHealthOut(CamelModel):
    ocr_queue_depth: int
    avg_latency_ms: int
    uptime_percent: float
    index_freshness_min: int
    active_users: int
    storage_used_gb: float
    storage_total_gb: float


class TopTermOut(CamelModel):
    text: str
    weight: float


class DashboardSnapshotOut(CamelModel):
    kpis: list[KpiMetricOut]
    time_series: list[TimeSeriesPointOut]
    categories: list[CategoryDatumOut]
    performance: list[SubsidiaryPerformanceOut]
    activity: list[ActivityEventOut]
    pipeline: list[PipelineStageSummaryOut]
    heatmap: list[IngestionHeatCellOut]
    accuracy_trend: list[AccuracyTrendPointOut]
    storage: list[StorageBreakdownOut]
    top_queries: list[QueryHighlightOut]
    deadlines: list[DeadlineItemOut]
    health: SystemHealthOut
    top_terms: list[TopTermOut]


class AuditEntryOut(CamelModel):
    id: str
    timestamp: datetime
    actor: str
    actor_role: str
    action: str
    resource: str
    resource_id: str
    ip_address: str
    outcome: str
    details: str


class IntegrationOut(CamelModel):
    id: str
    name: str
    subsidiary: str
    description: str
    status: str
    endpoint: str
    last_sync_at: datetime
    records_synced: int
    sync_interval_minutes: int


class AppNotificationOut(CamelModel):
    id: str
    title: str
    body: str
    severity: str
    created_at: datetime
    read: bool
    source: str
    link: str | None = None


class HelpResourceOut(CamelModel):
    id: str
    title: str
    description: str
    kind: str
    category: str
    duration: str
    updated_at: datetime


class FaqItemOut(CamelModel):
    id: str
    question: str
    answer: str
    category: str


class UpdateRoleIn(CamelModel):
    role: str


class UpdateStatusIn(CamelModel):
    status: str
