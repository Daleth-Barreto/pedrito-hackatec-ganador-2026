"""Local operator CLI; request contents require an explicit show operation."""

import argparse
from datetime import timedelta

from sqlalchemy import select

from app.core.db import SessionLocal
from app.models.entities import User, utcnow
from app.models.privacy import PrivacyRequest
from app.services.account import erase_account
from app.storage.local import get_storage


def main():
    parser = argparse.ArgumentParser(description="Operación local de solicitudes de privacidad")
    parser.add_argument("action", choices=["list", "show", "respond", "erase"])
    parser.add_argument("--id")
    parser.add_argument(
        "--status", choices=["in_review", "needs_information", "resolved", "rejected"]
    )
    parser.add_argument("--response-file", type=argparse.FileType("r", encoding="utf-8"))
    args = parser.parse_args()
    with SessionLocal() as db:
        if args.action == "list":
            for item in db.scalars(select(PrivacyRequest).order_by(PrivacyRequest.created_at)):
                print(item.id, item.kind, item.status, item.created_at.isoformat())
            return
        item = db.get(PrivacyRequest, args.id)
        if not item:
            parser.error("Solicitud inexistente")
        if args.action == "show":
            print("Folio:", item.id)
            print("Cuenta:", item.patient_id)
            print("Tipo y estado:", item.kind, item.status)
            print("Solicitud:", item.details)
            print("Respuesta:", item.response)
            return
        if args.action == "erase":
            if item.kind != "account_deletion" or item.status != "received":
                parser.error("Se requiere una solicitud de eliminación pendiente")
            if item.created_at.replace(tzinfo=utcnow().tzinfo) + timedelta(hours=24) > utcnow():
                parser.error("Espera 24 horas para permitir la cancelación")
            open_arco = db.scalar(
                select(PrivacyRequest).where(
                    PrivacyRequest.patient_id == item.patient_id,
                    PrivacyRequest.kind != "account_deletion",
                    PrivacyRequest.status.in_(["received", "in_review", "needs_information"]),
                )
            )
            if open_arco:
                parser.error("Resuelve las solicitudes ARCO pendientes antes de eliminar")
            erase_account(db, db.get(User, item.patient_id), get_storage())
            print("Eliminación completada")
        else:
            if item.kind == "account_deletion":
                parser.error("Usa erase para ejecutar la eliminación; no se simula su resolución")
            if not args.status or not args.response_file:
                parser.error("Indica --status y --response-file")
            response = args.response_file.read(3001).strip()
            if not 10 <= len(response) <= 3000:
                parser.error("La respuesta debe tener entre 10 y 3000 caracteres")
            item.status, item.response, item.updated_at = args.status, response, utcnow()
            db.commit()
            print("Respuesta registrada; el titular puede consultarla en su cuenta")


if __name__ == "__main__":
    main()
