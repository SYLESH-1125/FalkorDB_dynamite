from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.config import settings
from app.domain.models import CamelModel, SessionOut, UserOut
from app.infrastructure.db.models import Subsidiary, User
from app.infrastructure.security import create_access_token, hash_password, verify_password

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


class SignUpRequest(CamelModel):
    employee_id: str
    name: str
    email: str
    password: str
    app_role: str
    subsidiary: str = "ECL"
    designation: str = ""


APP_ROLE_PROFILE: dict[str, tuple[str, str]] = {
    "parliamentary": ("Analyst", "Parliamentary Response Officer"),
    "ministry": ("Analyst", "Ministry Policy & Monitoring Officer"),
    "domain-officer": ("Reviewer", "CMPDI / CIL Domain Officer"),
}


def _user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id, name=user.name, email=user.email, role=user.role, app_role=user.app_role,
        subsidiary=user.subsidiary_code, designation=user.designation, status=user.status,
        last_active=datetime.now(timezone.utc), created_at=user.created_at,
    )


@router.post("/sign-up", response_model=SessionOut, status_code=201)
async def sign_up(payload: SignUpRequest, db: AsyncSession = Depends(get_db)):
    if not settings.allow_public_signup:
        raise HTTPException(status_code=403, detail="Public sign-up is disabled on this deployment")

    employee_id = payload.employee_id.strip()
    name = payload.name.strip()
    email = payload.email.strip().lower()
    app_role = payload.app_role.strip()

    if not employee_id or not name or not email or len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Employee ID, name, email, and password (8+ chars) are required")
    if app_role == "admin":
        raise HTTPException(status_code=403, detail="Administrator accounts must be provisioned by an existing admin")
    if app_role not in APP_ROLE_PROFILE:
        raise HTTPException(status_code=400, detail="Invalid role for sign-up")

    subsidiary = payload.subsidiary.strip().upper() or "ECL"
    sub = (await db.execute(select(Subsidiary.code).where(Subsidiary.code == subsidiary))).scalar_one_or_none()
    if sub is None:
        raise HTTPException(status_code=400, detail="Unknown subsidiary code")

    existing = (
        await db.execute(select(User.id).where(User.employee_id == employee_id))
    ).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(status_code=409, detail="Employee ID already registered")

    user_role, default_designation = APP_ROLE_PROFILE[app_role]
    user = User(
        employee_id=employee_id,
        name=name,
        email=email,
        password_hash=hash_password(payload.password),
        role=user_role,
        app_role=app_role,
        subsidiary_code=subsidiary,
        designation=payload.designation.strip() or default_designation,
        status="active",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return SessionOut(
        user=_user_out(user),
        token=create_access_token(user.id),
        issued_at=datetime.now(timezone.utc),
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
