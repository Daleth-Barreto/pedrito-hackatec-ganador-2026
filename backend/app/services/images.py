import io
import warnings

from PIL import Image, ImageOps, ImageStat, UnidentifiedImageError

from app.core.errors import AppError

Image.MAX_IMAGE_PIXELS = 20_000_000


def sanitize_image(content: bytes) -> tuple[bytes, dict]:
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(content)) as source:
                if source.format not in {"JPEG", "PNG", "WEBP"}:
                    raise AppError(422, "invalid_image", "Usa una imagen JPEG, PNG o WebP.")
                if getattr(source, "n_frames", 1) != 1:
                    raise AppError(422, "invalid_image", "Selecciona una imagen sin animación.")
                source.load()
                image = ImageOps.exif_transpose(source).convert("RGB")
            if min(image.size) < 320:
                raise AppError(
                    422, "image_too_small", "La imagen debe medir al menos 320 × 320 px."
                )
            image.thumbnail((2400, 2400))
            # Re-encoding strips EXIF (including location), filenames and ancillary metadata.
            clean = Image.new("RGB", image.size)
            clean.paste(image)
            stats = ImageStat.Stat(clean.resize((128, 128)).convert("L"))
            quality = []
            if stats.mean[0] < 25 or stats.mean[0] > 235:
                quality.append("La exposición de la fotografía dificulta su revisión.")
            if stats.stddev[0] < 8:
                quality.append("La fotografía tiene poco detalle o contraste.")
            buffer = io.BytesIO()
            clean.save(buffer, "JPEG", quality=90)
            return buffer.getvalue(), {
                "width": clean.width,
                "height": clean.height,
                "quality_issues": quality,
                "content_type": "image/jpeg",
                "quality_scope": "Comprobación técnica; no confirma enfoque ni contenido clínico.",
            }
    except AppError:
        raise
    except (
        UnidentifiedImageError,
        OSError,
        ValueError,
        Image.DecompressionBombError,
        Image.DecompressionBombWarning,
    ):
        raise AppError(
            422, "invalid_image", "No se pudo leer la imagen. Elige otro archivo."
        ) from None
