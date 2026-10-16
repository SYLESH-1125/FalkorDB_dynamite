from functools import lru_cache

from neo4j import AsyncGraphDatabase

from app.config import settings


@lru_cache
def get_driver():
    return AsyncGraphDatabase.driver(
        settings.neo4j_uri, auth=(settings.neo4j_user, settings.neo4j_password),
    )


async def close_driver() -> None:
    driver = get_driver()
    await driver.close()
