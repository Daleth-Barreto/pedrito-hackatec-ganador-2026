from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class AccountInput(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Reauthenticate(AccountInput):
    current_password: str = Field(min_length=1, max_length=200)


class ProfileInput(Reauthenticate):
    name: str = Field(min_length=2, max_length=100)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value):
        value = value.strip()
        if len(value) < 2:
            raise ValueError("Escribe tu nombre.")
        return value


class RegisterInput(AccountInput):
    name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=3, max_length=254, pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
    password: str = Field(min_length=12, max_length=200)

    @field_validator("name", "email")
    @classmethod
    def clean(cls, value):
        value = value.strip()
        if len(value) < 2:
            raise ValueError("Valor inválido")
        return value


class PasswordInput(Reauthenticate):
    new_password: str = Field(min_length=12, max_length=200)


class PrivacyInput(Reauthenticate):
    kind: Literal["access", "rectification", "cancellation", "opposition"]
    details: str = Field(min_length=10, max_length=3000)


class DeletionInput(Reauthenticate):
    confirmation: Literal["ELIMINAR MI CUENTA"]


class PrivacyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    kind: str
    details: str
    status: str
    response: str
    created_at: datetime
    verified_at: datetime
    updated_at: datetime
