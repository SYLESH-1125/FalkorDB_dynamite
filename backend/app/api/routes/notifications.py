from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.domain.models import AppNotificationOut
from app.infrastructure.db.models import AppNotification, User

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


def _out(n: AppNotification) -> AppNotificationOut:
    return AppNotificationOut(
        id=n.id, title=n.title, body=n.body, severity=n.severity,
        created_at=n.created_at, read=n.read, source=n.source, link=n.link,
    )


@router.get("", response_model=list[AppNotificationOut])
async def list_notifications(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    notifications = (
        await db.execute(
            select(AppNotification).where(AppNotification.user_id == user.id)
            .order_by(AppNotification.created_at.desc()),
        )
    ).scalars().all()
    return [_out(n) for n in notifications]


@router.put("/{notification_id}/read", response_model=list[AppNotificationOut])
async def mark_read(
    notification_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user),
):
    n = (
        await db.execute(
            select(AppNotification).where(
                AppNotification.id == notification_id, AppNotification.user_id == user.id,
            ),
        )
    ).scalar_one_or_none()
    if n is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.read = True
    await db.commit()

    all_n = (
        await db.execute(
            select(AppNotification).where(AppNotification.user_id == user.id)
            .order_by(AppNotification.created_at.desc()),
        )
    ).scalars().all()
    return [_out(n) for n in all_n]


@router.put("/read-all", response_model=list[AppNotificationOut])
async def mark_all_read(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    notifications = (
        await db.execute(select(AppNotification).where(AppNotification.user_id == user.id))
    ).scalars().all()
    for n in notifications:
        n.read = True
    await db.commit()
    return [_out(n) for n in notifications]
