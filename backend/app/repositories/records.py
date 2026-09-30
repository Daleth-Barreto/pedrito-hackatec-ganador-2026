from sqlalchemy import exists, select
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models.entities import Assignment, Record, Review, User, utcnow


def visible_records(user: User):
    query = select(Record).where(Record.expires_at > utcnow())
    if user.role == "patient":
        return query.where(Record.patient_id == user.id)
    return query.where(
        Record.patient_id.in_(
            select(Assignment.patient_id).where(Assignment.clinician_id == user.id)
        )
    )


def authorized_record(db: Session, user: User, record_id: str) -> Record:
    record = db.scalar(visible_records(user).where(Record.id == record_id))
    if not record:
        raise AppError(404, "not_found", "No se encontró el registro solicitado.")
    return record


def review_for(db: Session, record_id: str) -> Review | None:
    return db.scalar(select(Review).where(Review.record_id == record_id))


def review_exists():
    return exists().where(Review.record_id == Record.id)
