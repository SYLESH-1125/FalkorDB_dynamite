from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.infrastructure.db.models import Subsidiary, User
from app.infrastructure.security import hash_password

SUBSIDIARIES = ["ECL", "BCCL", "CCL", "NCL", "WCL", "SECL", "MCL", "NEC"]


async def seed(db: AsyncSession) -> None:
    existing = (await db.execute(select(Subsidiary.code))).scalars().all()
    if not existing:
        db.add_all(Subsidiary(code=code, name=code) for code in SUBSIDIARIES)
        await db.flush()

    await _bootstrap_admin(db)
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
        subsidiary_code=SUBSIDIARIES[0],
        designation="Administrator",
        status="active",
    ))
