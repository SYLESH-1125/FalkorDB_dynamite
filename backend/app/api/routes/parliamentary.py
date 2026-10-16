from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.domain.models import ParliamentaryQueryOut
from app.infrastructure.db.models import ParliamentaryQueryRow, User

router = APIRouter(prefix="/api/parliamentary", tags=["parliamentary"])

STAGE_ORDER = ["received", "assigned", "drafting", "review", "answered"]


async def _out(db: AsyncSession, q: ParliamentaryQueryRow) -> ParliamentaryQueryOut:
    assignee_name = "Unassigned"
    if q.assigned_to_user_id:
        assignee = (await db.execute(select(User).where(User.id == q.assigned_to_user_id))).scalar_one_or_none()
        if assignee:
            assignee_name = assignee.name

    return ParliamentaryQueryOut(
        id=q.id, reference_no=q.reference_no, subject=q.subject, house=q.house,
        member_name=q.member_name, priority=q.priority, stage=q.stage,
        received_at=q.received_at, due_at=q.due_at, assigned_to=assignee_name,
        subsidiary=q.subsidiary_code, linked_report_ids=q.linked_report_ids,
    )


@router.get("", response_model=list[ParliamentaryQueryOut])
async def list_queries(db: AsyncSession = Depends(get_db), _user: User = Depends(get_current_user)):
    queries = (
        await db.execute(select(ParliamentaryQueryRow).order_by(ParliamentaryQueryRow.due_at))
    ).scalars().all()
    return [await _out(db, q) for q in queries]


@router.post("/{query_id}/advance", response_model=ParliamentaryQueryOut)
async def advance_stage(
    query_id: str, db: AsyncSession = Depends(get_db), _user: User = Depends(get_current_user),
):
    q = (
        await db.execute(select(ParliamentaryQueryRow).where(ParliamentaryQueryRow.id == query_id))
    ).scalar_one_or_none()
    if q is None:
        raise HTTPException(status_code=404, detail="Query not found")

    idx = STAGE_ORDER.index(q.stage) if q.stage in STAGE_ORDER else 0
    q.stage = STAGE_ORDER[min(idx + 1, len(STAGE_ORDER) - 1)]
    await db.commit()
    return await _out(db, q)
