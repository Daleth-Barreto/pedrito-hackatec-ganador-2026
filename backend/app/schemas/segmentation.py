from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

Coordinate = Annotated[float, Field(ge=0, allow_inf_nan=False)]
Score = Annotated[float, Field(ge=0, le=1, allow_inf_nan=False)]


class SegmentationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    limitations_acknowledged: Literal[True]


class VisualConsentRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    accepted: bool
    version: Literal["visual-1"]


class Region(BaseModel):
    technical_score: Score
    area_px: Coordinate
    image_area_percent: Annotated[float, Field(ge=0, le=100, allow_inf_nan=False)]
    bbox_xyxy: tuple[Coordinate, Coordinate, Coordinate, Coordinate]
    polygon_xy: list[tuple[Coordinate, Coordinate]] = Field(min_length=3)
    position_horizontal: Literal["izquierda", "centro", "derecha"]
    position_vertical: Literal["superior", "media", "inferior"]


class SegmentationResult(BaseModel):
    status: Literal["experimental"] = "experimental"
    model_id: str = "wound-seg-719df7a51f14"
    validated_for_postamputation: Literal[False] = False
    affects_priority: Literal[False] = False
    threshold: float = 0.35
    image_width: int
    image_height: int
    regions: list[Region]
    message: str
    limitations: list[str]
    analyzed_at: datetime | None = None


class VisualConsentStatus(BaseModel):
    accepted: bool
    version: str
    decided_at: datetime


class SegmentationState(BaseModel):
    enabled: bool
    consent: VisualConsentStatus | None
    result: SegmentationResult | None
