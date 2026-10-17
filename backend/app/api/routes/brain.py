from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user
from app.domain.models import AskRequest, BrainAnswer, BrainBrief, BrainFactIn
from app.infrastructure.db.models import User
from app.infrastructure.graph.falkordb_client import GraphUnavailable
from app.services.brain_agent import answer, brief
from app.infrastructure.graph.company_brain import record_decision

router = APIRouter(prefix="/api/brain", tags=["brain"])


def _unavailable() -> HTTPException:
    return HTTPException(status_code=503, detail="FalkorDB is not reachable. Company Brain cannot answer without the graph.")


@router.get("/brief", response_model=BrainBrief)
async def company_brief(_user: User = Depends(get_current_user)):
    try:
        payload = await brief()
    except GraphUnavailable:
        raise _unavailable() from None
    return BrainBrief(**payload)


@router.post("/ask", response_model=BrainAnswer)
async def ask(payload: AskRequest, user: User = Depends(get_current_user)):
    try:
        result = await answer(payload.question, actor_id=user.id, actor_name=user.name)
    except GraphUnavailable:
        raise _unavailable() from None
    if result is None:
        result = {
            "answer": "Name a person, team, project, document, decision, mine, issue, or ticket that is already in the company graph.",
            "intent": "none",
            "tool": "none",
            "path": [],
            "sources": [],
            "cypher": "",
            "remembered": [],
        }
    return BrainAnswer(**result)


@router.post("/facts", status_code=201)
async def add_fact(payload: BrainFactIn, _user: User = Depends(get_current_user)):
    decision_id = f"dec-{uuid4().hex[:8]}"
    try:
        await record_decision(
            decision_id=decision_id,
            title=payload.title.strip(),
            summary=payload.summary.strip(),
            decided_on=datetime.now(timezone.utc).date().isoformat(),
            decided_by=payload.decided_by.strip(),
            based_on=payload.based_on.strip(),
            affects=payload.affects.strip(),
        )
    except GraphUnavailable:
        raise _unavailable() from None
    return {"id": decision_id, "title": payload.title.strip()}
