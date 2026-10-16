from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_admin
from app.domain.models import UpdateRoleIn, UpdateStatusIn, UserOut
from app.infrastructure.db.models import User

router = APIRouter(prefix="/api/users", tags=["users"])


def _out(u: User) -> UserOut:
    return UserOut(
        id=u.id, name=u.name, email=u.email, role=u.role, subsidiary=u.subsidiary_code,
        designation=u.designation, status=u.status, last_active=u.created_at, created_at=u.created_at,
    )


@router.get("", response_model=list[UserOut])
async def list_users(db: AsyncSession = Depends(get_db), _user: User = Depends(require_admin)):
    users = (await db.execute(select(User).order_by(User.name))).scalars().all()
    return [_out(u) for u in users]


@router.put("/{user_id}/role", response_model=UserOut)
async def update_role(
    user_id: str, payload: UpdateRoleIn,
    db: AsyncSession = Depends(get_db), _current: User = Depends(require_admin),
):
    target = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")
    target.role = payload.role
    await db.commit()
    return _out(target)


@router.put("/{user_id}/status", response_model=UserOut)
async def update_status(
    user_id: str, payload: UpdateStatusIn,
    db: AsyncSession = Depends(get_db), _current: User = Depends(require_admin),
):
    target = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")
    target.status = payload.status
    await db.commit()
    return _out(target)
