import io

import docx


def parse_docx(file_bytes: bytes) -> dict:
    document = docx.Document(io.BytesIO(file_bytes))

    paragraphs = [p.text for p in document.paragraphs if p.text.strip()]
    text = "\n".join(paragraphs)

    tables = []
    for i, table in enumerate(document.tables, start=1):
        rows = [[cell.text for cell in row.cells] for row in table.rows]
        tables.append({"page": i, "rows": rows})

    return {
        "page_count": 1,
        "text": text,
        "tables": tables,
        "used_ocr": False,
    }
