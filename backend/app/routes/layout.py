"""Layout generation + persistence endpoints."""

from fastapi import APIRouter, HTTPException

from app.models.layout import (
    GenerateLayoutRequest,
    GenerateLayoutResponse,
    SavePlanRequest,
    SavePlanResponse,
)
from app.services.layout_engine import (
    arrange_rooms,
    build_doors_and_adjacency,
    compute_bounds,
    place_furniture,
    place_windows,
)
from app.services.llm import LayoutLLMService
from app.services.store import get_plan, save_plan

router = APIRouter(tags=["layout"])

SAMPLE_PROMPTS = [
    "2 bedroom house with kitchen and hall",
    "2BHK house with kitchen and balcony",
    "Studio apartment with kitchenette and bathroom",
    "3BHK family home with living room, dining, and two bathrooms",
    "Open plan loft with living, kitchen, office, and balcony",
]


def _build_full_layout(prompt: str, room_specs, source: str, sample: bool) -> GenerateLayoutResponse:
    placed = arrange_rooms(room_specs)
    doors, adjacency = build_doors_and_adjacency(placed)
    furniture = place_furniture(placed)
    windows = place_windows(placed, doors)
    bounds = compute_bounds(placed)
    return GenerateLayoutResponse(
        prompt=prompt,
        rooms=placed,
        doors=doors,
        adjacency=adjacency,
        furniture=furniture,
        windows=windows,
        bounds=bounds,
        source=source,  # type: ignore[arg-type]
        sample=sample,
    )


@router.post("/generate-layout", response_model=GenerateLayoutResponse)
async def generate_layout(body: GenerateLayoutRequest) -> GenerateLayoutResponse:
    prompt = body.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    llm = LayoutLLMService()
    room_specs, source = await llm.generate_rooms(prompt)
    return _build_full_layout(prompt, room_specs, source, sample=source == "fallback")


@router.get("/sample-prompts")
async def sample_prompts() -> dict[str, list[str]]:
    return {"prompts": SAMPLE_PROMPTS}


@router.post("/save-plan", response_model=SavePlanResponse)
async def save_plan_route(body: SavePlanRequest) -> SavePlanResponse:
    payload = body.model_dump(by_alias=True)
    plan_id = save_plan(payload)
    return SavePlanResponse(id=plan_id, url=f"/plan/{plan_id}")


@router.get("/plan/{plan_id}", response_model=GenerateLayoutResponse)
async def load_plan(plan_id: str) -> GenerateLayoutResponse:
    data = get_plan(plan_id)
    if not data:
        raise HTTPException(status_code=404, detail="Plan not found")
    data["id"] = plan_id
    # Ensure required fields exist for older payloads.
    data.setdefault("doors", [])
    data.setdefault("adjacency", [])
    data.setdefault("furniture", [])
    data.setdefault("windows", [])
    data.setdefault("sample", False)
    return GenerateLayoutResponse(**data)
