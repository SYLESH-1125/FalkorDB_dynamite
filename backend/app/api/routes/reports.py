from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.domain.models import (
    ReportOut, ReportSectionOut, ReportTemplateOut, ReportVersionOut, ReportWizardConfigIn,
)
from app.infrastructure.db.models import Report, ReportTemplate, ReportVersionRow, User

router = APIRouter(prefix="/api/reports", tags=["reports"])


def _template_out(t: ReportTemplate) -> ReportTemplateOut:
    return ReportTemplateOut(
        id=t.id, name=t.name, category=t.category, description=t.description,
        sections=[ReportSectionOut(**s) for s in t.sections],
        updated_at=t.updated_at, usage_count=t.usage_count, is_default=t.is_default,
    )


async def _report_out(db: AsyncSession, r: Report) -> ReportOut:
    template = (await db.execute(select(ReportTemplate).where(ReportTemplate.id == r.template_id))).scalar_one()
    creator = (await db.execute(select(User).where(User.id == r.created_by_user_id))).scalar_one()
    return ReportOut(
        id=r.id, title=r.title, template_id=r.template_id, template_name=template.name,
        status=r.status, version=r.version, subsidiary=r.subsidiary_code, created_by=creator.name,
        created_at=r.created_at, updated_at=r.updated_at, page_count=r.page_count, formats=r.formats,
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
