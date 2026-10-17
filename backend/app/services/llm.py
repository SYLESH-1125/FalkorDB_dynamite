import httpx

from app.config import settings

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

SYSTEM_PROMPT = (
    "You are BHUMI Assistant, a document-grounded analyst for the Ministry of Coal. "
    "Answer strictly using the evidence provided in the context below — every claim must be "
    "traceable to a specific document and page. If the context does not contain enough "
    "information to answer, say so plainly rather than guessing. Keep answers concise and "
    "cite the source document name and page for each fact, in the form (DocumentName, p.N)."
)

GENERAL_KNOWLEDGE_SYSTEM_PROMPT = (
    "You are BHUMI Assistant for the Ministry of Coal. No indexed document matched this "
    "question, so answer from your own general knowledge instead. Keep the answer concise "
    "and do not fabricate document names, page numbers, or citations — you have no source "
    "documents for this answer."
)


class LlmNotConfigured(Exception):
    pass


async def call_openrouter(system_prompt: str, user_prompt: str) -> str:
    if not settings.openrouter_api_key:
        raise LlmNotConfigured("OPENROUTER_API_KEY is not set")

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.openrouter_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.2,
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]


async def generate_answer(question: str, context_blocks: list[str]) -> str:
    context = "\n\n".join(context_blocks) if context_blocks else "No relevant evidence found."
    user_prompt = f"Evidence:\n{context}\n\nQuestion: {question}"
    return await call_openrouter(SYSTEM_PROMPT, user_prompt)


async def generate_general_knowledge_answer(question: str) -> str:
    return await call_openrouter(GENERAL_KNOWLEDGE_SYSTEM_PROMPT, question)
