import ssl
from urllib.parse import urlsplit

import certifi

from app.config import settings


def _db_hostname(database_url: str) -> str:
    url = database_url
    for prefix in ("postgresql+asyncpg://", "postgresql://", "postgres://"):
        if url.startswith(prefix):
            url = "postgresql://" + url[len(prefix) :]
            break
    return (urlsplit(url).hostname or "").lower()


def _supabase_pooler_host(hostname: str) -> bool:
    return hostname.endswith(".pooler.supabase.com")


def asyncpg_connect_args() -> dict:
    args: dict = {}
    if settings.database_ssl:
        host = _db_hostname(settings.database_url)
        if settings.database_ssl_insecure or _supabase_pooler_host(host):
            ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            args["ssl"] = ctx
        else:
            args["ssl"] = ssl.create_default_context(cafile=certifi.where())
    if settings.database_pgbouncer:
        args["statement_cache_size"] = 0
    return args
