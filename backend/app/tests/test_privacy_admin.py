from datetime import timedelta

import pytest

from app import privacy_admin
from app.models.entities import User, utcnow
from app.models.privacy import PrivacyRequest
from app.tests.conftest import login


def test_operator_response_is_visible_to_owner(setup, monkeypatch, tmp_path):
    client, factory, _, _ = setup
    login(client)
    item = client.post(
        "/api/privacy/requests",
        json={
            "kind": "rectification",
            "details": "Solicito corregir el nombre registrado",
            "current_password": "test-password-123",
        },
    ).json()
    response = tmp_path / "response.txt"
    response.write_text(
        "Petición recibida; el operador revisará los datos indicados.", encoding="utf-8"
    )
    monkeypatch.setattr(privacy_admin, "SessionLocal", factory)
    monkeypatch.setattr(
        "sys.argv",
        [
            "privacy_admin",
            "respond",
            "--id",
            item["id"],
            "--status",
            "in_review",
            "--response-file",
            str(response),
        ],
    )
    privacy_admin.main()
    result = client.get("/api/privacy/requests").json()[0]
    assert result["status"] == "in_review"
    assert result["response"] == response.read_text(encoding="utf-8")


def test_erase_requires_grace_period_and_closed_arco(setup, monkeypatch):
    client, factory, storage, ids = setup
    login(client)
    deletion = client.post(
        "/api/account/deletion",
        json={
            "confirmation": "ELIMINAR MI CUENTA",
            "current_password": "test-password-123",
        },
    ).json()
    monkeypatch.setattr(privacy_admin, "SessionLocal", factory)
    monkeypatch.setattr(privacy_admin, "get_storage", lambda: storage)
    monkeypatch.setattr("sys.argv", ["privacy_admin", "erase", "--id", deletion["id"]])
    with pytest.raises(SystemExit):
        privacy_admin.main()
    with factory() as db:
        db.get(PrivacyRequest, deletion["id"]).created_at = utcnow() - timedelta(days=2)
        arco = PrivacyRequest(patient_id=ids["patient"], kind="access", details="Datos de prueba")
        db.add(arco)
        db.commit()
        arco_id = arco.id
    with pytest.raises(SystemExit):
        privacy_admin.main()
    with factory() as db:
        assert db.get(User, ids["patient"]) is not None
        db.get(PrivacyRequest, arco_id).status = "resolved"
        db.commit()
    privacy_admin.main()
    assert client.get("/api/auth/me").status_code == 401
