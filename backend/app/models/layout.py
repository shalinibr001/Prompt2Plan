"""Layout request and response schemas."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


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
    label: str | None = Field(default=None, description="Optional display name")


class PlacedRoom(RoomSpec):
    """Room after constraint-based placement."""

    id: str = Field(..., description="Stable room identifier")
    x: float = Field(..., description="World X (center, meters)")
    z: float = Field(..., description="World Z (center, meters)")
    height: float = Field(default=2.8, description="Wall height in meters")


class Door(BaseModel):
    """Door opening between two connected rooms (world-space center on shared wall)."""

    model_config = ConfigDict(populate_by_name=True, ser_json_by_alias=True)

    id: str
    from_id: str = Field(..., alias="from", serialization_alias="from")
    to_id: str = Field(..., alias="to", serialization_alias="to")
    x: float
    z: float
    # Wall orientation: "x" = door faces along X (wall is vertical in plan), "z" = opposite
    axis: Literal["x", "z"] = "x"
    width: float = 0.9


class AdjacencyEdge(BaseModel):
    """Undirected connection in the circulation graph."""

    a: str
    b: str
    via: Literal["door", "open"] = "door"


class FurnitureItem(BaseModel):
    """Simple procedural furniture placed inside a room."""

    id: str
    room_id: str
    kind: str  # bed | wardrobe | sofa | table | counter | toilet | sink
    x: float
    z: float
    width: float
    length: float
    rotation_y: float = 0.0


class WindowSpec(BaseModel):
    """Exterior window on a room wall."""

    id: str
    room_id: str
    x: float
    z: float
    axis: Literal["x", "z"]
    width: float = 1.2


class GenerateLayoutRequest(BaseModel):
    prompt: str = Field(
        ...,
        min_length=3,
        max_length=500,
        examples=["2BHK house with kitchen and balcony"],
    )


class GenerateLayoutResponse(BaseModel):
    prompt: str
    rooms: list[PlacedRoom]
    doors: list[Door] = Field(default_factory=list)
    adjacency: list[AdjacencyEdge] = Field(default_factory=list)
    furniture: list[FurnitureItem] = Field(default_factory=list)
    windows: list[WindowSpec] = Field(default_factory=list)
    bounds: dict[str, float]
    source: Literal["ollama", "gemini", "fallback"]
    sample: bool = False
    id: str | None = None  # set when persisted


class SavePlanRequest(BaseModel):
    prompt: str
    rooms: list[PlacedRoom]
    doors: list[Door] = Field(default_factory=list)
    adjacency: list[AdjacencyEdge] = Field(default_factory=list)
    furniture: list[FurnitureItem] = Field(default_factory=list)
    windows: list[WindowSpec] = Field(default_factory=list)
    bounds: dict[str, float]
    source: str = "fallback"


class SavePlanResponse(BaseModel):
    id: str
    url: str
