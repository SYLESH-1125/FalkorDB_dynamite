import ssl

import certifi

from app.config import settings


def asyncpg_connect_args() -> dict:
    args: dict = {}
    if settings.database_ssl:
        ctx = ssl.create_default_context(cafile=certifi.where())
        args["ssl"] = ctx
    if settings.database_pgbouncer:
        args["statement_cache_size"] = 0
    return args
