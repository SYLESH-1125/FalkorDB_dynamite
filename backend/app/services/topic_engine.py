from sqlalchemy.ext.asyncio import AsyncSession

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


async def answer_topic_question(db: AsyncSession, question: str) -> tuple[str, list[dict]]:
    """Answers freely from the model's own knowledge — trend analysis, prioritisation and
    prediction, with no requirement to ground answers in the indexed document corpus."""
    try:
        body = await call_openrouter(TOPIC_SYSTEM_PROMPT, question)
    except LlmNotConfigured:
        return ("The language model is not configured (OPENROUTER_API_KEY is not set).", [])
    except Exception as exc:
        return (f"The language model call failed: {exc}", [])

    return (
        body,
        [{
            "document_name": "AI-generated analysis — not verified against a document",
            "page": 0,
            "snippet": "This answer is generated from the model's own knowledge and reasoning. It is not sourced from the indexed document corpus and has not been independently verified.",
            "relevance": 0.0,
        }],
    )
