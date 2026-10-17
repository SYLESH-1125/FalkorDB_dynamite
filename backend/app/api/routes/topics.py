import re
from collections import Counter
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.domain.models import AskRequest, ChatMessageOut, ChatThreadOut, TopicClusterOut, TopicTermOut
from app.infrastructure.db.models import ChatMessage, ChatThread, Citation, ExtractedField, User
from app.services.chat_serializers import message_out, thread_out
from app.services.topic_engine import answer_topic_question

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


@router.get("/threads", response_model=list[ChatThreadOut])
async def list_topic_threads(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    threads = (
        await db.execute(
            select(ChatThread)
            .where(ChatThread.user_id == user.id, ChatThread.kind == "topic")
            .order_by(ChatThread.updated_at.desc()),
        )
    ).scalars().all()
    return [await thread_out(db, t) for t in threads]


@router.post("/threads", response_model=ChatThreadOut, status_code=201)
async def create_topic_thread(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    thread = ChatThread(user_id=user.id, title="New conversation", kind="topic", updated_at=datetime.now(timezone.utc))
    db.add(thread)
    await db.commit()
    await db.refresh(thread)
    return await thread_out(db, thread)


@router.post("/threads/{thread_id}/ask", response_model=ChatMessageOut)
async def ask_topic_question(
    thread_id: str, payload: AskRequest,
    db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user),
):
    thread = (
        await db.execute(
            select(ChatThread).where(
                ChatThread.id == thread_id, ChatThread.user_id == user.id, ChatThread.kind == "topic",
            ),
        )
    ).scalar_one_or_none()
    if thread is None:
        raise HTTPException(status_code=404, detail="Thread not found")

    db.add(ChatMessage(thread_id=thread.id, role="user", content=payload.question, created_at=datetime.now(timezone.utc)))

    body, citations = await answer_topic_question(db, payload.question)

    answer = ChatMessage(
        thread_id=thread.id, role="assistant", content=body, created_at=datetime.now(timezone.utc),
    )
    db.add(answer)
    await db.flush()

    citation_rows = [
        Citation(
            message_id=answer.id, document_name=c["document_name"], page=c["page"],
            snippet=c["snippet"], relevance=c["relevance"],
        )
        for c in citations
    ]
    db.add_all(citation_rows)

    thread.updated_at = datetime.now(timezone.utc)
    if thread.title == "New conversation":
        thread.title = payload.question[:60]

    await db.commit()

    return message_out(answer, citation_rows)
