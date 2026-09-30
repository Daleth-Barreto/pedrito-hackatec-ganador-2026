from datetime import date, datetime, time, timedelta, timezone
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, Response, UploadFile
from pydantic import ValidationError
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.db import get_db
from app.core.errors import AppError
from app.core.security import get_user, require_role
from app.models.entities import Record, Review, User
from app.repositories.records import authorized_record, review_exists, review_for, visible_records
from app.schemas.contracts import RecordIn, RecordList, RecordOut, ReviewIn
from app.services.records import create_record, delete_record
from app.services.reports import detail, summary
from app.storage.local import ImageStorage, get_storage

router = APIRouter(prefix="/records", tags=["Registros"])


@router.post("", response_model=RecordOut, status_code=201)
def create(
    payload: str = Form(...),
    image: UploadFile = File(...),
    user: User = Depends(require_role("patient")),
    db: Session = Depends(get_db),
    storage: ImageStorage = Depends(get_storage),
):
    try:
        data = RecordIn.model_validate_json(payload)
    except ValidationError:
        raise AppError(422, "invalid_questionnaire", "Revisa los datos del cuestionario.") from None
    content = image.file.read(get_settings().max_upload_bytes + 1)
    if len(content) > get_settings().max_upload_bytes:
        raise AppError(413, "image_too_large", "La fotografía no debe superar 8 MB.")
    return detail(db, create_record(db, user, data, content, storage))


@router.get("", response_model=RecordList)
def list_records(
    priority: Literal["normal", "vigilancia", "alerta", "unavailable"] | None = None,
    status: Literal["pending", "reviewed"] | None = None,
    from_date: date | None = None,
    to_date: date | None = None,
    patient_id: UUID | None = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    user: User = Depends(get_user),
    db: Session = Depends(get_db),
):
    if from_date and to_date and from_date > to_date:
        raise AppError(422, "invalid_dates", "La fecha inicial debe ser anterior a la final.")
    query = visible_records(user)
    if priority:
        query = query.where(
            Record.priority.is_(None) if priority == "unavailable" else Record.priority == priority
        )
    if status:
        query = query.where(review_exists() if status == "reviewed" else ~review_exists())
    if patient_id:
        query = query.where(Record.patient_id == str(patient_id))
    if from_date:
        query = query.where(
            Record.created_at >= datetime.combine(from_date, time.min, timezone.utc)
        )
    if to_date:
        query = query.where(
            Record.created_at
            < datetime.combine(to_date + timedelta(days=1), time.min, timezone.utc)
        )
    total = db.scalar(select(func.count()).select_from(query.subquery()))
    records = db.scalars(
        query.order_by(Record.created_at.desc(), Record.id).offset(offset).limit(limit)
    )
    return RecordList(items=[summary(db, record) for record in records], total=total)


@router.get("/{record_id}", response_model=RecordOut)
def get_record(record_id: UUID, user: User = Depends(get_user), db: Session = Depends(get_db)):
    return detail(db, authorized_record(db, user, str(record_id)))


@router.get("/{record_id}/image")
def image(
    record_id: UUID,
    user: User = Depends(get_user),
    db: Session = Depends(get_db),
    storage: ImageStorage = Depends(get_storage),
):
    record = authorized_record(db, user, str(record_id))
    try:
        content = storage.read(record.image_key)
    except FileNotFoundError:
        raise AppError(404, "image_missing", "La fotografía no está disponible.") from None
    return Response(
        content,
        media_type="image/jpeg",
        headers={
            "Content-Disposition": 'inline; filename="fotografia.jpg"',
        },
    )


@router.post("/{record_id}/reviews", response_model=RecordOut, status_code=201)
def review(
    record_id: UUID,
    payload: ReviewIn,
    user: User = Depends(require_role("clinician")),
    db: Session = Depends(get_db),
):
    record = authorized_record(db, user, str(record_id))
    if review_for(db, record.id):
        raise AppError(409, "already_reviewed", "Este registro ya tiene una revisión profesional.")
    db.add(Review(record_id=record.id, clinician_id=user.id, **payload.model_dump()))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise AppError(409, "already_reviewed", "Este registro ya fue revisado.") from None
    return detail(db, record)


@router.delete("/{record_id}", status_code=204)
def remove(
    record_id: UUID,
    user: User = Depends(require_role("patient")),
    db: Session = Depends(get_db),
    storage: ImageStorage = Depends(get_storage),
):
    delete_record(db, authorized_record(db, user, str(record_id)), storage)
