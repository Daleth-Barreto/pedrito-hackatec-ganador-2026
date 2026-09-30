from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.db import get_db
from app.core.errors import AppError
from app.core.security import get_user, require_role
from app.ml.segmentation import segment_image
from app.models.entities import User, VisualAnalysis, VisualConsent, utcnow
from app.repositories.records import authorized_record
from app.repositories.visual_analysis import latest_consent, lock_record
from app.schemas.segmentation import (
    SegmentationRequest,
    SegmentationResult,
    SegmentationState,
    VisualConsentRequest,
    VisualConsentStatus,
)
from app.services.images import sanitize_image
from app.storage.local import ImageStorage, get_storage

router = APIRouter(prefix="/records", tags=["Segmentación experimental"])


@router.post("/{record_id}/segmentation", response_model=SegmentationResult)
def segment_record(
    record_id: UUID,
    payload: SegmentationRequest,
    user: User = Depends(require_role("clinician")),
    db: Session = Depends(get_db),
    storage: ImageStorage = Depends(get_storage),
):
    """Segmentación experimental local, con autorización específica del paciente."""
    record = authorized_record(db, user, str(record_id))
    settings = get_settings()
    if settings.app_env == "production":
        raise AppError(
            403,
            "segmentation_test_only",
            "El análisis experimental no está habilitado para uso clínico.",
        )
    if not settings.segmentation_enabled:
        raise AppError(503, "segmentation_disabled", "El análisis experimental no está habilitado.")
    consent = latest_consent(db, record.id)
    if not consent or not consent.accepted or consent.version != "visual-1":
        raise AppError(
            403,
            "visual_consent_required",
            "El paciente debe autorizar el análisis visual de este registro.",
        )
    consent_id = consent.id
    try:
        content = storage.read(record.image_key)
    except FileNotFoundError:
        raise AppError(404, "image_missing", "La fotografía no está disponible.") from None
    if len(content) > settings.max_upload_bytes:
        raise AppError(413, "image_too_large", "La fotografía supera el tamaño permitido.")
    clean, metadata = sanitize_image(content)
    if metadata["quality_issues"]:
        raise AppError(
            422, "image_quality", "La calidad de la fotografía no permite este análisis."
        )
    result = segment_image(clean)
    if not lock_record(db, record.id):
        raise AppError(404, "not_found", "El registro ya no está disponible.")
    authorized_record(db, user, record.id)
    current = latest_consent(db, record.id)
    if not current or current.id != consent_id or not current.accepted:
        raise AppError(
            409, "visual_consent_changed", "La autorización cambió. El resultado se descartó."
        )
    result.analyzed_at = utcnow()
    saved = db.get(VisualAnalysis, record.id)
    if not saved:
        saved = VisualAnalysis(record_id=record.id, consent_id=consent_id)
        db.add(saved)
    saved.consent_id = consent_id
    saved.result = result.model_dump(mode="json")
    db.commit()
    return result


@router.get("/{record_id}/segmentation", response_model=SegmentationState)
def segmentation_state(
    record_id: UUID,
    user: User = Depends(get_user),
    db: Session = Depends(get_db),
):
    record = authorized_record(db, user, str(record_id))
    consent = latest_consent(db, record.id)
    saved = db.get(VisualAnalysis, record.id)
    settings = get_settings()
    return SegmentationState(
        enabled=settings.segmentation_enabled and settings.app_env != "production",
        consent=(
            VisualConsentStatus(
                accepted=consent.accepted, version=consent.version, decided_at=consent.created_at
            )
            if consent
            else None
        ),
        result=(saved.result if saved and consent and consent.accepted else None),
    )


@router.post("/{record_id}/visual-consent", response_model=SegmentationState)
def visual_consent(
    record_id: UUID,
    payload: VisualConsentRequest,
    user: User = Depends(require_role("patient")),
    db: Session = Depends(get_db),
):
    record = authorized_record(db, user, str(record_id))
    if not lock_record(db, record.id):
        raise AppError(404, "not_found", "El registro ya no está disponible.")
    db.add(VisualConsent(record_id=record.id, accepted=payload.accepted, version=payload.version))
    if not payload.accepted:
        db.execute(delete(VisualAnalysis).where(VisualAnalysis.record_id == record.id))
    db.commit()
    return segmentation_state(record_id, user, db)
