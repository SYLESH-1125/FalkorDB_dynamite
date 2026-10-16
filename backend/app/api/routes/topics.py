import re
from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.domain.models import TopicClusterOut, TopicTermOut
from app.infrastructure.db.models import ExtractedField, User, ValidationRecord

router = APIRouter(prefix="/api/topics", tags=["topics"])

STOPWORDS = {
    "the", "and", "for", "with", "from", "this", "that", "have", "has", "was", "were",
    "are", "not", "but", "all", "any", "can", "will", "such", "per",
}


@router.get("/terms", response_model=list[TopicTermOut])
async def get_terms(db: AsyncSession = Depends(get_db), _user: User = Depends(get_current_user)):
    fields = (await db.execute(select(ExtractedField))).scalars().all()

    counter: Counter[str] = Counter()
    doc_sets: dict[str, set[str]] = {}
    for f in fields:
        value = f.corrected_value or f.extracted_value
        if not value:
            continue
        words = re.findall(r"[A-Za-z]{4,}", value.lower())
        for w in words:
            if w in STOPWORDS:
                continue
            counter[w] += 1
            doc_sets.setdefault(w, set()).add(f.record_id)

    if not counter:
        return []

    max_count = max(counter.values())
    terms = []
    for word, count in counter.most_common(30):
        terms.append(TopicTermOut(
            text=word, weight=round(count / max_count * 100, 1),
            document_count=len(doc_sets[word]), category="extracted",
        ))
    return terms


@router.get("/clusters", response_model=list[TopicClusterOut])
async def get_clusters(db: AsyncSession = Depends(get_db), _user: User = Depends(get_current_user)):
    fields = (await db.execute(select(ExtractedField))).scalars().all()
    by_label: dict[str, list[ExtractedField]] = {}
    for f in fields:
        if f.extracted_value:
            by_label.setdefault(f.label, []).append(f)

    clusters = []
    for label, items in by_label.items():
        avg_conf = sum(float(i.confidence) for i in items) / len(items)
        clusters.append(TopicClusterOut(
            id=label.lower().replace(" ", "-").replace("(", "").replace(")", ""),
            label=label, frequency=len(items),
            sentiment=round((avg_conf - 50) / 50, 2),
            terms=list({i.extracted_value for i in items if i.extracted_value})[:5],
        ))

    clusters.sort(key=lambda c: c.frequency, reverse=True)
    return clusters
