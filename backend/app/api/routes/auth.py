from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.domain.models import CamelModel, SessionOut, UserOut
from app.infrastructure.db.models import User

router = APIRouter(prefix="/api/auth", tags=["auth"])

APP_ROLE_TO_USER_ROLE = {
    "admin": "Administrator",
    "parliamentary": "Analyst",
    "ministry": "Analyst",
    "domain-officer": "Analyst",
}


class SignInRequest(CamelModel):
    employee_id: str
    password: str
    app_role: str


def _user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id, name=user.name, email=user.email, role=user.role,
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

    if user is None:
        # first sign-in for this employee id creates a demo account for the chosen role
        role = APP_ROLE_TO_USER_ROLE.get(payload.app_role, "Analyst")
        user = User(
            employee_id=employee_id,
            name=employee_id,
            email=f"{employee_id.lower()}@bhumi.gov.in",
            role=role,
            subsidiary_code="ECL",
            designation="Employee",
            status="active",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    if user.status != "active":
        raise HTTPException(status_code=403, detail="Account is not active")

    return SessionOut(
        user=_user_out(user),
        token=f"mock-jwt-{employee_id}",
        issued_at=datetime.now(timezone.utc),
    )


@router.post("/sign-out", status_code=204)
async def sign_out(_user: User = Depends(get_current_user)):
    return None


@router.get("/session", response_model=SessionOut)
async def current_session(user: User = Depends(get_current_user)):
    return SessionOut(
        user=_user_out(user), token=f"mock-jwt-{user.employee_id}",
        issued_at=datetime.now(timezone.utc),
    )
