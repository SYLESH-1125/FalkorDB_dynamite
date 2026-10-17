from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.domain.models import AskRequest, ChatMessageOut, ChatThreadOut
from app.infrastructure.db.models import ChatMessage, ChatThread, Citation, User
from app.services.chat_serializers import message_out, thread_out
from app.services.query_engine import answer_question

router = APIRouter(prefix="/api/query", tags=["query"])


@router.get("/threads", response_model=list[ChatThreadOut])
async def list_threads(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    threads = (
        await db.execute(
            select(ChatThread)
            .where(ChatThread.user_id == user.id, ChatThread.kind == "query")
            .order_by(ChatThread.updated_at.desc()),
        )
    ).scalars().all()
    return [await thread_out(db, t) for t in threads]


@router.post("/threads", response_model=ChatThreadOut, status_code=201)
async def create_thread(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    thread = ChatThread(user_id=user.id, title="New conversation", kind="query", updated_at=datetime.now(timezone.utc))
    db.add(thread)
    await db.commit()
    await db.refresh(thread)
    return await thread_out(db, thread)


@router.post("/threads/{thread_id}/ask", response_model=ChatMessageOut)
async def ask(
    thread_id: str, payload: AskRequest,
    db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user),
):
    thread = (
        await db.execute(
            select(ChatThread).where(
                ChatThread.id == thread_id, ChatThread.user_id == user.id, ChatThread.kind == "query",
            ),
        )
    ).scalar_one_or_none()
    if thread is None:
        raise HTTPException(status_code=404, detail="Thread not found")

    db.add(ChatMessage(thread_id=thread.id, role="user", content=payload.question, created_at=datetime.now(timezone.utc)))

    body, citations = await answer_question(db, payload.question)

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
