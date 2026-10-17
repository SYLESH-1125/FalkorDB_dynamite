from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models import ChatMessageOut, ChatThreadOut, CitationOut
from app.infrastructure.db.models import ChatMessage, ChatThread, Citation


def message_out(m: ChatMessage, citations: list[Citation]) -> ChatMessageOut:
    return ChatMessageOut(
        id=m.id, role=m.role, content=m.content, created_at=m.created_at,
        citations=[CitationOut(
            id=c.id, document_name=c.document_name, page=c.page,
            snippet=c.snippet, relevance=float(c.relevance),
        ) for c in citations],
    )


async def thread_out(db: AsyncSession, thread: ChatThread) -> ChatThreadOut:
    messages = (
        await db.execute(select(ChatMessage).where(ChatMessage.thread_id == thread.id).order_by(ChatMessage.created_at))
    ).scalars().all()
    out_messages = []
    for m in messages:
        citations = (await db.execute(select(Citation).where(Citation.message_id == m.id))).scalars().all()
        out_messages.append(message_out(m, citations))
    return ChatThreadOut(id=thread.id, title=thread.title, updated_at=thread.updated_at, messages=out_messages)
