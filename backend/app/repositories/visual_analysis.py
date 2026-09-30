from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.entities import Record, VisualAnalysis, VisualConsent


def latest_consent(db: Session, record_id: str) -> VisualConsent | None:
    return db.scalar(
        select(VisualConsent)
        .where(VisualConsent.record_id == record_id)
        .order_by(VisualConsent.created_at.desc(), VisualConsent.id.desc())
    )


def lock_record(db: Session, record_id: str):
    return db.scalar(select(Record).where(Record.id == record_id).with_for_update())


def delete_visual_data(db: Session, record_id: str) -> None:
    db.execute(delete(VisualAnalysis).where(VisualAnalysis.record_id == record_id))
    db.execute(delete(VisualConsent).where(VisualConsent.record_id == record_id))
