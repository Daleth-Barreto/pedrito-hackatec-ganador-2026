from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.db import get_db
from app.core.errors import AppError
from app.core.rate_limit import attempts, limit_attempts  # noqa: F401
from app.core.security import COOKIE, DUMMY_HASH, get_user, issue_session, passwords
from app.models.entities import Session as LoginSession
from app.models.entities import User
from app.schemas.contracts import LoginIn, UserOut

router = APIRouter(prefix="/auth", tags=["Sesiones"])


@router.post("/login", response_model=UserOut)
def login(payload: LoginIn, request: Request, response: Response, db: Session = Depends(get_db)):
    limit_attempts(request.client.host if request.client else "unknown")
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    valid = passwords.verify(payload.password, user.password_hash if user else DUMMY_HASH)
    if not user or not valid:
        raise AppError(401, "invalid_credentials", "Correo o contraseña incorrectos.")
    token = issue_session(db, user)
    settings = get_settings()
    response.set_cookie(
        COOKIE,
        token,
        httponly=True,
        secure=settings.app_env == "production",
        samesite="strict",
        max_age=settings.session_minutes * 60,
        path="/api",
    )
    return user


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_user)):
    return user


@router.post("/logout", status_code=204)
def logout(
    request: Request,
    response: Response,
    user: User = Depends(get_user),
    db: Session = Depends(get_db),
):
    session = db.get(LoginSession, request.state.session_id)
    db.delete(session)
    db.commit()
    response.delete_cookie(COOKIE, path="/api")
