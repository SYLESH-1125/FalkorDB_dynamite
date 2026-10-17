import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    analytics, audit, auth, documents, graph, help, integrations, notifications, parliamentary,
    query, reports, topics, users, validations, voice,
)
from app.config import settings
from app.infrastructure.db.base import SessionLocal
from app.infrastructure.db.seed import seed
from app.infrastructure.graph.neo4j_client import close_driver, get_driver
from app.infrastructure.graph.publisher import seed_subsidiaries
from app.infrastructure.db.seed import SUBSIDIARIES
from app.services.embeddings import embed


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with SessionLocal() as db:
        await seed(db)
    try:
        await seed_subsidiaries(SUBSIDIARIES)
    except Exception:
        pass  # Neo4j may not be reachable in a partial dev environment; API still boots

    # warm the embedding model in the background so the first real upload isn't slow
    asyncio.get_event_loop().run_in_executor(None, lambda: embed("warmup"))

    yield
    await close_driver()


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
app.include_router(voice.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
