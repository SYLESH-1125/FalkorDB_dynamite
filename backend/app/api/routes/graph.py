from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.domain.models import GraphEdgeOut, GraphNodeOut, KnowledgeGraphOut
from app.infrastructure.db.models import User
from app.infrastructure.graph.publisher import fetch_knowledge_graph

router = APIRouter(prefix="/api/graph", tags=["graph"])


@router.get("", response_model=KnowledgeGraphOut)
async def knowledge_graph(_user: User = Depends(get_current_user)):
    nodes, edges = await fetch_knowledge_graph()
    return KnowledgeGraphOut(
        nodes=[GraphNodeOut(**n) for n in nodes],
        edges=[GraphEdgeOut(**e) for e in edges],
    )
