import io
import logging
from threading import Lock

from PIL import Image

from app.core.config import get_settings
from app.core.errors import AppError
from app.ml.wound_checkpoint import load_model
from app.schemas.segmentation import Region, SegmentationResult

logger = logging.getLogger("seguimiento")
inference_lock = Lock()
LIMITATIONS = [
    "Modelo experimental de una clase, «herida»; no validado en heridas postamputación.",
    "Los contornos pueden ser incorrectos. No identifican infección, tejidos ni gravedad.",
    "El área corresponde a píxeles de la fotografía, no a centímetros ni a tamaño clínico.",
    "La puntuación es técnica; no expresa certeza médica ni probabilidad de enfermedad.",
    "El encuadre cambia el área relativa. No permite comparar evolución entre fotografías.",
    "La ausencia de regiones no descarta una herida o complicación. Requiere revisión humana.",
    "Este análisis no modifica la prioridad, el reporte ni la valoración profesional.",
]


def describe_regions(result) -> list[Region]:
    import cv2
    import numpy as np

    if result.masks is None:
        return []
    height, width = result.orig_shape
    regions = []
    for polygon, box in zip(result.masks.xy, result.boxes, strict=True):
        points = np.asarray(polygon, dtype=np.float32)
        if len(points) < 3 or not np.isfinite(points).all():
            continue
        points[:, 0] = points[:, 0].clip(0, width)
        points[:, 1] = points[:, 1].clip(0, height)
        area = float(cv2.contourArea(points))
        if area <= 0:
            continue
        bbox = box.xyxy[0].cpu().tolist()
        bbox = [max(0, min(float(v), width if i % 2 == 0 else height)) for i, v in enumerate(bbox)]
        cx, cy = (bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2
        regions.append(
            Region(
                technical_score=round(float(box.conf[0]), 4),
                area_px=round(area, 2),
                image_area_percent=round(min(100, area / (width * height) * 100), 4),
                bbox_xyxy=bbox,
                polygon_xy=points.tolist(),
                position_horizontal=("izquierda", "centro", "derecha")[min(2, int(cx / width * 3))],
                position_vertical=("superior", "media", "inferior")[min(2, int(cy / height * 3))],
            )
        )
    return sorted(regions, key=lambda region: region.area_px, reverse=True)


def segment_image(content: bytes) -> SegmentationResult:
    if not inference_lock.acquire(blocking=False):
        raise AppError(503, "segmentation_busy", "El análisis está ocupado. Intenta más tarde.")
    try:
        settings = get_settings()
        model = load_model(
            settings.segmentation_model_path.resolve(), settings.segmentation_threads
        )
        from ultralytics.models.yolo.segment.predict import SegmentationPredictor

        predictor = SegmentationPredictor(
            overrides={
                "device": "cpu",
                "conf": 0.35,
                "imgsz": 640,
                "max_det": 20,
                "save": False,
                "save_txt": False,
                "verbose": False,
            }
        )
        predictor.callbacks = {}
        predictor.setup_model(model=model, verbose=False)
        with Image.open(io.BytesIO(content)) as image:
            result = predictor(source=image.convert("RGB"))[0]
        regions = describe_regions(result)
        return SegmentationResult(
            image_width=result.orig_shape[1],
            image_height=result.orig_shape[0],
            regions=regions,
            message=(
                "Regiones propuestas por el modelo; requieren inspección humana."
                if regions
                else "Sin regiones detectadas a este umbral; no significa que la imagen sea normal."
            ),
            limitations=LIMITATIONS,
        )
    except AppError:
        raise
    except Exception as exc:
        logger.warning("Segmentation unavailable: %s", type(exc).__name__)
        raise AppError(
            503, "segmentation_unavailable", "El análisis de imagen no está disponible."
        ) from None
    finally:
        inference_lock.release()
