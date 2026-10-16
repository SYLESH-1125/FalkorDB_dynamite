import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.models import (
    AppNotification, FaqItem, HelpResource, Integration, ParliamentaryQueryRow, ReportTemplate,
    Subsidiary, User,
)

SUBSIDIARIES = ["ECL", "BCCL", "CCL", "NCL", "WCL", "SECL", "MCL", "NEC"]

DEMO_USERS = [
    {
        "employee_id": "EMP001",
        "name": "Prieyan Mogger",
        "email": "p.menon@bhumi.gov.in",
        "role": "Administrator",
        "subsidiary_code": "ECL",
        "designation": "Chief Manager (Systems)",
    },
    {
        "employee_id": "EMP002",
        "name": "Anjali Deshmukh",
        "email": "a.deshmukh@bhumi.gov.in",
        "role": "Analyst",
        "subsidiary_code": "ECL",
        "designation": "Parliamentary Response Officer",
    },
    {
        "employee_id": "EMP003",
        "name": "S. Venkatraman",
        "email": "s.venkatraman@bhumi.gov.in",
        "role": "Analyst",
        "subsidiary_code": "CCL",
        "designation": "Deputy Secretary (Policy & Monitoring)",
    },
    {
        "employee_id": "EMP004",
        "name": "Deepak Mahto",
        "email": "d.mahto@bhumi.gov.in",
        "role": "Analyst",
        "subsidiary_code": "MCL",
        "designation": "Domain Officer, CMPDI",
    },
]

REPORT_TEMPLATES = [
    {
        "name": "Statutory Compliance Report",
        "category": "Statutory",
        "description": "Standard statutory compliance summary across subsidiaries.",
        "sections": [
            {"id": "sec-1", "title": "Executive Summary", "enabled": True, "description": "High-level overview"},
            {"id": "sec-2", "title": "Compliance Status", "enabled": True, "description": "Per-subsidiary compliance table"},
            {"id": "sec-3", "title": "Open Issues", "enabled": True, "description": "Outstanding compliance items"},
        ],
        "is_default": True,
    },
    {
        "name": "Parliamentary Response Brief",
        "category": "Parliamentary",
        "description": "Structured brief for tabled parliamentary questions.",
        "sections": [
            {"id": "sec-1", "title": "Question Summary", "enabled": True, "description": "Original question text"},
            {"id": "sec-2", "title": "Evidence & Citations", "enabled": True, "description": "Source-backed answer"},
            {"id": "sec-3", "title": "Annexures", "enabled": False, "description": "Supporting documents"},
        ],
        "is_default": False,
    },
    {
        "name": "Operational Performance Report",
        "category": "Operational",
        "description": "Production, despatch and stripping ratio performance.",
        "sections": [
            {"id": "sec-1", "title": "Production Summary", "enabled": True, "description": "MT produced vs. target"},
            {"id": "sec-2", "title": "Charts", "enabled": True, "description": "Trend charts"},
        ],
        "is_default": False,
    },
    {
        "name": "Environmental Clearance Status",
        "category": "Environmental",
        "description": "Environmental clearance and compliance condition tracking.",
        "sections": [
            {"id": "sec-1", "title": "Clearance Status", "enabled": True, "description": "Per-project clearance state"},
        ],
        "is_default": False,
    },
]

HELP_RESOURCES = [
    {
        "title": "Getting started with document upload",
        "description": "Walkthrough of the upload and ingestion flow.",
        "kind": "guide",
        "category": "Data Pipeline",
        "duration": "5 min read",
    },
    {
        "title": "How field validation works",
        "description": "Understanding confidence scores and manual correction.",
        "kind": "guide",
        "category": "Data Pipeline",
        "duration": "4 min read",
    },
    {
        "title": "Generating a parliamentary brief",
        "description": "Step-by-step video on drafting a defensible answer.",
        "kind": "video",
        "category": "Reporting",
        "duration": "8 min",
    },
]

FAQS = [
    {
        "question": "How is document confidence calculated?",
        "answer": "Confidence is the average extraction confidence across all fields identified in a document.",
        "category": "Data Pipeline",
    },
    {
        "question": "Who can approve validation records?",
        "answer": "Any authenticated user with write access can save fields; approval publishes the record.",
        "category": "Data Pipeline",
    },
    {
        "question": "Where is uploaded evidence stored?",
        "answer": "Raw files are stored in the object storage evidence vault, referenced by every extracted fact.",
        "category": "Platform",
    },
]

INTEGRATIONS = [
    {
        "name": "CIL DMS",
        "subsidiary_code": "ECL",
        "description": "Coal India Document Management System feed.",
        "endpoint": "https://dms.internal/api",
        "status": "disconnected",
    },
    {
        "name": "SWCS Geological Records",
        "subsidiary_code": "SECL",
        "description": "State Wing Coal Survey geological archive.",
        "endpoint": "https://swcs.internal/api",
        "status": "disconnected",
    },
]


async def seed(db: AsyncSession) -> None:
    existing = (await db.execute(select(Subsidiary.code))).scalars().all()
    if not existing:
        db.add_all(Subsidiary(code=code, name=code) for code in SUBSIDIARIES)
        await db.flush()

    existing_users = (await db.execute(select(User.employee_id))).scalars().all()
    if not existing_users:
        db.add_all(User(status="active", **u) for u in DEMO_USERS)
        await db.flush()

    existing_templates = (await db.execute(select(ReportTemplate.id))).scalars().all()
    if not existing_templates:
        db.add_all(ReportTemplate(usage_count=0, **t) for t in REPORT_TEMPLATES)

    existing_help = (await db.execute(select(HelpResource.id))).scalars().all()
    if not existing_help:
        db.add_all(HelpResource(**h) for h in HELP_RESOURCES)

    existing_faqs = (await db.execute(select(FaqItem.id))).scalars().all()
    if not existing_faqs:
        db.add_all(FaqItem(**f) for f in FAQS)

    existing_integrations = (await db.execute(select(Integration.id))).scalars().all()
    if not existing_integrations:
        db.add_all(Integration(records_synced=0, **i) for i in INTEGRATIONS)

    await db.commit()

    users = (await db.execute(select(User))).scalars().all()
    user_by_employee = {u.employee_id: u for u in users}

    existing_pq = (await db.execute(select(ParliamentaryQueryRow.id))).scalars().all()
    if not existing_pq and "EMP002" in user_by_employee:
        now = datetime.now(timezone.utc)
        db.add(ParliamentaryQueryRow(
            reference_no="LS/2026/4471",
            subject="Status of Jharia Master Plan rehabilitation",
            house="Lok Sabha",
            member_name="Shri R. Kumar",
            priority="critical",
            stage="assigned",
            received_at=now - timedelta(days=2),
            due_at=now + timedelta(days=5),
            assigned_to_user_id=user_by_employee["EMP002"].id,
            subsidiary_code="ECL",
            linked_report_ids=[],
        ))

    existing_notifications = (await db.execute(select(AppNotification.id))).scalars().all()
    if not existing_notifications:
        for u in users:
            db.add(AppNotification(
                user_id=u.id, title="Welcome to BHUMI",
                body="Your account is provisioned. Start by uploading documents on the Data Pipeline page.",
                severity="info", source="system", read=False,
            ))

    await db.commit()
