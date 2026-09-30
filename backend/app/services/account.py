from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.core.rate_limit import limit_attempts
from app.core.security import passwords
from app.models.entities import Assignment, Consent, Record, Review, User
from app.models.entities import Session as LoginSession
from app.models.privacy import PrivacyRequest
from app.repositories.visual_analysis import delete_visual_data
from app.storage.local import ImageStorage


def reauthenticate(user: User, password: str) -> None:
    limit_attempts(f"reauth:{user.id}")
    if not passwords.verify(password, user.password_hash):
        raise AppError(403, "reauthentication_failed", "La contraseña actual no coincide.")


def pending_deletion(db: Session, user_id: str):
    return db.scalar(
        select(PrivacyRequest).where(
            PrivacyRequest.patient_id == user_id,
            PrivacyRequest.kind == "account_deletion",
            PrivacyRequest.status == "received",
        )
    )


def erase_account(db: Session, user: User, storage: ImageStorage) -> None:
    """Idempotent file deletion; DB remains retryable if storage deletion fails."""
    records = db.scalars(select(Record).where(Record.patient_id == user.id)).all()
    for record in records:
        storage.delete(record.image_key)
        delete_visual_data(db, record.id)
        db.execute(delete(Review).where(Review.record_id == record.id))
        db.delete(record)
    db.flush()
    for model, column in (
        (Consent, Consent.patient_id),
        (PrivacyRequest, PrivacyRequest.patient_id),
        (LoginSession, LoginSession.user_id),
        (Assignment, Assignment.patient_id),
    ):
        db.execute(delete(model).where(column == user.id))
    db.delete(user)
    db.commit()
