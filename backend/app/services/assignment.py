from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import AppError
from app.models.entities import User


def registration_clinician(db: Session) -> User | None:
    email = get_settings().registration_clinician_email.strip().lower()
    if not email:
        return None
    clinician = db.scalar(select(User).where(User.email == email, User.role == "clinician"))
    if clinician is None:
        raise AppError(
            503,
            "registration_assignment_unavailable",
            "No se pudo asignar el equipo de salud. Intenta crear tu cuenta más tarde.",
        )
    return clinician
