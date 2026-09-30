"""Run daily from an external scheduler to enforce physical retention."""

from sqlalchemy import select

from app.core.db import SessionLocal
from app.models.entities import Record, utcnow
from app.services.records import delete_record
from app.storage.local import get_storage


def purge() -> int:
    count = 0
    storage = get_storage()
    with SessionLocal() as db:
        records = db.scalars(select(Record).where(Record.expires_at <= utcnow())).all()
        for record in records:
            delete_record(db, record, storage)
            count += 1
    return count


if __name__ == "__main__":
    print(f"Registros vencidos eliminados: {purge()}")
