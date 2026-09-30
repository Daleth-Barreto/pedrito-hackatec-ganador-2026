from app.core.config import get_settings


def analyze_image(metadata: dict) -> dict:
    mode = get_settings().inference_mode
    limitations = [
        "El análisis automatizado de fotografías no está disponible. "
        "La imagen requiere revisión del personal de salud.",
        "No se detectan infecciones ni se describen tejidos a partir de la fotografía.",
        *metadata["quality_issues"],
    ]
    return {
        "mode": mode,
        "status": "unavailable",
        "label": "Evaluación automática no disponible",
        "model_version": None,
        "visual_observations": [],
        "limitations": limitations,
    }
