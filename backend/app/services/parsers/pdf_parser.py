import io

import fitz  # PyMuPDF
import pdfplumber
import pytesseract
from PIL import Image


def parse_pdf(file_bytes: bytes) -> dict:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    page_count = doc.page_count

    native_text_parts: list[str] = []
    blocks_by_page: dict[int, list[dict]] = {}
    for i, page in enumerate(doc):
        text = page.get_text()
        native_text_parts.append(text)
        blocks_by_page[i + 1] = [
            {"bbox": b[:4], "text": b[4]} for b in page.get_text("blocks") if b[4].strip()
        ]

    native_text = "\n".join(native_text_parts).strip()
    used_ocr = False

    if len(native_text) < 40:
        used_ocr = True
        ocr_parts: list[str] = []
        for i, page in enumerate(doc):
            pix = page.get_pixmap(dpi=200)
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            ocr_text = pytesseract.image_to_string(img)
            ocr_parts.append(ocr_text)
            blocks_by_page[i + 1] = [{"bbox": None, "text": ocr_text}]
        native_text = "\n".join(ocr_parts).strip()

    tables: list[dict] = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            for table in page.extract_tables():
                tables.append({"page": page_num, "rows": table})

    doc.close()
    return {
        "page_count": page_count,
        "text": native_text,
        "blocks_by_page": blocks_by_page,
        "tables": tables,
        "used_ocr": used_ocr,
    }
