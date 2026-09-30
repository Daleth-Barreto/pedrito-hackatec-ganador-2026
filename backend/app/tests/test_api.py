import io
import json
from datetime import timedelta
from uuid import uuid4

from PIL import Image
from sqlalchemy import select

from app.core.security import COOKIE
from app.models.entities import Record, Session, utcnow
from app.tests.conftest import create, login


def test_complete_flow_and_persistence(setup, image_bytes, answers):
    client, factory, storage, ids = setup
    login(client)
    response = create(client, image_bytes, answers)
    assert response.status_code == 201, response.text
    record = response.json()
    assert record["priority"] is None
    assert record["inference"]["status"] == "unavailable"
    assert record["report"]["visual_observations"] == []
    assert "image_key" not in record
    assert client.get("/api/records").json()["total"] == 1
    with factory() as fresh_db:
        saved = fresh_db.get(Record, record["id"])
        assert saved.patient_id == ids["patient"]
        stored = Image.open(io.BytesIO(storage.read(saved.image_key)))
        assert stored.format == "JPEG" and not stored.getexif()
    assert client.get(f"/api/records/{record['id']}/image").headers["cache-control"] == "no-store"
    login(client, "clinician")
    assert client.get("/api/patients").json()[0]["id"] == ids["patient"]
    assert client.get("/api/records?status=pending").json()["total"] == 1
    reviewed = client.post(
        f"/api/records/{record['id']}/reviews",
        json={
            "assessment": "follow_up",
            "note": "Nota profesional de prueba, sin diagnóstico.",
        },
    )
    assert reviewed.status_code == 201
    assert reviewed.json()["status"] == "reviewed"
    assert reviewed.json()["priority"] is None
    assert reviewed.json()["report"]["review_status"] == "reviewed"
    assert client.get("/api/records?status=pending").json()["total"] == 0
    assert client.get("/api/records?status=reviewed").json()["total"] == 1
    assert (
        client.post(
            f"/api/records/{record['id']}/reviews",
            json={
                "assessment": "reviewed",
                "note": "Segunda revisión de prueba.",
            },
        ).status_code
        == 409
    )
    login(client)
    assert client.get(f"/api/records/{record['id']}").json()["review"]["assessment"] == "follow_up"


def test_owner_and_assignment_permissions(setup, image_bytes, answers):
    client, _, _, _ = setup
    assert client.get("/api/records").status_code == 401
    login(client)
    record = create(client, image_bytes, answers).json()
    path = f"/api/records/{record['id']}"
    assert (
        client.post(
            path + "/reviews", json={"assessment": "reviewed", "note": "Prueba"}
        ).status_code
        == 403
    )
    assert client.get("/api/patients").status_code == 403
    for identity in ["other", "unassigned"]:
        login(client, identity)
        assert client.get(path).status_code == 404
        assert client.get(path + "/image").status_code == 404
        assert client.get("/api/records").json()["total"] == 0
    assert (
        client.post(
            path + "/reviews", json={"assessment": "reviewed", "note": "Prueba"}
        ).status_code
        == 404
    )
    login(client, "clinician")
    assert client.delete(path).status_code == 403


def test_consent_and_upload_validation(setup, image_bytes, answers):
    client, _, storage, _ = setup
    login(client)
    assert client.post("/api/consents", json={"accepted": False, "version": "2"}).status_code == 201
    payload = {"consent_id": str(uuid4()), "questionnaire": answers}
    assert (
        client.post(
            "/api/records",
            data={"payload": json.dumps(payload)},
            files={
                "image": ("x.png", image_bytes, "image/png"),
            },
        ).status_code
        == 422
    )
    assert create(client, b"not an image", answers).status_code == 422
    assert create(client, b"X" * (8 * 1024 * 1024 + 1), answers).status_code == 413
    small = io.BytesIO()
    Image.new("RGB", (10, 10)).save(small, "PNG")
    assert create(client, small.getvalue(), answers).status_code == 422
    answers["photo_date"] = "2999-01-01"
    assert create(client, image_bytes, answers).status_code == 422
    assert list(storage.root.iterdir()) == []


def test_session_revocation_and_expiry(setup):
    client, factory, _, _ = setup
    login(client)
    token = client.cookies.get(COOKIE)
    assert client.post("/api/auth/logout").status_code == 204
    client.cookies.set(COOKIE, token)
    assert client.get("/api/auth/me").status_code == 401
    client.cookies.clear()
    login(client)
    with factory() as db:
        session = db.scalar(select(Session))
        session.expires_at = utcnow() - timedelta(minutes=1)
        db.commit()
    assert client.get("/api/auth/me").status_code == 401


def test_bad_origin_and_login_rate_limit(setup):
    client, _, _, _ = setup
    assert (
        client.post(
            "/api/auth/login",
            headers={"Origin": "https://untrusted.example"},
            json={
                "email": "patient@test.local",
                "password": "test-password-123",
            },
        ).status_code
        == 403
    )
    for _ in range(10):
        assert (
            client.post(
                "/api/auth/login", json={"email": "bad@test.local", "password": "bad"}
            ).status_code
            == 401
        )
    assert (
        client.post(
            "/api/auth/login", json={"email": "bad@test.local", "password": "bad"}
        ).status_code
        == 429
    )


def test_delete_and_expiration(setup, image_bytes, answers):
    client, factory, storage, _ = setup
    login(client)
    record = create(client, image_bytes, answers).json()
    assert client.delete(f"/api/records/{record['id']}").status_code == 204
    assert list(storage.root.iterdir()) == []
    assert client.get(f"/api/records/{record['id']}").status_code == 404
    record = create(client, image_bytes, answers).json()
    with factory() as db:
        row = db.get(Record, record["id"])
        row.expires_at = utcnow() - timedelta(days=1)
        db.commit()
    assert client.get("/api/records").json()["total"] == 0
    assert client.get(f"/api/records/{record['id']}/image").status_code == 404


def test_filters_and_unknown_answers(setup, image_bytes, answers):
    client, _, _, _ = setup
    login(client)
    answers.update(fever=True, pain=None)
    created = create(client, image_bytes, answers).json()
    assert created["priority"] == "alerta"
    assert created["questionnaire"]["pain"] is None
    assert client.get("/api/records?priority=alerta").json()["total"] == 1
    assert client.get("/api/records?priority=normal").json()["total"] == 0
    assert client.get("/api/records?from_date=2026-05-01&to_date=2026-01-01").status_code == 422
    assert client.get("/api/records?offset=-1").status_code == 422


def test_openapi(setup):
    client, _, _, _ = setup
    schema = client.get("/openapi.json").json()
    assert "/api/records/{record_id}/reviews" in schema["paths"]
