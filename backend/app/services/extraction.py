import re

FIELD_LABELS = [
    "Report Period", "Subsidiary", "Mine Name", "Coal Grade", "Production (MT)",
    "Overburden Removed (Mm³)", "Stripping Ratio", "Manpower Deployed", "Despatch (MT)",
    "Stock at Pithead (MT)", "Capital Expenditure (₹ Cr)", "Environmental Clearance No.",
]

# normalized label -> canonical label, for matching table header/first-column cells
_NORMALIZED = {re.sub(r"[^a-z0-9]", "", label.lower()): label for label in FIELD_LABELS}

TEXT_PATTERNS: dict[str, re.Pattern] = {
    "Report Period": re.compile(r"report period[:\s]+([A-Za-z0-9 \-/]+)", re.I),
    "Subsidiary": re.compile(r"\bsubsidiary[:\s]+([A-Za-z]{2,10})\b", re.I),
    "Mine Name": re.compile(r"mine name[:\s]+([A-Za-z0-9 \-]+)", re.I),
    "Coal Grade": re.compile(r"coal grade[:\s]+([A-Za-z0-9\- ]+)", re.I),
    "Production (MT)": re.compile(r"production[^0-9]*([\d,.]+)\s*MT", re.I),
    "Overburden Removed (Mm³)": re.compile(r"overburden[^0-9]*([\d,.]+)\s*Mm", re.I),
    "Stripping Ratio": re.compile(r"stripping ratio[:\s]+([\d.]+)", re.I),
    "Manpower Deployed": re.compile(r"manpower[^0-9]*([\d,]+)", re.I),
    "Despatch (MT)": re.compile(r"despatch[^0-9]*([\d,.]+)\s*MT", re.I),
    "Stock at Pithead (MT)": re.compile(r"stock at pithead[^0-9]*([\d,.]+)\s*MT", re.I),
    "Capital Expenditure (₹ Cr)": re.compile(r"capital expenditure[^0-9]*([\d,.]+)", re.I),
    "Environmental Clearance No.": re.compile(r"environmental clearance no\.?[:\s]+([A-Za-z0-9\-/]+)", re.I),
}


def _match_from_tables(tables: list[dict]) -> dict[str, tuple[str, int]]:
    """Matches label/value pairs from parsed table rows (2-column key/value layout,
    the dominant shape for spreadsheet exports and most extracted PDF tables)."""
    found: dict[str, tuple[str, int]] = {}
    for table in tables:
        page = table.get("page", 1)
        for row in table.get("rows", []):
            cells = [str(c).strip() for c in row if c is not None and str(c).strip()]
            if len(cells) < 2:
                continue
            key_norm = re.sub(r"[^a-z0-9]", "", cells[0].lower())
            canonical = _NORMALIZED.get(key_norm)
            if canonical and canonical not in found:
                found[canonical] = (cells[1].strip(), page)
    return found


def extract_fields(text: str, tables: list[dict]) -> list[dict]:
    table_matches = _match_from_tables(tables)

    results = []
    for order, label in enumerate(FIELD_LABELS):
        if label in table_matches:
            value, page = table_matches[label]
            results.append({
                "label": label, "extracted_value": value, "confidence": 92.0,
                "status": "validated", "page_ref": page,
                "bounding_box_hint": f"p.{page} · table", "field_order": order,
            })
            continue

        pattern = TEXT_PATTERNS[label]
        match = pattern.search(text)
        if match:
            value = match.group(1).strip().rstrip(".,;")
            results.append({
                "label": label, "extracted_value": value, "confidence": 78.0,
                "status": "pending", "page_ref": 1,
                "bounding_box_hint": "p.1", "field_order": order,
            })
        else:
            results.append({
                "label": label, "extracted_value": "", "confidence": 0.0,
                "status": "error", "page_ref": 1, "bounding_box_hint": "", "field_order": order,
            })

    return results
