import io

import pytesseract
from PIL import Image


def parse_image(file_bytes: bytes) -> dict:
    img = Image.open(io.BytesIO(file_bytes))
    text = pytesseract.image_to_string(img)

    return {
        "page_count": 1,
        "text": text,
        "tables": [],
        "used_ocr": True,
    }
