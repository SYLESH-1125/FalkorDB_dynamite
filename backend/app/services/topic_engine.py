import re
from collections import Counter

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.models import ExtractedField
from app.services.llm import LlmNotConfigured, call_openrouter

TOPIC_SYSTEM_PROMPT = (
    "You are BHUMI's Topic and Word Intelligence assistant for CMPDI / CIL Domain Officers. "
    "Answer freely using your own knowledge — you are not restricted to any indexed document set. "
    "Analyse trends, identify which words or events are most important or prioritised, and offer "
    "forward-looking predictions where relevant. "
    "\n\n"
    "Clearly distinguish your own analysis, prioritisation and predictions from established fact "
    "by labelling interpretive statements as 'Analysis:' or 'Outlook:'. Since answers are not "
    "sourced from a verified document corpus, do not fabricate specific document names or page "
    "citations — if you reference a real-world source, name it in plain text only. "
    "\n\n"
    "When a trend, comparison or ranking would be clearer as a chart, emit exactly one fenced "
    "code block with the language tag 'chart' containing a single JSON object, in addition to "
    "your prose answer. The JSON must have the shape: "
    '{"type": "line"|"bar"|"area"|"donut", "title": string, "data": [{"period_or_name": string, '
    '<seriesKey>: number, ...}], "series": [{"key": string, "label": string}]}. '
    "For 'donut' charts use {\"name\": string, \"value\": number} data points and omit 'series'. "
    "Only emit a chart when you have real, defensible numbers to plot — never invent a numeric "
    "series purely to fill a chart."
)

STOPWORDS = {
    "the", "and", "for", "with", "from", "this", "that", "have", "has", "was", "were",
    "are", "not", "but", "all", "any", "can", "will", "such", "per", "what", "does",
}


async def _top_terms(db: AsyncSession, limit: int = 12) -> list[tuple[str, int]]:
    fields = (await db.execute(select(ExtractedField))).scalars().all()
    counter: Counter[str] = Counter()
    for f in fields:
        value = f.corrected_value or f.extracted_value
        if not value:
            continue
        for w in re.findall(r"[A-Za-z]{4,}", value.lower()):
            if w not in STOPWORDS:
                counter[w] += 1
    return counter.most_common(limit)


async def _corpus_topic_fallback(db: AsyncSession, question: str) -> str:
    terms = await _top_terms(db)
    if not terms:
        return (
            "**Corpus-backed summary (no LLM configured)**\n\n"
            "OpenRouter is not set up on this deployment, so this answer uses indexed extraction "
            "terms only. Upload and validate documents to populate the word cloud, or add "
            "`OPENROUTER_API_KEY` on Render for full trend analysis.\n\n"
            f"Your question: _{question.strip()}_"
        )
    ranked = ", ".join(f"**{w}** ({c})" for w, c in terms[:8])
    return (
        "**Corpus-backed topic view (LLM unavailable)**\n\n"
        "The cloud LLM is not configured or the API key was rejected (401). "
        "This reply is built from **validated extraction fields** in Postgres — not a generative forecast.\n\n"
        f"**Dominant terms in the indexed corpus:** {ranked}.\n\n"
        "**Analysis:** Terms with higher counts appear across more validation records — "
        "prioritise review queues for those labels first.\n\n"
        "**Outlook:** Configure a valid `OPENROUTER_API_KEY` on the API service for FY trend "
        "narratives and chart blocks. Until then, use **Company Brain** (`/brain`) for "
        "graph-grounded answers and **AI Query** for document RAG.\n\n"
        f"_Question: {question.strip()}_"
    )


_FALLBACK_CITATION = [{
    "document_name": "Indexed corpus (extraction fields)",
    "page": 0,
    "snippet": "Answer generated from term frequencies in validated extractions — not from OpenRouter.",
    "relevance": 0.5,
}]


async def answer_topic_question(db: AsyncSession, question: str) -> tuple[str, list[dict]]:
    try:
        body = await call_openrouter(TOPIC_SYSTEM_PROMPT, question)
        return (
            body,
            [{
                "document_name": "AI-generated analysis — not verified against a document",
                "page": 0,
                "snippet": "This answer is generated from the model's own knowledge and reasoning. "
                "It is not sourced from the indexed document corpus and has not been independently verified.",
                "relevance": 0.0,
            }],
        )
    except LlmNotConfigured:
        return await _corpus_topic_fallback(db, question), _FALLBACK_CITATION
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code in (401, 403, 402):
            return await _corpus_topic_fallback(db, question), _FALLBACK_CITATION
        return (f"The language model call failed: {exc}", [])
    except Exception as exc:
        return await _corpus_topic_fallback(db, question), _FALLBACK_CITATION
