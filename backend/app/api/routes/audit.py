from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_admin
from app.domain.models import AuditEntryOut
from app.infrastructure.db.models import AuditEntry, User

router = APIRouter(prefix="/api/audit", tags=["audit"])


@router.get("", response_model=list[AuditEntryOut])
async def list_audit(db: AsyncSession = Depends(get_db), _user: User = Depends(require_admin)):
    entries = (
        await db.execute(select(AuditEntry).order_by(AuditEntry.timestamp.desc()).limit(500))
    ).scalars().all()
    out = []
    for e in entries:
        actor_name, actor_role = "System", "System"
        if e.actor_user_id:
            actor = (await db.execute(select(User).where(User.id == e.actor_user_id))).scalar_one_or_none()
            if actor:
                actor_name, actor_role = actor.name, actor.role
        out.append(AuditEntryOut(
            id=e.id, timestamp=e.timestamp, actor=actor_name, actor_role=actor_role,
            action=e.action, resource=e.resource, resource_id=e.resource_id,
            ip_address=e.ip_address, outcome=e.outcome, details=e.details,
        ))
    return out
