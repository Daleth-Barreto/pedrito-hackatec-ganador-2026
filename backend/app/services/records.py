from datetime import timedelta

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import AppError
from app.ml.inference import analyze_image
from app.models.entities import Consent, Record, Review, User, utcnow
from app.repositories.visual_analysis import delete_visual_data
from app.schemas.contracts import RecordIn
from app.services.account import pending_deletion
from app.services.images import sanitize_image
from app.services.triage import RULES_VERSION, prioritize
from app.storage.local import ImageStorage


def create_record(
    db: Session, user: User, payload: RecordIn, content: bytes, storage: ImageStorage
) -> Record:
    if pending_deletion(db, user.id):
        raise AppError(
            409,
            "deletion_pending",
            "Cancela la solicitud de eliminación antes de enviar nuevos registros.",
        )
    consent = db.get(Consent, str(payload.consent_id))
    latest = db.scalar(
        select(Consent).where(Consent.patient_id == user.id).order_by(Consent.accepted_at.desc())
    )
    if (
        not consent
        or consent.patient_id != user.id
        or consent.version != "2"
        or not consent.accepted
        or not latest
        or not latest.accepted
    ):
        raise AppError(422, "consent_required", "Acepta el consentimiento antes de enviar.")
    clean, metadata = sanitize_image(content)
    inference = analyze_image(metadata)
    result = prioritize(payload.questionnaire, inference)
    key = storage.save(clean)
    record = Record(
        patient_id=user.id,
        consent_id=consent.id,
        questionnaire=payload.questionnaire.model_dump(mode="json"),
        image_key=key,
        image_metadata=metadata,
        inference=inference,
        priority=result.priority,
        reasons=result.reasons,
        rules_version=RULES_VERSION,
        expires_at=utcnow() + timedelta(days=get_settings().retention_days),
    )
    try:
        db.add(record)
        db.commit()
    except Exception:
        db.rollback()
        storage.delete(key)
        raise
    return record


def delete_record(db: Session, record: Record, storage: ImageStorage) -> None:
    # Delete bytes first: failed storage deletion keeps DB metadata available for retry.
    storage.delete(record.image_key)
    delete_visual_data(db, record.id)
    db.execute(delete(Review).where(Review.record_id == record.id))
    db.delete(record)
    db.commit()
