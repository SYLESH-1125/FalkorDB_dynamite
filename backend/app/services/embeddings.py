import asyncio
from functools import lru_cache

from app.config import settings


@lru_cache
def _get_model():
    from sentence_transformers import SentenceTransformer
    return SentenceTransformer(settings.embedding_model)


def embed(text: str) -> list[float]:
    return _get_model().encode(text, normalize_embeddings=True).tolist()


def embed_batch(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    return _get_model().encode(texts, normalize_embeddings=True).tolist()


async def embed_async(text: str) -> list[float]:
    """Runs the CPU-bound embedding call off the event loop thread."""
    return await asyncio.get_event_loop().run_in_executor(None, embed, text)


async def embed_batch_async(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    return await asyncio.get_event_loop().run_in_executor(None, embed_batch, texts)


def chunk_text(text: str, max_chars: int = 800, overlap: int = 100) -> list[str]:
    text = text.strip()
    if not text:
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + max_chars, len(text))
        chunks.append(text[start:end].strip())
        if end == len(text):
            break
        start = end - overlap
    return [c for c in chunks if c]
