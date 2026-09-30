import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


def new_id() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    email: Mapped[str] = mapped_column(String(254), unique=True)
    name: Mapped[str] = mapped_column(String(100))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(16))
    is_demo: Mapped[bool] = mapped_column(default=False)


class Assignment(Base):
    __tablename__ = "assignments"
    clinician_id: Mapped[str] = mapped_column(ForeignKey("users.id"), primary_key=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("users.id"), primary_key=True)


class Session(Base):
    __tablename__ = "sessions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Consent(Base):
    __tablename__ = "consents"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    patient_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    version: Mapped[str] = mapped_column(String(20))
    accepted: Mapped[bool] = mapped_column(default=True)
    accepted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Record(Base):
    __tablename__ = "records"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    patient_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    consent_id: Mapped[str] = mapped_column(ForeignKey("consents.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, index=True
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    questionnaire: Mapped[dict] = mapped_column(JSON)
    image_key: Mapped[str] = mapped_column(String(40))
    image_metadata: Mapped[dict] = mapped_column(JSON)
    inference: Mapped[dict] = mapped_column(JSON)
    priority: Mapped[str | None] = mapped_column(String(16), nullable=True, index=True)
    reasons: Mapped[list] = mapped_column(JSON)
    rules_version: Mapped[str] = mapped_column(String(20), default="prototype-v1")


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (UniqueConstraint("record_id"),)
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    record_id: Mapped[str] = mapped_column(ForeignKey("records.id", ondelete="CASCADE"))
    clinician_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    assessment: Mapped[str] = mapped_column(String(30))
    note: Mapped[str] = mapped_column(Text)


class VisualConsent(Base):
    __tablename__ = "visual_consents"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    record_id: Mapped[str] = mapped_column(
        ForeignKey("records.id", ondelete="CASCADE"), index=True
    )
    accepted: Mapped[bool]
    version: Mapped[str] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class VisualAnalysis(Base):
    __tablename__ = "visual_analyses"
    record_id: Mapped[str] = mapped_column(
        ForeignKey("records.id", ondelete="CASCADE"), primary_key=True
    )
    consent_id: Mapped[str] = mapped_column(ForeignKey("visual_consents.id", ondelete="CASCADE"))
    result: Mapped[dict] = mapped_column(JSON)
