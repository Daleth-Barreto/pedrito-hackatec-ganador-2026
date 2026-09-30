from dataclasses import dataclass

from app.schemas.contracts import Questionnaire

RULES_VERSION = "prototype-v1"


@dataclass(frozen=True)
class TriageResult:
    priority: str | None
    reasons: list[str]


def prioritize(answers: Questionnaire, inference: dict) -> TriageResult:
    alerts = []
    watch = []
    if answers.fever is True:
        alerts.append("Fiebre reportada por el paciente.")
    if answers.wound_opening is True:
        alerts.append("Apertura de la herida reportada.")
    for field, reason in [
        (answers.increased_pain, "Aumento del dolor reportado."),
        (answers.discharge, "Secreción reportada."),
        (answers.odor, "Mal olor reportado."),
        (answers.changes == "changed", "Cambios desde el registro anterior reportados."),
    ]:
        if field is True:
            watch.append(reason)
    if answers.pain is not None and answers.pain >= 4:
        watch.append("Dolor reportado de 4 o más en la escala de 0 a 10.")
    missing = (
        any(
            value is None
            for value in (
                answers.pain,
                answers.increased_pain,
                answers.fever,
                answers.discharge,
                answers.odor,
                answers.wound_opening,
            )
        )
        or answers.changes == "unknown"
    )
    reasons = alerts + watch
    if missing:
        reasons.append("Hay respuestas desconocidas; se requiere revisión humana.")
    if inference["status"] != "available":
        reasons.append("Análisis visual no disponible; la fotografía necesita revisión humana.")
    # Only a validated adapter may ever supply available=True and an image priority.
    image_priority = inference.get("priority") if inference["status"] == "available" else None
    if alerts or image_priority == "alerta":
        if image_priority == "alerta":
            reasons.append("Señal visual del modelo; pendiente de valoración profesional.")
        return TriageResult("alerta", reasons)
    if watch or image_priority == "vigilancia":
        if image_priority == "vigilancia":
            reasons.append("Señal visual del modelo; pendiente de valoración profesional.")
        return TriageResult("vigilancia", reasons)
    if not missing and image_priority == "normal":
        return TriageResult(
            "normal", ["Sin señales en las entradas disponibles; requiere revisión."]
        )
    return TriageResult(None, reasons or ["Información insuficiente; requiere revisión humana."])
