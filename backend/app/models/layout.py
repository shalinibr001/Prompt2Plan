"""Layout request and response schemas."""

from typing import Literal

from pydantic import BaseModel, Field


# Supported room categories for the MVP (rectangular rooms only).
RoomType = Literal[
    "bedroom",
    "kitchen",
    "hall",
    "living",
    "bathroom",
    "balcony",
    "dining",
    "office",
    "closet",
    "utility",
    "garage",
    "other",
]


class RoomSpec(BaseModel):
    """Room dimensions produced by the LLM (before placement)."""

    type: RoomType = Field(..., description="Semantic room category")
    width: float = Field(..., gt=0, le=30, description="Width in meters")
    length: float = Field(..., gt=0, le=30, description="Length/depth in meters")
    label: str | None = Field(
        default=None,
        description="Optional display name (e.g. 'Master Bedroom')",
    )


class PlacedRoom(RoomSpec):
    """Room after grid-based layout placement."""

    id: str = Field(..., description="Stable room identifier")
    x: float = Field(..., description="World X position (meters, room center)")
    z: float = Field(..., description="World Z position (meters, room center)")
    height: float = Field(default=2.8, description="Wall height in meters")


class GenerateLayoutRequest(BaseModel):
    """POST /generate-layout body."""

    prompt: str = Field(
        ...,
        min_length=3,
        max_length=500,
        examples=["2BHK house with kitchen and balcony"],
        description="Natural language description of the desired floor plan",
    )


class GenerateLayoutResponse(BaseModel):
    """Structured floor-plan layout returned to the frontend."""

    prompt: str
    rooms: list[PlacedRoom]
    bounds: dict[str, float] = Field(
        ...,
        description="Overall layout AABB: min_x, max_x, min_z, max_z, width, depth",
    )
    source: Literal["ollama", "gemini", "fallback"] = Field(
        ...,
        description="Which backend generated the room list",
    )
    sample: bool = Field(
        default=False,
        description="True when a deterministic sample was used (LLM unavailable)",
    )
