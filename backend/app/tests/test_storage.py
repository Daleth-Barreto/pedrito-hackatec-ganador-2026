import io

import pytest
from PIL import Image

from app.core.errors import AppError
from app.services.images import sanitize_image
from app.storage.local import LocalStorage


def test_path_traversal_rejected(tmp_path):
    storage = LocalStorage(tmp_path)
    with pytest.raises(ValueError):
        storage.read("../private.jpg")


def test_low_quality_is_flagged_without_clinical_claims():
    data = io.BytesIO()
    Image.new("RGB", (640, 480), "black").save(data, "PNG")
    _, metadata = sanitize_image(data.getvalue())
    assert len(metadata["quality_issues"]) == 2


def test_exif_removed():
    data = io.BytesIO()
    exif = Image.Exif()
    exif[270] = "Sensitive metadata"
    Image.new("RGB", (640, 480), "red").save(data, "JPEG", exif=exif)
    clean, _ = sanitize_image(data.getvalue())
    assert not Image.open(io.BytesIO(clean)).getexif()


def test_gif_disallowed():
    data = io.BytesIO()
    Image.new("RGB", (640, 480), "red").save(data, "GIF")
    with pytest.raises(AppError):
        sanitize_image(data.getvalue())
