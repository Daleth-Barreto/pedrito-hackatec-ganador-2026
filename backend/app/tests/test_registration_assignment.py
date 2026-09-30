import pytest
from sqlalchemy import select

from app.core.config import get_settings
from app.models.entities import Assignment, User
from app.tests.conftest import create, login

PAYLOAD = {"name": "Paciente nuevo", "email": "new@test.local", "password": "test-password-123"}


def test_new_patient_record_reaches_only_configured_clinician(
    setup, monkeypatch, image_bytes, answers
):
    client, factory, _, ids = setup
    monkeypatch.setattr(get_settings(), "registration_clinician_email", " clinician@test.local ")
    response = client.post("/api/auth/register", json=PAYLOAD)
    assert response.status_code == 201
    patient_id = response.json()["id"]
    assert client.post("/api/auth/register", json=PAYLOAD).status_code == 409
    with factory() as db:
        assignments = db.scalars(
            select(Assignment).where(Assignment.patient_id == patient_id)
        ).all()
        assert len(assignments) == 1
        assert assignments[0].clinician_id == ids["clinician"]
    login(client, "new")
    uploaded = create(client, image_bytes, answers)
    assert uploaded.status_code == 201
    path = f"/api/records/{uploaded.json()['id']}"
    login(client, "clinician")
    assert patient_id in [p["id"] for p in client.get("/api/patients").json()]
    assert client.get("/api/records?status=pending").json()["total"] == 1
    assert client.get(path).status_code == 200
    assert client.get(path + "/image").status_code == 200
    assert (
        client.post(
            path + "/reviews", json={"assessment": "reviewed", "note": "Revisado."}
        ).status_code
        == 201
    )
    for identity in ["unassigned", "other"]:
        login(client, identity)
        assert client.get("/api/records").json()["total"] == 0
        assert client.get(path).status_code == 404
        assert client.get(path + "/image").status_code == 404


@pytest.mark.parametrize("email", ["missing@test.local", "patient@test.local"])
def test_invalid_assignment_configuration_creates_no_account(setup, monkeypatch, email):
    client, factory, _, _ = setup
    monkeypatch.setattr(get_settings(), "registration_clinician_email", email)
    response = client.post("/api/auth/register", json=PAYLOAD)
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "registration_assignment_unavailable"
    with factory() as db:
        assert db.scalar(select(User).where(User.email == PAYLOAD["email"])) is None


def test_unconfigured_registration_does_not_grant_clinician_access(setup):
    client, factory, _, _ = setup
    response = client.post("/api/auth/register", json=PAYLOAD)
    assert response.status_code == 201
    with factory() as db:
        assert (
            db.scalar(select(Assignment).where(Assignment.patient_id == response.json()["id"]))
            is None
        )
