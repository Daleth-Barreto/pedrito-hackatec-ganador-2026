import io
import os

os.environ.setdefault("SECRET_KEY", "test-secret-only-not-for-deployment-123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ["APP_ENV"] = "test"
os.environ["REGISTRATION_CLINICIAN_EMAIL"] = ""

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from PIL import Image, ImageDraw  # noqa: E402
from sqlalchemy import create_engine, event  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.api.auth import attempts  # noqa: E402
from app.core.db import Base, get_db  # noqa: E402
from app.core.security import passwords  # noqa: E402
from app.main import app  # noqa: E402
from app.models.entities import Assignment, User  # noqa: E402
from app.storage.local import LocalStorage, get_storage  # noqa: E402


@pytest.fixture
def setup(tmp_path):
    test_url = os.environ.get("TEST_DATABASE_URL", "sqlite://")
    kwargs = (
        {}
        if not test_url.startswith("sqlite")
        else {
            "connect_args": {"check_same_thread": False},
            "poolclass": StaticPool,
        }
    )
    engine = create_engine(test_url, **kwargs)
    if test_url.startswith("sqlite"):

        @event.listens_for(engine, "connect")
        def foreign_keys(connection, record):
            connection.execute("PRAGMA foreign_keys=ON")

    Base.metadata.create_all(engine)
    factory = sessionmaker(engine, expire_on_commit=False)
    with factory() as db:
        hashed = passwords.hash("test-password-123")
        users = [
            User(
                email=f"{name}@test.local", name=name, role=role, password_hash=hashed, is_demo=True
            )
            for name, role in [
                ("patient", "patient"),
                ("other", "patient"),
                ("clinician", "clinician"),
                ("unassigned", "clinician"),
            ]
        ]
        db.add_all(users)
        db.flush()
        db.add(Assignment(clinician_id=users[2].id, patient_id=users[0].id))
        db.commit()
        ids = {user.name: user.id for user in users}
    storage = LocalStorage(tmp_path / "images")

    def override_db():
        with factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_storage] = lambda: storage
    attempts.clear()
    with TestClient(app, headers={"X-Requested-With": "Seguimiento"}) as client:
        yield client, factory, storage, ids
    app.dependency_overrides.clear()
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def image_bytes():
    image = Image.new("RGB", (640, 480), "#d5e5d1")
    draw = ImageDraw.Draw(image)
    draw.rectangle((60, 60, 540, 400), fill="#538479")
    draw.text((100, 200), "SYNTHETIC TEST - NOT A PATIENT", fill="white")
    content = io.BytesIO()
    image.save(content, "PNG")
    return content.getvalue()


@pytest.fixture
def answers():
    return {
        "photo_date": "2026-01-01",
        "pain": 1,
        "increased_pain": False,
        "fever": False,
        "discharge": False,
        "odor": False,
        "wound_opening": False,
        "changes": "none",
        "changes_description": "",
    }


def login(client, name="patient"):
    response = client.post(
        "/api/auth/login",
        json={
            "email": f"{name}@test.local",
            "password": "test-password-123",
        },
    )
    assert response.status_code == 200
    return response


def create(client, image_bytes, answers):
    import json

    consent = client.post("/api/consents", json={"accepted": True, "version": "2"}).json()
    return client.post(
        "/api/records",
        data={
            "payload": json.dumps(
                {
                    "consent_id": consent["id"],
                    "questionnaire": answers,
                }
            )
        },
        files={"image": ("test.png", image_bytes, "image/png")},
    )
