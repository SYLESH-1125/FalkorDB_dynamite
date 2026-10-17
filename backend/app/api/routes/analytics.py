from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.domain.models import (
    AccuracyTrendPointOut, ActivityEventOut, CategoryDatumOut, DashboardSnapshotOut,
    DeadlineItemOut, IngestionHeatCellOut, KpiMetricOut, PipelineStageSummaryOut,
    QueryHighlightOut, StorageBreakdownOut, SubsidiaryPerformanceOut, SystemHealthOut,
    TimeSeriesPointOut, TopTermOut,
)
from app.infrastructure.db.models import (
    ChatMessage, ChatThread, Document, ExtractedField, ParliamentaryQueryRow, Report,
    Subsidiary, User, ValidationRecord,
)
from app.services.pipeline import STAGE_NAMES

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/kpis", response_model=list[KpiMetricOut])
async def kpis(db: AsyncSession = Depends(get_db), _user: User = Depends(get_current_user)):
    return await _kpis(db)


@router.get("/time-series", response_model=list[TimeSeriesPointOut])
async def time_series(db: AsyncSession = Depends(get_db), _user: User = Depends(get_current_user)):
    return await _time_series(db)


@router.get("/categories", response_model=list[CategoryDatumOut])
async def categories(db: AsyncSession = Depends(get_db), _user: User = Depends(get_current_user)):
    return await _categories(db)


@router.get("/performance", response_model=list[SubsidiaryPerformanceOut])
async def performance(db: AsyncSession = Depends(get_db), _user: User = Depends(get_current_user)):
    return await _performance(db)


@router.get("/activity", response_model=list[ActivityEventOut])
async def activity(db: AsyncSession = Depends(get_db), _user: User = Depends(get_current_user)):
    return await _activity(db)


@router.get("/dashboard", response_model=DashboardSnapshotOut)
async def dashboard(db: AsyncSession = Depends(get_db), _user: User = Depends(get_current_user)):
    documents = (await db.execute(select(Document))).scalars().all()
    total_docs = len(documents)

    pipeline_counts: dict[str, int] = defaultdict(int)
    for d in documents:
        pipeline_counts[d.status] += 1

    pipeline = [
        PipelineStageSummaryOut(
            stage=stage, count=total_docs,
            share=100.0 if total_docs else 0.0,
        )
        for stage in ["Ingested"]
    ] or []

    heatmap = [IngestionHeatCellOut(day=d.uploaded_at.strftime("%a"), hour=d.uploaded_at.hour, value=1) for d in documents]

    validated_docs = [d for d in documents if d.confidence]
    accuracy_trend = [
        AccuracyTrendPointOut(
            period=d.uploaded_at.strftime("%b"), accuracy=float(d.confidence), human_corrections=0,
        )
        for d in sorted(validated_docs, key=lambda x: x.uploaded_at)[-6:]
    ]

    storage_by_kind: dict[str, list[Document]] = defaultdict(list)
    for d in documents:
        storage_by_kind[d.kind].append(d)
    storage = [
        StorageBreakdownOut(
            kind=kind, documents=len(docs), size_gb=round(sum(d.size_bytes for d in docs) / 1e9, 3),
        )
        for kind, docs in storage_by_kind.items()
    ]

    threads = (await db.execute(select(ChatThread))).scalars().all()
    top_queries = []
    for t in threads[:4]:
        first_user_msg = (
            await db.execute(
                select(ChatMessage).where(ChatMessage.thread_id == t.id, ChatMessage.role == "user").limit(1),
            )
        ).scalar_one_or_none()
        if first_user_msg:
            top_queries.append(QueryHighlightOut(
                id=t.id, question=first_user_msg.content, asked_by="", asked_at=first_user_msg.created_at,
                citation_count=0, response_ms=0,
            ))

    pq_rows = (
        await db.execute(select(ParliamentaryQueryRow).order_by(ParliamentaryQueryRow.due_at).limit(5))
    ).scalars().all()
    deadlines = [
        DeadlineItemOut(
            id=q.id, reference_no=q.reference_no, subject=q.subject, due_at=q.due_at,
            priority=q.priority, assigned_to="",
        )
        for q in pq_rows
    ]

    fields = (await db.execute(select(ExtractedField))).scalars().all()
    term_counts: dict[str, int] = defaultdict(int)
    for f in fields:
        if f.extracted_value:
            term_counts[f.label] += 1
    top_terms = [
        TopTermOut(text=k, weight=min(100.0, v * 10))
        for k, v in sorted(term_counts.items(), key=lambda x: x[1], reverse=True)[:12]
    ]

    total_capacity_gb = 500.0
    used_gb = sum(d.size_bytes for d in documents) / 1e9
    health = SystemHealthOut(
        ocr_queue_depth=pipeline_counts.get("processing", 0) + pipeline_counts.get("queued", 0),
        avg_latency_ms=None,
        uptime_percent=None,
        index_freshness_min=None,
        active_users=(await db.execute(select(func.count(User.id)))).scalar() or 0,
        storage_used_gb=round(used_gb, 3),
        storage_total_gb=total_capacity_gb,
    )

    return DashboardSnapshotOut(
        kpis=await _kpis(db),
        time_series=await _time_series(db),
        categories=await _categories(db),
        performance=await _performance(db),
        activity=await _activity(db),
        pipeline=await _pipeline_funnel(db),
        heatmap=heatmap,
        accuracy_trend=accuracy_trend,
        storage=storage,
        top_queries=top_queries,
        deadlines=deadlines,
        health=health,
        top_terms=top_terms,
    )


async def _kpis(db: AsyncSession) -> list[KpiMetricOut]:
    total_docs = (await db.execute(select(func.count(Document.id)))).scalar() or 0
    total_reports = (await db.execute(select(func.count(Report.id)))).scalar() or 0
    avg_conf = (await db.execute(select(func.avg(Document.confidence)))).scalar() or 0
    pending_validation = (
        await db.execute(select(func.count(ExtractedField.id)).where(ExtractedField.status != "validated"))
    ).scalar() or 0

    return [
        KpiMetricOut(
            id="k1", label="Reports generated", value=str(total_reports), raw_value=total_reports,
            delta=0, unit="this quarter", trend="flat", helpText="Total reports generated to date",
        ),
        KpiMetricOut(
            id="k2", label="Processing backlog", value=str(pending_validation), raw_value=pending_validation,
            delta=0, unit="fields pending review", trend="flat", helpText="Extracted fields awaiting validation",
        ),
        KpiMetricOut(
            id="k3", label="Documents indexed", value=str(total_docs), raw_value=total_docs,
            delta=0, unit="total ingested", trend="flat", helpText="Documents ingested into the platform",
        ),
        KpiMetricOut(
            id="k4", label="Extraction accuracy", value=f"{float(avg_conf):.1f}%", raw_value=float(avg_conf),
            delta=0, unit="average confidence", trend="flat", helpText="Average confidence across extracted fields",
        ),
    ]


async def _time_series(db: AsyncSession) -> list[TimeSeriesPointOut]:
    documents = (await db.execute(select(Document))).scalars().all()
    reports = (await db.execute(select(Report))).scalars().all()
    threads = (await db.execute(select(ChatThread))).scalars().all()

    by_month: dict[str, dict[str, int]] = defaultdict(lambda: {"reports": 0, "queries": 0, "documents": 0})
    for d in documents:
        by_month[d.uploaded_at.strftime("%b")]["documents"] += 1
    for r in reports:
        by_month[r.created_at.strftime("%b")]["reports"] += 1
    for t in threads:
        by_month[t.updated_at.strftime("%b")]["queries"] += 1

    return [
        TimeSeriesPointOut(period=period, **counts)
        for period, counts in by_month.items()
    ]


async def _categories(db: AsyncSession) -> list[CategoryDatumOut]:
    templates_result = await db.execute(select(Report))
    reports = templates_result.scalars().all()
    counts: dict[str, int] = defaultdict(int)
    for r in reports:
        counts["Reports"] += 1
    documents = (await db.execute(select(Document))).scalars().all()
    kind_counts: dict[str, int] = defaultdict(int)
    for d in documents:
        kind_counts[d.kind] += 1
    return [CategoryDatumOut(name=k, value=v) for k, v in kind_counts.items()]


async def _performance(db: AsyncSession) -> list[SubsidiaryPerformanceOut]:
    subsidiaries = (await db.execute(select(Subsidiary))).scalars().all()
    out = []
    for s in subsidiaries:
        docs = (
            await db.execute(select(Document).where(Document.subsidiary_code == s.code))
        ).scalars().all()
        reports = (
            await db.execute(select(func.count(Report.id)).where(Report.subsidiary_code == s.code))
        ).scalar() or 0
        pending = (
            await db.execute(
                select(func.count(ParliamentaryQueryRow.id)).where(
                    ParliamentaryQueryRow.subsidiary_code == s.code,
                    ParliamentaryQueryRow.stage != "answered",
                ),
            )
        ).scalar() or 0
        avg_conf = sum(float(d.confidence) for d in docs) / len(docs) if docs else 0.0
        production = float(s.production_mt)
        target = float(s.target_mt)
        variance = round((production - target) / target * 100, 1) if target else 0.0
        out.append(SubsidiaryPerformanceOut(
            subsidiary=s.code, production=production, target=target,
            accuracy=round(avg_conf, 1), reports=reports, pending_queries=pending, variance=variance,
        ))
    return out


async def _activity(db: AsyncSession) -> list[ActivityEventOut]:
    documents = (
        await db.execute(select(Document).order_by(Document.uploaded_at.desc()).limit(10))
    ).scalars().all()
    out = []
    for d in documents:
        uploader = (await db.execute(select(User).where(User.id == d.uploaded_by_user_id))).scalar_one_or_none()
        out.append(ActivityEventOut(
            id=d.id, actor=uploader.name if uploader else "Unknown", action="uploaded",
            target=d.name, created_at=d.uploaded_at, kind="upload",
        ))
    return out


async def _pipeline_funnel(db: AsyncSession) -> list[PipelineStageSummaryOut]:
    documents = (await db.execute(select(Document))).scalars().all()
    total = len(documents)
    if total == 0:
        return [PipelineStageSummaryOut(stage=s, count=0, share=0.0) for s in STAGE_NAMES]

    status_progression = {
        "Ingestion": lambda d: d.status != "uploading",
        "OCR / Digitization": lambda d: d.status in ("processing", "extracted", "validated"),
        "Table Extraction": lambda d: d.status in ("processing", "extracted", "validated"),
        "Entity Recognition": lambda d: d.status in ("extracted", "validated"),
        "Indexing": lambda d: d.status in ("extracted", "validated"),
    }
    out = []
    for stage in STAGE_NAMES:
        count = sum(1 for d in documents if status_progression[stage](d))
        out.append(PipelineStageSummaryOut(stage=stage, count=count, share=round(count / total * 100, 1)))
    return out
