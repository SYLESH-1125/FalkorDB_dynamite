import json
import re
import uuid
from io import BytesIO

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.models import Document, ExtractedField, ReportTemplate, ValidationRecord
from app.infrastructure.storage.s3_client import put_object
from app.services.llm import LlmNotConfigured, call_openrouter

CHART_COLORS = ["#12304a", "#f2b705", "#278a57", "#5a7ca3", "#c62828"]

DRAFT_SYSTEM_PROMPT = """You are BHUMI's report-drafting assistant for the Ministry of Coal. \
Given a user's request, a report template outline, and evidence extracted from source \
documents, produce a structured report draft as JSON only — no markdown, no prose outside \
the JSON.

Return an object with this exact shape:
{
  "title": "string",
  "sections": [
    {
      "heading": "string",
      "paragraphs": ["string", ...],
      "table": {"headers": ["string", ...], "rows": [["string", ...], ...]} | null,
      "chart": {
        "type": "bar" | "line" | "pie",
        "title": "string",
        "labels": ["string", ...],
        "values": [number, ...]
      } | null
    }
  ]
}

Rules:
- Use only figures present in the evidence. Never invent numbers.
- Every section must have at least one paragraph.
- Only include a "table" when the evidence contains genuinely tabular data (e.g. per-subsidiary figures).
- Only include a "chart" when there are at least 2 comparable numeric data points suited to visualisation.
- Follow the template's section list and order as the outline, but you may merge or add a section if the evidence clearly calls for it.
- Cite the source document and page inline in paragraphs where a figure is used, in the form (DocumentName, p.N).
- If the evidence is thin for a section, say so plainly rather than fabricating detail.
"""


class ReportDraftResult:
    def __init__(self, tiptap_doc: dict):
        self.tiptap_doc = tiptap_doc


async def _load_evidence(db: AsyncSession, data_source_ids: list[str]) -> tuple[list[str], dict[str, str]]:
    """Returns (context_blocks, {document_id: document_name}) for the selected documents."""
    if not data_source_ids:
        return [], {}

    docs = (
        await db.execute(select(Document).where(Document.id.in_(data_source_ids)))
    ).scalars().all()
    doc_names = {d.id: d.name for d in docs}

    records = (
        await db.execute(select(ValidationRecord).where(ValidationRecord.document_id.in_(data_source_ids)))
    ).scalars().all()
    record_to_doc = {r.id: r.document_id for r in records}

    if not records:
        return [], doc_names

    fields = (
        await db.execute(
            select(ExtractedField).where(ExtractedField.record_id.in_(list(record_to_doc.keys()))),
        )
    ).scalars().all()

    blocks = []
    for f in fields:
        doc_id = record_to_doc.get(f.record_id)
        doc_name = doc_names.get(doc_id, "Unknown document")
        value = f.corrected_value or f.extracted_value
        if not value:
            continue
        blocks.append(f"[{doc_name}, p.{f.page_ref}]: {f.label}: {value}")

    return blocks, doc_names


def _extract_json(raw: str) -> dict:
    """The model may wrap JSON in a code fence despite instructions — strip it defensively."""
    stripped = raw.strip()
    fence_match = re.search(r"```(?:json)?\s*(\{.*\})\s*```", stripped, re.DOTALL)
    if fence_match:
        stripped = fence_match.group(1)
    return json.loads(stripped)


def _render_chart_png(chart: dict) -> bytes:
    labels = chart.get("labels") or []
    values = chart.get("values") or []
    chart_type = chart.get("type", "bar")
    title = chart.get("title", "")

    fig, ax = plt.subplots(figsize=(6.4, 3.6), dpi=150)
    colors = [CHART_COLORS[i % len(CHART_COLORS)] for i in range(len(labels))]

    if chart_type == "line":
        ax.plot(labels, values, color=CHART_COLORS[0], marker="o", linewidth=2)
        ax.grid(axis="y", color="#e2e5e8", linewidth=0.8)
        ax.spines[["top", "right"]].set_visible(False)
    elif chart_type == "pie":
        ax.pie(values, labels=labels, colors=colors, autopct="%1.0f%%", textprops={"fontsize": 9})
    else:
        ax.bar(labels, values, color=colors)
        ax.grid(axis="y", color="#e2e5e8", linewidth=0.8)
        ax.spines[["top", "right"]].set_visible(False)
        ax.set_axisbelow(True)

    ax.set_title(title, fontsize=11, color="#171717", pad=12)
    fig.tight_layout()

    buf = BytesIO()
    fig.savefig(buf, format="png", facecolor="white")
    plt.close(fig)
    return buf.getvalue()


def _text_node(text: str, marks: list[dict] | None = None) -> dict:
    node = {"type": "text", "text": text}
    if marks:
        node["marks"] = marks
    return node


def _paragraph_node(text: str) -> dict:
    return {"type": "paragraph", "content": [_text_node(text)]} if text else {"type": "paragraph"}


def _heading_node(text: str, level: int = 2) -> dict:
    return {"type": "heading", "attrs": {"level": level}, "content": [_text_node(text)]}


def _table_node(headers: list[str], rows: list[list[str]]) -> dict:
    def cell(text: str, is_header: bool) -> dict:
        return {
            "type": "tableHeader" if is_header else "tableCell",
            "content": [_paragraph_node(str(text))],
        }

    header_row = {"type": "tableRow", "content": [cell(h, True) for h in headers]}
    body_rows = [
        {"type": "tableRow", "content": [cell(v, False) for v in row]}
        for row in rows
    ]
    return {"type": "table", "content": [header_row, *body_rows]}


def _image_node(src: str, alt: str) -> dict:
    return {"type": "image", "attrs": {"src": src, "alt": alt}}


async def draft_report(
    db: AsyncSession,
    prompt: str,
    template: ReportTemplate,
    data_source_ids: list[str],
    subsidiary: str,
    period: str,
    s3_bucket_prefix: str,
) -> dict:
    """Builds a Tiptap-format document by calling OpenRouter to structure the content, then
    rendering any charts server-side and uploading them to storage as images."""
    context_blocks, _doc_names = await _load_evidence(db, data_source_ids)
    outline = [s["title"] for s in template.sections if s.get("enabled", True)]

    context_text = "\n".join(context_blocks) if context_blocks else "No extracted evidence available."
    user_prompt = (
        f"User request: {prompt}\n\n"
        f"Template: {template.name}\n"
        f"Suggested section outline: {', '.join(outline) if outline else '(none — infer from the request)'}\n"
        f"Subsidiary scope: {subsidiary}\n"
        f"Reporting period: {period or '(not specified)'}\n\n"
        f"Evidence extracted from selected source documents:\n{context_text}"
    )

    try:
        raw = await call_openrouter(DRAFT_SYSTEM_PROMPT, user_prompt)
        draft = _extract_json(raw)
    except (LlmNotConfigured, json.JSONDecodeError, Exception):
        draft = {
            "title": prompt[:80] or template.name,
            "sections": [
                {
                    "heading": s["title"],
                    "paragraphs": [
                        "This section could not be auto-drafted — the language model was "
                        "unavailable or returned an unexpected response. Edit this section "
                        "directly, or try regenerating from the Reports page.",
                    ],
                    "table": None,
                    "chart": None,
                }
                for s in template.sections if s.get("enabled", True)
            ] or [{
                "heading": "Draft",
                "paragraphs": ["This section could not be auto-drafted. Edit directly to add content."],
                "table": None,
                "chart": None,
            }],
        }

    content_nodes: list[dict] = [_heading_node(draft.get("title") or template.name, 1)]

    for section in draft.get("sections", []):
        heading = section.get("heading") or "Section"
        content_nodes.append(_heading_node(heading, 2))

        for para in section.get("paragraphs") or []:
            content_nodes.append(_paragraph_node(para))

        table = section.get("table")
        if table and table.get("headers") and table.get("rows"):
            content_nodes.append(_table_node(table["headers"], table["rows"]))

        chart = section.get("chart")
        if chart and chart.get("labels") and chart.get("values"):
            try:
                png_bytes = _render_chart_png(chart)
                key = f"{s3_bucket_prefix}/charts/{uuid.uuid4()}.png"
                put_object(key, png_bytes, "image/png")
                content_nodes.append(_image_node(f"/api/reports/assets/{key}", chart.get("title", heading)))
            except Exception:
                pass

    return {"type": "doc", "content": content_nodes}
