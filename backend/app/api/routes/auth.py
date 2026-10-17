from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.domain.models import CamelModel, SessionOut, UserOut
from app.infrastructure.db.models import User
from app.infrastructure.security import create_access_token, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])

ROLE_LABELS = {
    "parliamentary": "Parliamentary Response Team",
    "ministry": "Ministry Policy & Monitoring Officers",
    "domain-officer": "CMPDI / CIL Domain Officers",
    "admin": "Administrator",
}


class SignInRequest(CamelModel):
    employee_id: str
    password: str
    app_role: str


def _user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id, name=user.name, email=user.email, role=user.role, app_role=user.app_role,
        subsidiary=user.subsidiary_code, designation=user.designation, status=user.status,
        last_active=datetime.now(timezone.utc), created_at=user.created_at,
    )


@router.post("/sign-in", response_model=SessionOut)
async def sign_in(payload: SignInRequest, db: AsyncSession = Depends(get_db)):
    employee_id = payload.employee_id.strip()
    if not employee_id or not payload.password:
        raise HTTPException(status_code=400, detail="Employee ID and password are required")

    user = (
        await db.execute(select(User).where(User.employee_id == employee_id))
    ).scalar_one_or_none()

    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid employee ID or password")

    if user.status != "active":
        raise HTTPException(status_code=403, detail="Account is not active")

    if user.app_role != payload.app_role:
        actual_label = ROLE_LABELS.get(user.app_role, user.app_role)
        raise HTTPException(
            status_code=403,
            detail=f"This account is registered as '{actual_label}'. Sign in from that role instead.",
        )

    return SessionOut(
        user=_user_out(user),
        token=create_access_token(user.id),
        issued_at=datetime.now(timezone.utc),
    )


@router.post("/sign-out", status_code=204)
async def sign_out(_user: User = Depends(get_current_user)):
    return None


@router.get("/session", response_model=SessionOut)
async def current_session(user: User = Depends(get_current_user)):
    return SessionOut(
        user=_user_out(user), token=create_access_token(user.id),
        issued_at=datetime.now(timezone.utc),
    )
