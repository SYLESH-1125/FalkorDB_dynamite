import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.config import settings
from app.domain.models import (
    CreateShareLinkIn, ReportDocumentOut, ReportDocumentSaveIn, ReportDraftRequestIn,
    ReportOut, ReportSectionOut, ReportTemplateOut, ReportVersionOut, ReportWizardConfigIn,
    SharedReportOut, ShareLinkOut,
)
from app.infrastructure.db.models import Report, ReportDocument, ReportTemplate, ReportVersionRow, User
from app.infrastructure.storage.s3_client import get_object_bytes
from app.services.report_ai import draft_report
from app.services.report_export import render_docx, render_pdf

router = APIRouter(prefix="/api/reports", tags=["reports"])

FRONTEND_URL = settings.cors_origin_list[0] if settings.cors_origin_list else "http://localhost:3000"


def _template_out(t: ReportTemplate) -> ReportTemplateOut:
    return ReportTemplateOut(
        id=t.id, name=t.name, category=t.category, description=t.description,
        sections=[ReportSectionOut(**s) for s in t.sections],
        updated_at=t.updated_at, usage_count=t.usage_count, is_default=t.is_default,
        file_key=t.file_key, file_size_bytes=t.file_size_bytes, has_file=t.file_key is not None,
    )


async def _report_out(db: AsyncSession, r: Report) -> ReportOut:
    template = (await db.execute(select(ReportTemplate).where(ReportTemplate.id == r.template_id))).scalar_one()
    creator = (await db.execute(select(User).where(User.id == r.created_by_user_id))).scalar_one()
    share_url = f"{FRONTEND_URL}/shared/reports/{r.share_token}" if r.share_token else None
    return ReportOut(
        id=r.id, title=r.title, template_id=r.template_id, template_name=template.name,
        status=r.status, version=r.version, subsidiary=r.subsidiary_code, created_by=creator.name,
        created_at=r.created_at, updated_at=r.updated_at, page_count=r.page_count, formats=r.formats,
        share_url=share_url, share_expires_at=r.share_expires_at,
    )


@router.get("", response_model=list[ReportOut])
async def list_reports(db: AsyncSession = Depends(get_db), _user: User = Depends(get_current_user)):
    reports = (await db.execute(select(Report).order_by(Report.created_at.desc()))).scalars().all()
    return [await _report_out(db, r) for r in reports]


@router.get("/templates", response_model=list[ReportTemplateOut])
async def list_templates(db: AsyncSession = Depends(get_db), _user: User = Depends(get_current_user)):
    templates = (await db.execute(select(ReportTemplate))).scalars().all()
    return [_template_out(t) for t in templates]


@router.put("/templates/{template_id}", response_model=ReportTemplateOut)
async def save_template(
    template_id: str, payload: ReportTemplateOut,
    db: AsyncSession = Depends(get_db), _user: User = Depends(get_current_user),
):
    template = (await db.execute(select(ReportTemplate).where(ReportTemplate.id == template_id))).scalar_one_or_none()
    if template is None:
        raise HTTPException(status_code=404, detail="Template not found")

    template.name = payload.name
    template.category = payload.category
    template.description = payload.description
    template.sections = [s.model_dump(by_alias=True) for s in payload.sections]
    template.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return _template_out(template)


@router.get("/templates/{template_id}/file")
async def download_template_file(
    template_id: str, db: AsyncSession = Depends(get_db), _user: User = Depends(get_current_user),
):
    template = (await db.execute(select(ReportTemplate).where(ReportTemplate.id == template_id))).scalar_one_or_none()
    if template is None or template.file_key is None:
        raise HTTPException(status_code=404, detail="No reference file uploaded for this template yet")
    data = get_object_bytes(template.file_key)
    return Response(
        content=data, media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{template.name}.pdf"'},
    )


@router.get("/{report_id}/versions", response_model=list[ReportVersionOut])
async def list_versions(
    report_id: str, db: AsyncSession = Depends(get_db), _user: User = Depends(get_current_user),
):
    versions = (
        await db.execute(
            select(ReportVersionRow).where(ReportVersionRow.report_id == report_id)
            .order_by(ReportVersionRow.version.desc()),
        )
    ).scalars().all()
    out = []
    for v in versions:
        changer = (await db.execute(select(User).where(User.id == v.changed_by_user_id))).scalar_one()
        out.append(ReportVersionOut(version=v.version, changed_by=changer.name, changed_at=v.changed_at, summary=v.summary))
    return out


@router.post("/generate", response_model=ReportOut, status_code=201)
async def generate_report(
    config: ReportWizardConfigIn, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user),
):
    template = (await db.execute(select(ReportTemplate).where(ReportTemplate.id == config.template_id))).scalar_one_or_none()
    if template is None:
        raise HTTPException(status_code=404, detail="Template not found")

    report = Report(
        title=config.title or "Untitled Report",
        template_id=config.template_id,
        status="published",
        version=1,
        subsidiary_code=config.subsidiary,
        created_by_user_id=user.id,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        page_count=12 + len(config.data_source_ids) * 3,
        formats=[config.format],
    )
    db.add(report)
    template.usage_count += 1
    await db.flush()

    db.add(ReportVersionRow(
        report_id=report.id, version=1, changed_by_user_id=user.id,
        changed_at=datetime.now(timezone.utc), summary="Initial generation from selected data sources",
    ))
    await db.commit()

    return await _report_out(db, report)


@router.post("/draft", response_model=ReportOut, status_code=201)
async def draft_new_report(
    payload: ReportDraftRequestIn, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user),
):
    """AI-drafts a full editable report from a natural-language prompt and returns the
    created report's metadata; the drafted Tiptap content is fetched separately via
    GET /reports/{id}/document once the client navigates to the editor."""
    template = (await db.execute(select(ReportTemplate).where(ReportTemplate.id == payload.template_id))).scalar_one_or_none()
    if template is None:
        raise HTTPException(status_code=404, detail="Template not found")

    report = Report(
        title=payload.prompt[:80] or template.name,
        template_id=payload.template_id,
        status="draft",
        version=1,
        subsidiary_code=payload.subsidiary,
        created_by_user_id=user.id,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        page_count=0,
        formats=[],
    )
    db.add(report)
    template.usage_count += 1
    await db.flush()

    tiptap_doc = await draft_report(
        db, payload.prompt, template, payload.data_source_ids,
        payload.subsidiary, payload.period, s3_bucket_prefix=f"reports/{report.id}",
    )

    title_node = next((n for n in tiptap_doc.get("content", []) if n.get("type") == "heading"), None)
    if title_node:
        text = "".join(c.get("text", "") for c in title_node.get("content", []) if c.get("type") == "text")
        if text:
            report.title = text[:120]

    db.add(ReportDocument(
        report_id=report.id, prompt=payload.prompt, content=tiptap_doc,
        updated_at=datetime.now(timezone.utc),
    ))
    db.add(ReportVersionRow(
        report_id=report.id, version=1, changed_by_user_id=user.id,
        changed_at=datetime.now(timezone.utc), summary="AI draft generated",
    ))
    await db.commit()

    return await _report_out(db, report)


@router.get("/{report_id}/document", response_model=ReportDocumentOut)
async def get_document(
    report_id: str, db: AsyncSession = Depends(get_db), _user: User = Depends(get_current_user),
):
    doc = (await db.execute(select(ReportDocument).where(ReportDocument.report_id == report_id))).scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=404, detail="This report has no editable document")
    return ReportDocumentOut(report_id=doc.report_id, prompt=doc.prompt, content=doc.content, updated_at=doc.updated_at)


@router.put("/{report_id}/document", response_model=ReportDocumentOut)
async def save_document(
    report_id: str, payload: ReportDocumentSaveIn,
    db: AsyncSession = Depends(get_db), _user: User = Depends(get_current_user),
):
    doc = (await db.execute(select(ReportDocument).where(ReportDocument.report_id == report_id))).scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=404, detail="This report has no editable document")

    doc.content = payload.content
    doc.updated_at = datetime.now(timezone.utc)

    report = (await db.execute(select(Report).where(Report.id == report_id))).scalar_one_or_none()
    if report is not None:
        report.updated_at = datetime.now(timezone.utc)
        if report.status == "draft":
            report.status = "published"

    await db.commit()
    return ReportDocumentOut(report_id=doc.report_id, prompt=doc.prompt, content=doc.content, updated_at=doc.updated_at)


@router.get("/{report_id}/export.{fmt}")
async def export_report(
    report_id: str, fmt: str, db: AsyncSession = Depends(get_db), _user: User = Depends(get_current_user),
):
    if fmt not in ("pdf", "docx"):
        raise HTTPException(status_code=400, detail="Supported formats: pdf, docx")

    report = (await db.execute(select(Report).where(Report.id == report_id))).scalar_one_or_none()
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    doc = (await db.execute(select(ReportDocument).where(ReportDocument.report_id == report_id))).scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=404, detail="This report has no editable document")

    if fmt == "pdf":
        data = render_pdf(report.title, doc.content)
        media_type = "application/pdf"
    else:
        data = render_docx(report.title, doc.content)
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    safe_title = "".join(c for c in report.title if c.isalnum() or c in " -_").strip() or "report"
    return Response(
        content=data, media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{safe_title}.{fmt}"'},
    )


@router.post("/{report_id}/share", response_model=ShareLinkOut)
async def create_share_link(
    report_id: str, payload: CreateShareLinkIn,
    db: AsyncSession = Depends(get_db), _user: User = Depends(get_current_user),
):
    report = (await db.execute(select(Report).where(Report.id == report_id))).scalar_one_or_none()
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")

    days = max(1, min(payload.expires_in_days, 90))
    report.share_token = secrets.token_urlsafe(24)
    report.share_expires_at = datetime.now(timezone.utc) + timedelta(days=days)
    await db.commit()

    return ShareLinkOut(
        share_url=f"{FRONTEND_URL}/shared/reports/{report.share_token}",
        expires_at=report.share_expires_at,
    )


@router.delete("/{report_id}/share", status_code=204)
async def revoke_share_link(
    report_id: str, db: AsyncSession = Depends(get_db), _user: User = Depends(get_current_user),
):
    report = (await db.execute(select(Report).where(Report.id == report_id))).scalar_one_or_none()
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    report.share_token = None
    report.share_expires_at = None
    await db.commit()


@router.get("/shared/{token}", response_model=SharedReportOut)
async def get_shared_report(token: str, db: AsyncSession = Depends(get_db)):
    """Public, unauthenticated endpoint — the token itself is the secret."""
    report = (await db.execute(select(Report).where(Report.share_token == token))).scalar_one_or_none()
    if report is None:
        raise HTTPException(status_code=404, detail="This link is invalid or has been revoked")
    if report.share_expires_at and report.share_expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="This share link has expired")

    doc = (await db.execute(select(ReportDocument).where(ReportDocument.report_id == report.id))).scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=404, detail="This report has no content to display")

    template = (await db.execute(select(ReportTemplate).where(ReportTemplate.id == report.template_id))).scalar_one()
    creator = (await db.execute(select(User).where(User.id == report.created_by_user_id))).scalar_one()

    return SharedReportOut(
        title=report.title, template_name=template.name, subsidiary=report.subsidiary_code,
        created_by=creator.name, updated_at=report.updated_at, content=doc.content,
    )


@router.get("/assets/{path:path}")
async def get_report_asset(path: str):
    """Public — chart images embedded in a report must load in the unauthenticated shared view."""
    try:
        data = get_object_bytes(path)
    except Exception:
        raise HTTPException(status_code=404, detail="Asset not found")
    return Response(content=data, media_type="image/png")
