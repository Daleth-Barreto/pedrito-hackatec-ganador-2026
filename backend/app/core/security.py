from datetime import timedelta

import jwt
from argon2 import Type
from fastapi import Depends, Request
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher
from sqlalchemy.orm import Session as DbSession

from app.core.config import get_settings
from app.core.db import get_db
from app.core.errors import AppError
from app.models.entities import Session, User, utcnow

passwords = PasswordHash((Argon2Hasher(type=Type.ID),))
DUMMY_HASH = passwords.hash("not-a-real-password")
COOKIE = "seguimiento_session"


def issue_session(db: DbSession, user: User) -> str:
    settings = get_settings()
    expires = utcnow() + timedelta(minutes=settings.session_minutes)
    session = Session(user_id=user.id, expires_at=expires)
    db.add(session)
    db.commit()
    return jwt.encode(
        {"sub": user.id, "sid": session.id, "exp": expires},
        settings.secret_key,
        algorithm="HS256",
    )


def get_user(request: Request, db: DbSession = Depends(get_db)) -> User:
    try:
        claims = jwt.decode(
            request.cookies.get(COOKIE, ""),
            get_settings().secret_key,
            algorithms=["HS256"],
            options={"require": ["sub", "sid", "exp"]},
        )
        session = db.get(Session, claims["sid"])
        if not session or session.user_id != claims["sub"]:
            raise ValueError("Session missing")
        if session.expires_at.replace(tzinfo=utcnow().tzinfo) <= utcnow():
            raise ValueError("Session expired")
        user = db.get(User, claims["sub"])
        if not user:
            raise ValueError("User missing")
        request.state.session_id = session.id
        return user
    except (jwt.PyJWTError, ValueError, KeyError):
        raise AppError(401, "session_expired", "Inicia sesión para continuar.") from None


def require_role(role: str):
    def dependency(user: User = Depends(get_user)) -> User:
        if user.role != role:
            raise AppError(403, "forbidden", "Tu cuenta no tiene acceso a esta operación.")
        return user

    return dependency
