"""Explicit demonstration accounts only; never called automatically at application start."""

import os

from dotenv import load_dotenv
from sqlalchemy import select

from app.core.config import get_settings
from app.core.db import SessionLocal
from app.core.security import passwords
from app.models.entities import Assignment, User


def seed():
    load_dotenv(override=False)
    if get_settings().app_env != "demo":
        raise SystemExit("El sembrado solo está permitido con APP_ENV=demo.")
    password = os.environ.get("DEMO_PASSWORD", "")
    if len(password) < 12 or password.startswith("replace-"):
        raise SystemExit("Configura DEMO_PASSWORD de al menos 12 caracteres.")
    with SessionLocal() as db:
        users = []
        for email, name, role in [
            ("paciente@demo.local", "Paciente de demostración", "patient"),
            ("salud@demo.local", "Profesional de demostración", "clinician"),
            ("otro@demo.local", "Segundo paciente de demostración", "patient"),
        ]:
            user = db.scalar(select(User).where(User.email == email))
            if not user:
                user = User(
                    email=email,
                    name=name,
                    role=role,
                    is_demo=True,
                    password_hash=passwords.hash(password),
                )
                db.add(user)
                db.flush()
            elif not user.is_demo:
                raise SystemExit("Existe una cuenta no demo con este correo; operación cancelada.")
            users.append(user)
        if not db.get(Assignment, (users[1].id, users[0].id)):
            db.add(Assignment(clinician_id=users[1].id, patient_id=users[0].id))
        db.commit()
    print("Cuentas demo listas. No se crearon fotografías ni registros ficticios.")


if __name__ == "__main__":
    seed()
