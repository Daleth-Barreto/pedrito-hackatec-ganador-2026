import json

from sqlalchemy import select

from app.core.security import passwords
from app.models.entities import Consent, Record, User
from app.models.privacy import PrivacyRequest
from app.services.account import erase_account
from app.tests.conftest import create, login

PASSWORD = "test-password-123"


def test_registration_password_spaces_and_argon2id(setup):
    client, factory, _, _ = setup
    secret = "  a long passphrase  "
    payload = {"email": "new@test.local", "name": "Persona demo", "password": secret}
    assert (
        client.post("/api/auth/register", json={**payload, "role": "clinician"}).status_code == 422
    )
    assert client.post("/api/auth/register", json=payload).status_code == 201
    assert client.post("/api/auth/register", json=payload).status_code == 409
    assert (
        client.post(
            "/api/auth/login", json={"email": payload["email"], "password": secret.strip()}
        ).status_code
        == 401
    )
    assert (
        client.post(
            "/api/auth/login", json={"email": payload["email"], "password": secret}
        ).status_code
        == 200
    )
    with factory() as db:
        user = db.scalar(select(User).where(User.email == payload["email"]))
        assert user.password_hash.startswith("$argon2id$")
        assert passwords.hash(secret) != user.password_hash


def test_profile_reauthentication_and_role(setup):
    client, _, _, _ = setup
    login(client)
    assert (
        client.post(
            "/api/account/profile", json={"name": "Otro nombre", "current_password": "wrong"}
        ).status_code
        == 403
    )
    assert (
        client.post(
            "/api/account/profile",
            json={"name": "Nombre actualizado", "current_password": PASSWORD},
        ).status_code
        == 200
    )
    assert client.get("/api/auth/me").json()["name"] == "Nombre actualizado"
    login(client, "clinician")
    assert (
        client.post(
            "/api/account/profile", json={"name": "Nombre", "current_password": PASSWORD}
        ).status_code
        == 403
    )


def test_password_change_revokes_all_sessions(setup):
    client, _, _, _ = setup
    login(client)
    assert (
        client.post(
            "/api/account/password",
            json={"current_password": PASSWORD, "new_password": "a-new-password-123"},
        ).status_code
        == 204
    )
    assert client.get("/api/auth/me").status_code == 401
    assert (
        client.post(
            "/api/auth/login", json={"email": "patient@test.local", "password": PASSWORD}
        ).status_code
        == 401
    )
    assert (
        client.post(
            "/api/auth/login",
            json={"email": "patient@test.local", "password": "a-new-password-123"},
        ).status_code
        == 200
    )


def test_arco_owner_isolation_and_status(setup):
    client, factory, _, _ = setup
    login(client)
    data = {"kind": "access", "details": "Quiero conocer mis datos", "current_password": PASSWORD}
    assert (
        client.post("/api/privacy/requests", json={**data, "current_password": "bad"}).status_code
        == 403
    )
    result = client.post("/api/privacy/requests", json=data)
    assert result.status_code == 201
    item = result.json()
    assert item["verified_at"] and item["status"] == "received"
    with factory() as db:
        request = db.get(PrivacyRequest, item["id"])
        request.status, request.response = "in_review", "Revisión por el operador"
        db.commit()
    assert client.get("/api/privacy/requests").json()[0]["status"] == "in_review"
    login(client, "other")
    assert client.get("/api/privacy/requests").json() == []
    login(client, "clinician")
    assert client.get("/api/privacy/requests").status_code == 403


def test_revocation_blocks_old_consent(setup, image_bytes, answers):
    client, factory, storage, _ = setup
    login(client)
    accepted = client.post("/api/consents", json={"accepted": True, "version": "2"}).json()
    assert client.post("/api/consents", json={"accepted": False, "version": "2"}).status_code == 201
    assert client.get("/api/consents/current").json()["accepted"] is False
    response = client.post(
        "/api/records",
        data={"payload": json.dumps({"consent_id": accepted["id"], "questionnaire": answers})},
        files={"image": ("image.png", image_bytes, "image/png")},
    )
    assert response.status_code == 422
    assert not list(storage.root.iterdir())
    with factory() as db:
        assert len(db.scalars(select(Consent)).all()) == 2


def test_deletion_confirmation_cancel_and_purge(setup, image_bytes, answers):
    client, factory, storage, ids = setup
    login(client)
    assert create(client, image_bytes, answers).status_code == 201
    payload = {"confirmation": "ELIMINAR MI CUENTA", "current_password": PASSWORD}
    assert (
        client.post("/api/account/deletion", json={**payload, "confirmation": "yes"}).status_code
        == 422
    )
    assert client.post("/api/account/deletion", json=payload).status_code == 201
    assert create(client, image_bytes, answers).status_code == 409
    assert client.post("/api/account/deletion/cancel").status_code == 204
    assert create(client, image_bytes, answers).status_code == 201
    with factory() as db:
        erase_account(db, db.get(User, ids["patient"]), storage)
        assert db.get(User, ids["patient"]) is None
        assert not db.scalars(select(Record)).all()
    assert not list(storage.root.iterdir())
    assert client.get("/api/auth/me").status_code == 401


def test_mutation_requires_csrf_header(setup):
    client, _, _, _ = setup
    login(client)
    client.headers.pop("X-Requested-With")
    assert client.post("/api/consents", json={"accepted": True, "version": "2"}).status_code == 403
    assert client.get("/api/privacy/notice").status_code == 200
