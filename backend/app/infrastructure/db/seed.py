from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.infrastructure.db.models import Subsidiary, User
from app.infrastructure.security import hash_password

SUBSIDIARIES = ["ECL", "BCCL", "CCL", "NCL", "WCL", "SECL", "MCL", "NEC"]


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
