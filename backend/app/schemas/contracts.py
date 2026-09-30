from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

Priority = Literal["normal", "vigilancia", "alerta"]


class StrictSchema(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class LoginIn(StrictSchema):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=False)
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=200)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    email: str
    name: str
    role: Literal["patient", "clinician"]
    is_demo: bool


class ConsentIn(StrictSchema):
    accepted: bool
    version: Literal["2"]


class ConsentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    version: str
    accepted_at: datetime
    accepted: bool


class Questionnaire(StrictSchema):
    photo_date: date
    pain: int | None = Field(ge=0, le=10)
    increased_pain: bool | None
    fever: bool | None
    discharge: bool | None
    odor: bool | None
    wound_opening: bool | None
    changes: Literal["none", "changed", "unknown"]
    changes_description: str = Field(default="", max_length=1000)

    @field_validator("photo_date")
    @classmethod
    def not_future(cls, value: date) -> date:
        if value > date.today():
            raise ValueError("La fecha de la fotografía no puede ser futura.")
        return value

    @model_validator(mode="after")
    def describe_changes(self):
        if self.changes == "changed" and not self.changes_description:
            raise ValueError("Describe los cambios observados.")
        return self


class RecordIn(StrictSchema):
    consent_id: UUID
    questionnaire: Questionnaire


class ReviewIn(StrictSchema):
    assessment: Literal["reviewed", "follow_up", "contact_needed"]
    note: str = Field(min_length=5, max_length=3000)


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    clinician_id: str
    created_at: datetime
    assessment: str
    note: str


class RecordSummary(BaseModel):
    id: str
    patient_id: str
    patient_name: str
    is_demo: bool
    created_at: datetime
    photo_date: date
    priority: Priority | None
    status: Literal["pending", "reviewed"]
    automatic_status: str


class RecordOut(RecordSummary):
    questionnaire: Questionnaire
    image_metadata: dict
    inference: dict
    reasons: list[str]
    rules_version: str
    expires_at: datetime
    review: ReviewOut | None
    report: dict
    patient_message: str


class RecordList(BaseModel):
    items: list[RecordSummary]
    total: int
