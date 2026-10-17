import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    analytics, audit, auth, brain, documents, graph, help, integrations, notifications, parliamentary,
    query, reports, topics, users, validations, voice,
)
from app.config import settings
from app.infrastructure.db.base import SessionLocal
from app.infrastructure.db.seed import seed
from app.infrastructure.graph.falkordb_client import close_graph, ping
from app.infrastructure.graph.publisher import seed_subsidiaries
from app.infrastructure.db.seed import SUBSIDIARIES
from app.infrastructure.storage.s3_client import ensure_bucket
from app.services.embeddings import embed

log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with SessionLocal() as db:
        await seed(db)
    try:
        await seed_subsidiaries(SUBSIDIARIES)
    except Exception:
        log.exception("Company Brain seed failed")

    try:
        ensure_bucket()
    except Exception:
        pass  # object store may not be reachable yet; uploads will surface the error later

    if settings.embeddings_enabled:
        asyncio.get_event_loop().run_in_executor(None, lambda: embed("warmup"))

    yield
    close_graph()


app = FastAPI(title="BHUMI API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(validations.router)
app.include_router(query.router)
app.include_router(reports.router)
app.include_router(topics.router)
app.include_router(parliamentary.router)
app.include_router(analytics.router)
app.include_router(users.router)
app.include_router(audit.router)
app.include_router(integrations.router)
app.include_router(notifications.router)
app.include_router(help.router)
app.include_router(graph.router)
app.include_router(brain.router)
app.include_router(voice.router)


@app.get("/health")
async def health():
    graph_up = await ping()
    return {"status": "ok" if graph_up else "degraded", "graph": "falkordb" if graph_up else "down"}
