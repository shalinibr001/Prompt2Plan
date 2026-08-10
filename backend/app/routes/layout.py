"""Layout generation endpoints."""

from fastapi import APIRouter, HTTPException

from app.models.layout import GenerateLayoutRequest, GenerateLayoutResponse
from app.services.layout_engine import arrange_rooms, compute_bounds
from app.services.llm import LayoutLLMService

router = APIRouter(tags=["layout"])

# Sample prompts exposed to the frontend for quick demos.
SAMPLE_PROMPTS = [
    "2 bedroom house with kitchen and hall",
    "2BHK house with kitchen and balcony",
    "Studio apartment with kitchenette and bathroom",
    "3BHK family home with living room, dining, and two bathrooms",
    "Open plan loft with living, kitchen, office, and balcony",
]


@router.post("/generate-layout", response_model=GenerateLayoutResponse)
async def generate_layout(body: GenerateLayoutRequest) -> GenerateLayoutResponse:
    """Convert a natural-language prompt into a placed 3D floor-plan layout."""
    prompt = body.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    # Stateless service — cheap to construct; keeps route free of global mutable state.
    llm = LayoutLLMService()
    room_specs, source = await llm.generate_rooms(prompt)
    placed = arrange_rooms(room_specs)
    bounds = compute_bounds(placed)

    return GenerateLayoutResponse(
        prompt=prompt,
        rooms=placed,
        bounds=bounds,
        source=source,
        sample=source == "fallback",
    )


@router.get("/sample-prompts")
async def sample_prompts() -> dict[str, list[str]]:
    """Return curated example prompts for the UI."""
    return {"prompts": SAMPLE_PROMPTS}
