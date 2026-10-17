from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_admin
from app.domain.models import IntegrationOut
from app.infrastructure.db.models import Integration, User

router = APIRouter(prefix="/api/integrations", tags=["integrations"])


def _out(i: Integration) -> IntegrationOut:
    return IntegrationOut(
        id=i.id, name=i.name, subsidiary=i.subsidiary_code, description=i.description,
        status=i.status, endpoint=i.endpoint, last_sync_at=i.last_sync_at,
        records_synced=i.records_synced, sync_interval_minutes=i.sync_interval_minutes,
    )


@router.get("", response_model=list[IntegrationOut])
async def list_integrations(db: AsyncSession = Depends(get_db), _user: User = Depends(require_admin)):
    integrations = (await db.execute(select(Integration))).scalars().all()
    return [_out(i) for i in integrations]


@router.post("/{integration_id}/sync", response_model=IntegrationOut)
async def sync_integration(
    integration_id: str, db: AsyncSession = Depends(get_db), _user: User = Depends(require_admin),
):
    integration = (
        await db.execute(select(Integration).where(Integration.id == integration_id))
    ).scalar_one_or_none()
    if integration is None:
        raise HTTPException(status_code=404, detail="Integration not found")

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(integration.endpoint)
            response.raise_for_status()
            body = response.json()
    except (httpx.HTTPError, ValueError):
        integration.status = "error"
        await db.commit()
        raise HTTPException(status_code=502, detail="Could not reach integration endpoint")

    integration.status = "connected"
    integration.last_sync_at = datetime.now(timezone.utc)
    if isinstance(body, dict) and isinstance(body.get("recordCount"), int):
        integration.records_synced += body["recordCount"]
    await db.commit()
    return _out(integration)
