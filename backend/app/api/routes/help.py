from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.domain.models import FaqItemOut, HelpResourceOut
from app.infrastructure.db.models import FaqItem, HelpResource, User

router = APIRouter(prefix="/api/help", tags=["help"])


@router.get("/resources", response_model=list[HelpResourceOut])
async def list_resources(db: AsyncSession = Depends(get_db), _user: User = Depends(get_current_user)):
    resources = (await db.execute(select(HelpResource))).scalars().all()
    return [
        HelpResourceOut(
            id=r.id, title=r.title, description=r.description, kind=r.kind,
            category=r.category, duration=r.duration, updated_at=r.updated_at,
        )
        for r in resources
    ]


@router.get("/faqs", response_model=list[FaqItemOut])
async def list_faqs(db: AsyncSession = Depends(get_db), _user: User = Depends(get_current_user)):
    faqs = (await db.execute(select(FaqItem))).scalars().all()
    return [FaqItemOut(id=f.id, question=f.question, answer=f.answer, category=f.category) for f in faqs]
