from fastapi import APIRouter, Depends, Request
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.db import get_db
from app.core.errors import AppError
from app.core.rate_limit import limit_attempts
from app.core.security import passwords, require_role
from app.models.entities import Assignment, User, utcnow
from app.models.entities import Session as LoginSession
from app.models.privacy import PrivacyRequest
from app.schemas.account import (
    DeletionInput,
    PasswordInput,
    PrivacyInput,
    PrivacyOut,
    ProfileInput,
    RegisterInput,
)
from app.schemas.contracts import UserOut
from app.services.account import pending_deletion, reauthenticate
from app.services.assignment import registration_clinician

router = APIRouter(tags=["Cuenta y privacidad"])
patient = require_role("patient")


@router.get("/privacy/notice")
def notice():
    settings = get_settings()
    return {
        "version": "3",
        "controller": settings.privacy_controller,
        "address": settings.privacy_address,
        "contact": settings.privacy_contact,
        "retention_days": settings.retention_days,
    }


@router.post("/auth/register", response_model=UserOut, status_code=201)
def register(payload: RegisterInput, request: Request, db: Session = Depends(get_db)):
    limit_attempts(f"register:{request.client.host if request.client else 'unknown'}")
    if get_settings().app_env == "production":
        raise AppError(
            503,
            "registration_not_ready",
            "El registro público requiere revisión legal y verificación de correo "
            "antes de habilitarse.",
        )
    clinician = registration_clinician(db)
    user = User(
        name=payload.name,
        email=payload.email.lower(),
        role="patient",
        password_hash=passwords.hash(payload.password),
        is_demo=True,
    )
    db.add(user)
    try:
        db.flush()
        if clinician is not None:
            db.add(Assignment(clinician_id=clinician.id, patient_id=user.id))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise AppError(
            409, "registration_failed", "No se pudo crear la cuenta con estos datos."
        ) from None
    return user


@router.post("/account/profile", response_model=UserOut)
def profile(payload: ProfileInput, user: User = Depends(patient), db: Session = Depends(get_db)):
    reauthenticate(user, payload.current_password)
    user.name = payload.name
    db.commit()
    return user


@router.post("/account/password", status_code=204)
def change_password(
    payload: PasswordInput, user: User = Depends(patient), db: Session = Depends(get_db)
):
    reauthenticate(user, payload.current_password)
    user.password_hash = passwords.hash(payload.new_password)
    db.execute(delete(LoginSession).where(LoginSession.user_id == user.id))
    db.commit()


@router.get("/privacy/requests", response_model=list[PrivacyOut])
def requests(user: User = Depends(patient), db: Session = Depends(get_db)):
    return db.scalars(
        select(PrivacyRequest)
        .where(PrivacyRequest.patient_id == user.id)
        .order_by(PrivacyRequest.created_at.desc())
    ).all()


@router.post("/privacy/requests", response_model=PrivacyOut, status_code=201)
def submit(payload: PrivacyInput, user: User = Depends(patient), db: Session = Depends(get_db)):
    reauthenticate(user, payload.current_password)
    item = PrivacyRequest(patient_id=user.id, kind=payload.kind, details=payload.details.strip())
    db.add(item)
    db.commit()
    return item


@router.post("/account/deletion", response_model=PrivacyOut, status_code=201)
def request_deletion(
    payload: DeletionInput, user: User = Depends(patient), db: Session = Depends(get_db)
):
    reauthenticate(user, payload.current_password)
    if pending_deletion(db, user.id):
        raise AppError(409, "deletion_pending", "Ya tienes una solicitud de eliminación pendiente.")
    item = PrivacyRequest(
        patient_id=user.id,
        kind="account_deletion",
        details=(
            "Eliminación de cuenta, fotografías, cuestionarios e historial "
            "solicitada por su titular."
        ),
    )
    db.add(item)
    db.commit()
    return item


@router.post("/account/deletion/cancel", status_code=204)
def cancel_deletion(user: User = Depends(patient), db: Session = Depends(get_db)):
    item = pending_deletion(db, user.id)
    if not item:
        raise AppError(404, "not_found", "No hay una eliminación pendiente.")
    item.status = "cancelled"
    item.updated_at = utcnow()
    db.commit()
