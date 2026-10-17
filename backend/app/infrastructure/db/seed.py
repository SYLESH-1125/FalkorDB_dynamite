from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.infrastructure.db.models import ReportTemplate, Subsidiary, User
from app.infrastructure.security import hash_password

SUBSIDIARIES = ["ECL", "BCCL", "CCL", "NCL", "WCL", "SECL", "MCL", "NEC"]

# Placeholder Ministry of Coal report formats — drop the real reference PDFs into
# storage and set file_key once they're available; sections drive the AI draft's outline.
REPORT_TEMPLATES = [
    {
        "name": "Annual Report Format",
        "category": "Statutory",
        "description": "The Ministry's standard annual report structure — production, financials, welfare and environment chapters.",
        "sections": [
            {"id": "exec-summary", "title": "Executive Summary", "enabled": True, "description": "High-level overview of the reporting period"},
            {"id": "production", "title": "Production & Dispatch", "enabled": True, "description": "Coal production, offtake and dispatch figures"},
            {"id": "financial", "title": "Financial Performance", "enabled": True, "description": "Revenue, cost and profitability summary"},
            {"id": "safety", "title": "Safety & Welfare", "enabled": True, "description": "Accident statistics and worker welfare initiatives"},
            {"id": "environment", "title": "Environment & Sustainability", "enabled": True, "description": "Land reclamation, emissions and clearance status"},
        ],
    },
    {
        "name": "Parliamentary Question Response",
        "category": "Parliamentary",
        "description": "Structured reply format for questions tabled in the Lok Sabha or Rajya Sabha, with source-traced figures.",
        "sections": [
            {"id": "question", "title": "Question Text", "enabled": True, "description": "The tabled question as received"},
            {"id": "answer", "title": "Reply", "enabled": True, "description": "The drafted, defensible reply"},
            {"id": "data-table", "title": "Supporting Data", "enabled": True, "description": "Tabulated figures referenced in the reply"},
            {"id": "annexure", "title": "Annexure & Citations", "enabled": True, "description": "Source document and page references for every figure"},
        ],
    },
    {
        "name": "Environmental Clearance Status",
        "category": "Environmental",
        "description": "Tracks clearance stage, conditions and compliance for mining projects under environmental review.",
        "sections": [
            {"id": "project-overview", "title": "Project Overview", "enabled": True, "description": "Mine, subsidiary and clearance category"},
            {"id": "clearance-stage", "title": "Clearance Stage", "enabled": True, "description": "Current stage and pending conditions"},
            {"id": "compliance", "title": "Compliance Status", "enabled": True, "description": "Condition-wise compliance tracking"},
        ],
    },
    {
        "name": "Production & Dispatch Statement",
        "category": "Operational",
        "description": "Subsidiary-wise production, offtake and dispatch statement for a given reporting period.",
        "sections": [
            {"id": "summary", "title": "Period Summary", "enabled": True, "description": "Total production against target for the period"},
            {"id": "subsidiary-breakdown", "title": "Subsidiary-wise Breakdown", "enabled": True, "description": "Production and dispatch by subsidiary"},
            {"id": "trend", "title": "Trend Analysis", "enabled": True, "description": "Comparison against the prior period"},
        ],
    },
    {
        "name": "Financial Performance Summary",
        "category": "Financial",
        "description": "Quarterly or annual financial summary covering revenue, cost of production and margins.",
        "sections": [
            {"id": "overview", "title": "Financial Overview", "enabled": True, "description": "Revenue, EBITDA and net profit summary"},
            {"id": "cost-analysis", "title": "Cost Analysis", "enabled": True, "description": "Cost per tonne and major cost drivers"},
            {"id": "outlook", "title": "Outlook", "enabled": True, "description": "Forward-looking commentary"},
        ],
    },
]


def _demo_user_specs() -> list[dict]:
    return [
        {
            "employee_id": settings.demo_parliamentary_employee_id.strip(),
            "password": settings.demo_parliamentary_password,
            "name": "Parliamentary Response Demo",
            "role": "Analyst",
            "app_role": "parliamentary",
            "designation": "Parliamentary Response Officer",
        },
        {
            "employee_id": settings.demo_ministry_employee_id.strip(),
            "password": settings.demo_ministry_password,
            "name": "Ministry Policy Demo",
            "role": "Analyst",
            "app_role": "ministry",
            "designation": "Ministry Policy & Monitoring Officer",
        },
        {
            "employee_id": settings.demo_domain_officer_employee_id.strip(),
            "password": settings.demo_domain_officer_password,
            "name": "Domain Officer Demo",
            "role": "Reviewer",
            "app_role": "domain-officer",
            "designation": "CMPDI / CIL Domain Officer",
        },
        {
            "employee_id": settings.demo_admin_employee_id.strip(),
            "password": settings.demo_admin_password,
            "name": "Administrator Demo",
            "role": "Administrator",
            "app_role": "admin",
            "designation": "Platform Administrator",
        },
    ]


async def seed(db: AsyncSession) -> None:
    existing = (await db.execute(select(Subsidiary.code))).scalars().all()
    if not existing:
        db.add_all(Subsidiary(code=code, name=code) for code in SUBSIDIARIES)
        await db.flush()

    await _bootstrap_admin(db)
    await _seed_demo_users(db)
    await _seed_report_templates(db)
    await db.commit()


async def _bootstrap_admin(db: AsyncSession) -> None:
    employee_id = settings.bootstrap_admin_employee_id.strip()
    password = settings.bootstrap_admin_password
    if not employee_id or not password:
        return

    has_users = (await db.execute(select(User.id).limit(1))).scalar_one_or_none()
    if has_users is not None:
        return

    db.add(User(
        employee_id=employee_id,
        name=employee_id,
        email=f"{employee_id.lower()}@bhumi.gov.in",
        password_hash=hash_password(password),
        role="Administrator",
        app_role="admin",
        subsidiary_code=SUBSIDIARIES[0],
        designation="Administrator",
        status="active",
    ))


async def _seed_demo_users(db: AsyncSession) -> None:
    for demo in _demo_user_specs():
        if not demo["employee_id"] or not demo["password"]:
            continue

        existing = (
            await db.execute(select(User.id).where(User.employee_id == demo["employee_id"]))
        ).scalar_one_or_none()
        if existing is not None:
            continue

        db.add(User(
            employee_id=demo["employee_id"],
            name=demo["name"],
            email=f"{demo['employee_id'].lower().replace('/', '.')}@bhumi.gov.in",
            password_hash=hash_password(demo["password"]),
            role=demo["role"],
            app_role=demo["app_role"],
            subsidiary_code=SUBSIDIARIES[0],
            designation=demo["designation"],
            status="active",
        ))


async def _seed_report_templates(db: AsyncSession) -> None:
    existing = (await db.execute(select(ReportTemplate.id).limit(1))).scalar_one_or_none()
    if existing is not None:
        return

    for i, spec in enumerate(REPORT_TEMPLATES):
        db.add(ReportTemplate(
            name=spec["name"],
            category=spec["category"],
            description=spec["description"],
            sections=spec["sections"],
            is_default=i == 0,
        ))
