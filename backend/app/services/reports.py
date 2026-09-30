from sqlalchemy.orm import Session

from app.models.entities import Record, User
from app.repositories.records import review_for
from app.schemas.contracts import RecordOut, RecordSummary, ReviewOut

PATIENT_MESSAGES = {
    "alerta": "Tus respuestas señalan que conviene contactar al equipo de salud para solicitar "
    "una revisión oportuna. Este envío no confirma que alguien ya lo haya leído.",
    "vigilancia": "Hay cambios reportados que necesitan revisión del equipo de salud. "
    "Consulta aquí el estado de tu registro y sigue tu canal habitual de contacto.",
    "normal": "El sistema no identificó señales en la información disponible. "
    "Esto no descarta una complicación; el equipo de salud debe revisar el registro.",
    None: "La evaluación automática no está disponible. Tu registro quedó para revisión humana. "
    "La ausencia de una prioridad no significa que la herida esté bien.",
}


def summary(db: Session, record: Record) -> RecordSummary:
    patient = db.get(User, record.patient_id)
    return RecordSummary(
        id=record.id,
        patient_id=record.patient_id,
        patient_name=patient.name,
        is_demo=patient.is_demo,
        created_at=record.created_at,
        photo_date=record.questionnaire["photo_date"],
        priority=record.priority,
        status="reviewed" if review_for(db, record.id) else "pending",
        automatic_status=record.inference["status"],
    )


def detail(db: Session, record: Record) -> RecordOut:
    review = review_for(db, record.id)
    base = summary(db, record)
    limitations = [
        *record.inference["limitations"],
        "Las reglas de priorización no tienen validación clínica.",
        "Las respuestas son información reportada; no son hallazgos confirmados.",
        "La decisión final corresponde al personal de salud.",
    ]
    report = {
        "record_id": record.id,
        "created_at": record.created_at.isoformat(),
        "questionnaire": record.questionnaire,
        "visual_observations": record.inference["visual_observations"],
        "suggested_priority": record.priority,
        "reasons": record.reasons,
        "limitations": limitations,
        "review_status": base.status,
        "generator": "Plantilla estructurada v1; no se utilizó un LLM externo.",
    }
    return RecordOut(
        **base.model_dump(),
        questionnaire=record.questionnaire,
        image_metadata=record.image_metadata,
        inference=record.inference,
        reasons=record.reasons,
        rules_version=record.rules_version,
        expires_at=record.expires_at,
        review=ReviewOut.model_validate(review) if review else None,
        report=report,
        patient_message=PATIENT_MESSAGES[record.priority],
    )
