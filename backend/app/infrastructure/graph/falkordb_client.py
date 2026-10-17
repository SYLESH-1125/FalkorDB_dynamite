import asyncio
import threading
from typing import Any

from app.config import settings

_client = None
_lock = threading.Lock()


class GraphUnavailable(RuntimeError):
    """FalkorDB is down. Company Brain answers cannot be produced without it."""


def _client_instance():
    global _client
    if _client is None:
        from falkordb import FalkorDB

        _client = FalkorDB(
            host=settings.falkordb_host,
            port=settings.falkordb_port,
            password=settings.falkordb_password or None,
        )
    return _client


def _cell(value: Any) -> Any:
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    if isinstance(value, list):
        return [_cell(item) for item in value]
    return value


_COLUMN_TYPES = {"scalar", "node", "relation", "relationship", "null"}


def _column_name(col: Any) -> str:
    if isinstance(col, (list, tuple)) and col:
        texts: list[str] = []
        for part in col:
            if isinstance(part, bytes):
                texts.append(part.decode("utf-8", errors="replace"))
            elif isinstance(part, str):
                texts.append(part)
        named = [text for text in texts if text.lower() not in _COLUMN_TYPES]
        if named:
            return named[-1]
        if texts:
            return texts[-1]
        return str(col[-1])
    if isinstance(col, bytes):
        return col.decode("utf-8", errors="replace")
    return str(col)


def _rows(result) -> list[dict[str, Any]]:
    header = [_column_name(col) for col in (getattr(result, "header", None) or [])]
    rows: list[dict[str, Any]] = []
    for raw in getattr(result, "result_set", None) or []:
        values = [_cell(item) for item in raw]
        if header and len(header) == len(values):
            rows.append(dict(zip(header, values)))
        else:
            rows.append({str(i): value for i, value in enumerate(values)})
    return rows


def run_sync(query: str, params: dict | None = None) -> list[dict[str, Any]]:
    try:
        with _lock:
            graph = _client_instance().select_graph(settings.falkordb_graph)
            result = graph.query(query, params or {})
        return _rows(result)
    except GraphUnavailable:
        raise
    except Exception as exc:
        message = str(exc).lower()
        if "connection" in message or "refused" in message or "timeout" in message:
            raise GraphUnavailable("FalkorDB is not reachable") from exc
        raise


async def run(query: str, params: dict | None = None) -> list[dict[str, Any]]:
    return await asyncio.to_thread(run_sync, query, params)


async def ping() -> bool:
    try:
        await run("RETURN 1 AS ok")
        return True
    except Exception:
        return False


def close_graph() -> None:
    global _client
    client = _client
    _client = None
    connection = getattr(client, "connection", None) if client else None
    if connection is not None and hasattr(connection, "close"):
        connection.close()
