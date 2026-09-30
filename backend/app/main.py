import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from starlette.exceptions import HTTPException

from app.api import account, auth, patients, records, segmentation
from app.core.body_limit import BodyLimitMiddleware
from app.core.config import get_settings
from app.core.db import SessionLocal
from app.core.errors import AppError

settings = get_settings()
app = FastAPI(
    title="KINEVA · Seguimiento de Heridas Postamputación",
    version="0.1.0",
    description="Seguimiento de heridas. No es un dispositivo diagnóstico.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "X-Requested-With"],
)
logger = logging.getLogger("seguimiento")
app.add_middleware(BodyLimitMiddleware, max_bytes=settings.max_upload_bytes + 65536)


def error(status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(status_code=status, content={"error": {"code": code, "message": message}})


@app.middleware("http")
async def protections(request: Request, call_next):
    if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
        if request.headers.get("x-requested-with") != "Seguimiento":
            return error(
                403, "csrf_required", "Falta la protección de solicitud. Recarga la página."
            )
        origin = request.headers.get("origin")
        if origin and origin not in settings.origins:
            return error(403, "origin_forbidden", "Origen de solicitud no autorizado.")
        if request.headers.get("sec-fetch-site") == "cross-site":
            return error(403, "origin_forbidden", "Solicitud entre sitios no autorizada.")
        length = request.headers.get("content-length", "0")
        if not length.isdigit() or int(length) > settings.max_upload_bytes + 65536:
            return error(413, "request_too_large", "El envío supera el tamaño permitido.")
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    return response


@app.exception_handler(AppError)
async def app_error(request: Request, exc: AppError):
    return error(exc.status, exc.code, exc.message)


@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, exc: RequestValidationError):
    return error(422, "validation_error", "Revisa los campos enviados y sus formatos.")


@app.exception_handler(HTTPException)
async def http_error(request: Request, exc: HTTPException):
    return error(exc.status_code, "request_error", "No se pudo procesar la solicitud.")


@app.exception_handler(Exception)
async def unexpected_error(request: Request, exc: Exception):
    logger.error("Unhandled application error: %s", type(exc).__name__)
    return error(500, "internal_error", "No pudimos completar la operación. Intenta de nuevo.")


@app.get("/api/health", tags=["Sistema"])
def health():
    try:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
        return {
            "status": "ok",
            "environment": settings.app_env,
            "inference": settings.inference_mode,
        }
    except Exception:
        raise AppError(503, "database_unavailable", "El servicio no está disponible.") from None


for router in (auth.router, patients.router, records.router, account.router, segmentation.router):
    app.include_router(router, prefix="/api")
