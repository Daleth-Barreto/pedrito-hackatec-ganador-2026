from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import require_role
from app.models.entities import Assignment, Consent, User
from app.schemas.contracts import ConsentIn, ConsentOut, UserOut

router = APIRouter(tags=["Pacientes y consentimiento"])


@router.get("/patients", response_model=list[UserOut])
def patients(user: User = Depends(require_role("clinician")), db: Session = Depends(get_db)):
    return db.scalars(
        select(User)
        .join(Assignment, Assignment.patient_id == User.id)
        .where(Assignment.clinician_id == user.id)
        .order_by(User.name)
    ).all()


@router.get("/consents/current", response_model=ConsentOut | None)
def current_consent(user: User = Depends(require_role("patient")), db: Session = Depends(get_db)):
    return db.scalar(
        select(Consent)
        .where(Consent.patient_id == user.id, Consent.version == "2")
        .order_by(Consent.accepted_at.desc())
    )


@router.post("/consents", response_model=ConsentOut, status_code=201)
def consent(
    payload: ConsentIn, user: User = Depends(require_role("patient")), db: Session = Depends(get_db)
):
    item = Consent(patient_id=user.id, version=payload.version, accepted=payload.accepted)
    db.add(item)
    db.commit()
    return item
