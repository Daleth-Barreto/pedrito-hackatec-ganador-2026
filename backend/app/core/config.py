from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    database_url: str
    secret_key: str = Field(min_length=32)
    app_env: Literal["demo", "test", "production"] = "demo"
    storage_path: Path = Path("storage")
    cors_origins: str = "http://localhost:5173"
    retention_days: int = Field(default=30, ge=1, le=365)
    session_minutes: int = Field(default=60, ge=5, le=1440)
    registration_clinician_email: str = ""
    inference_mode: Literal["demo", "unavailable"] = "demo"
    segmentation_enabled: bool = False
    segmentation_model_path: Path = Path("model_artifacts/best.pt")
    segmentation_threads: int = Field(default=2, ge=1, le=4)
    privacy_controller: str = "Pendiente de configuración y revisión"
    privacy_address: str = "Pendiente de configuración y revisión"
    privacy_contact: str = "Pendiente de configuración y revisión"
    max_upload_bytes: int = 8 * 1024 * 1024

    @field_validator("secret_key")
    @classmethod
    def reject_example(cls, value: str) -> str:
        if value.startswith("replace-"):
            raise ValueError("Configure SECRET_KEY con un secreto propio.")
        return value

    @property
    def origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
