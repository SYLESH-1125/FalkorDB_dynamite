import re
from collections.abc import AsyncGenerator

from fastapi import Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.base import SessionLocal
from app.infrastructure.db.models import User

TOKEN_RE = re.compile(r"^mock-jwt-(?P<employee_id>.+)$")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session


async def get_current_user(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or malformed Authorization header")

    token = authorization.removeprefix("Bearer ").strip()
    match = TOKEN_RE.match(token)
    if not match:
        raise HTTPException(status_code=401, detail="Malformed token")

    employee_id = match.group("employee_id")
    result = await db.execute(select(User).where(User.employee_id == employee_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="Unknown employee ID")
    if user.status != "active":
        raise HTTPException(status_code=403, detail="Account is not active")

    return user


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "Administrator":
        raise HTTPException(status_code=403, detail="Administrator access required")
    return user
