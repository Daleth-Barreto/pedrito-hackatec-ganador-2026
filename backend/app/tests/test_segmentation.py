import io
import os
from pathlib import Path
from types import SimpleNamespace

import pytest
from PIL import Image

from app.core.config import get_settings
from app.core.errors import AppError
from app.ml.segmentation import LIMITATIONS, describe_regions, inference_lock, segment_image
from app.ml.wound_checkpoint import verified_bytes
from app.models.entities import VisualAnalysis, VisualConsent
from app.schemas.segmentation import SegmentationResult
from app.tests.conftest import create, login

ACK = {"limitations_acknowledged": True}


def authorize(client, record_id, accepted=True):
    response = client.post(
        f"/api/records/{record_id}/visual-consent",
        json={"accepted": accepted, "version": "visual-1"},
    )
    assert response.status_code == 200
    return response.json()


def test_segmentation_permissions_and_no_record_mutation(setup, image_bytes, answers, monkeypatch):
    client, _, _, _ = setup
    login(client)
    before = create(client, image_bytes, {**answers, "fever": True}).json()
    before = client.get(f"/api/records/{before['id']}").json()
    authorize(client, before["id"])
    path = f"/api/records/{before['id']}/segmentation"
    assert client.post(path, json=ACK).status_code == 403
    login(client, "unassigned")
    assert client.post(path, json=ACK).status_code == 404
    login(client, "clinician")
    monkeypatch.setattr(get_settings(), "segmentation_enabled", False)
    assert client.post(path, json=ACK).status_code == 503
    monkeypatch.setattr(get_settings(), "segmentation_enabled", True)
    assert client.post(path, json={}).status_code == 422
    assert client.post(path, json={"limitations_acknowledged": False}).status_code == 422
    monkeypatch.setattr(
        "app.api.segmentation.segment_image",
        lambda content: SegmentationResult(
            image_width=640,
            image_height=480,
            regions=[],
            message="Sin regiones detectadas; no significa normalidad.",
            limitations=LIMITATIONS,
        ),
    )
    response = client.post(path, json=ACK)
    assert response.status_code == 200
    assert response.json()["status"] == "experimental"
    assert response.json()["affects_priority"] is False
    assert response.headers["cache-control"] == "no-store"
    after = client.get(f"/api/records/{before['id']}").json()
    assert before == after
    assert after["priority"] == "alerta"
    assert after["inference"]["status"] == "unavailable"
    assert "image_key" not in response.text
    assert client.get(path).json()["result"] == response.json()
    login(client)
    state = authorize(client, before["id"], False)
    assert state["result"] is None
    assert state["consent"]["accepted"] is False
    login(client, "clinician")
    assert client.post(path, json=ACK).status_code == 403


def test_segmentation_requires_owner_consent_and_blocks_production(
    setup, image_bytes, answers, monkeypatch
):
    client, _, _, _ = setup
    login(client)
    record = create(client, image_bytes, answers).json()
    path = f"/api/records/{record['id']}/segmentation"
    login(client, "other")
    assert client.get(path).status_code == 404
    assert (
        client.post(
            f"/api/records/{record['id']}/visual-consent",
            json={"accepted": True, "version": "visual-1"},
        ).status_code
        == 404
    )
    login(client, "clinician")
    assert (
        client.post(
            f"/api/records/{record['id']}/visual-consent",
            json={"accepted": True, "version": "visual-1"},
        ).status_code
        == 403
    )
    monkeypatch.setattr(get_settings(), "segmentation_enabled", True)
    assert client.post(path, json=ACK).json()["error"]["code"] == "visual_consent_required"
    monkeypatch.setattr(get_settings(), "app_env", "production")
    assert client.post(path, json=ACK).status_code == 403


def test_quality_and_missing_image(setup, image_bytes, answers, monkeypatch):
    client, _, storage, _ = setup
    image = io.BytesIO()
    Image.new("RGB", (640, 480), "black").save(image, "PNG")
    login(client)
    record = create(client, image.getvalue(), answers).json()
    authorize(client, record["id"])
    login(client, "clinician")
    monkeypatch.setattr(get_settings(), "segmentation_enabled", True)
    path = f"/api/records/{record['id']}/segmentation"
    assert client.post(path, json=ACK).json()["error"]["code"] == "image_quality"

    def missing(key):
        raise FileNotFoundError

    monkeypatch.setattr(storage, "read", missing)
    assert client.post(path, json=ACK).status_code == 404


def test_checkpoint_hash_rejects_unknown_file_before_loading(tmp_path):
    path = tmp_path / "unknown.pt"
    path.write_bytes(b"not a trusted checkpoint")
    with pytest.raises(ValueError, match="Unrecognized"):
        verified_bytes(path)


def test_model_failure_is_clear_and_does_not_expose_paths(monkeypatch):
    def unavailable(*args):
        raise FileNotFoundError("private/server/path")

    monkeypatch.setattr("app.ml.segmentation.load_model", unavailable)
    with pytest.raises(AppError) as exc:
        segment_image(b"test")
    assert exc.value.status == 503
    assert "private" not in exc.value.message
    assert not inference_lock.locked()


def test_busy_inference_does_not_queue_unbounded_work():
    with inference_lock:
        with pytest.raises(AppError) as exc:
            segment_image(b"test")
    assert exc.value.code == "segmentation_busy"


def test_polygon_geometry_and_empty_result():
    np = pytest.importorskip("numpy")
    pytest.importorskip("cv2")
    box = SimpleNamespace(
        xyxy=SimpleNamespace(__unused__=None),
        conf=[0.8],
    )
    box.xyxy = [SimpleNamespace(cpu=lambda: SimpleNamespace(tolist=lambda: [10, 10, 30, 30]))]
    result = SimpleNamespace(
        orig_shape=(100, 100),
        boxes=[box],
        masks=SimpleNamespace(xy=[np.array([[10, 10], [30, 10], [30, 30], [10, 30]])]),
    )
    regions = describe_regions(result)
    assert regions[0].area_px == 400
    assert regions[0].image_area_percent == 4
    assert regions[0].technical_score == 0.8
    assert regions[0].position_horizontal == "izquierda"
    result.masks = None
    assert describe_regions(result) == []


@pytest.mark.skipif(not os.environ.get("RUN_MODEL_TESTS"), reason="Optional local model test")
def test_real_checkpoint_smoke_and_no_network(setup, image_bytes, answers, monkeypatch):
    import socket

    def blocked(*args, **kwargs):
        raise AssertionError("Network calls are forbidden during inference")

    client, _, _, _ = setup
    login(client)
    record = create(client, image_bytes, answers).json()
    authorize(client, record["id"])
    login(client, "clinician")
    monkeypatch.setattr(socket, "getaddrinfo", blocked)
    monkeypatch.setattr(socket.socket, "connect", blocked)
    monkeypatch.setattr(get_settings(), "segmentation_model_path", Path("model_artifacts/best.pt"))
    monkeypatch.setattr(get_settings(), "segmentation_enabled", True)
    response = client.post(f"/api/records/{record['id']}/segmentation", json=ACK)
    assert response.status_code == 200, response.text
    result = SegmentationResult.model_validate(response.json())
    assert result.status == "experimental"
    assert result.model_id == "wound-seg-719df7a51f14"
    assert result.validated_for_postamputation is False
    assert result.image_width == 640 and result.image_height == 480
    assert result.affects_priority is False


def test_visual_data_deleted_with_record(setup, image_bytes, answers):
    from sqlalchemy import select

    client, factory, _, _ = setup
    login(client)
    record = create(client, image_bytes, answers).json()
    authorize(client, record["id"])
    with factory() as db:
        consent = db.scalar(select(VisualConsent).where(VisualConsent.record_id == record["id"]))
        db.add(VisualAnalysis(record_id=record["id"], consent_id=consent.id, result={}))
        db.commit()
    assert client.delete(f"/api/records/{record['id']}").status_code == 204
    with factory() as db:
        assert db.get(VisualAnalysis, record["id"]) is None
        assert (
            db.scalar(select(VisualConsent).where(VisualConsent.record_id == record["id"])) is None
        )
