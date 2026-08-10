"""Layout generation + persistence endpoints."""

from fastapi import APIRouter, HTTPException, Query

from app.models.layout import (
    GenerateLayoutRequest,
    GenerateLayoutResponse,
    PlanVersionsResponse,
    PlanVersionSummary,
    SavePlanRequest,
    SavePlanResponse,
)
from app.services.graph_layout import (
    arrange_rooms_graph,
    graph_edges_to_adjacency,
    pipeline_to_dicts,
)
from app.services.layout_engine import (
    build_doors_and_adjacency,
    compute_bounds,
    place_furniture,
    place_windows,
)
from app.services.llm import LayoutLLMService
from app.services.store import get_plan, list_versions, save_plan

router = APIRouter(tags=["layout"])

SAMPLE_PROMPTS = [
    "2 bedroom house with kitchen and hall",
    "2BHK house with kitchen and balcony",
    "Studio apartment with kitchenette and bathroom",
    "3BHK family home with living room, dining, and two bathrooms",
    "Open plan loft with living, kitchen, office, and balcony",
    "2-storey duplex with 3 bedrooms and upstairs bathroom",
]


def _build_full_layout(prompt: str, room_specs, source: str, sample: bool) -> GenerateLayoutResponse:
    placed, steps, graph = arrange_rooms_graph(room_specs, prompt=prompt)
    doors, door_adj = build_doors_and_adjacency(placed)
    # Merge geometric doors with program-graph adjacency (union).
    prog_adj = graph_edges_to_adjacency(graph, placed)
    seen = {(min(e.a, e.b), max(e.a, e.b)) for e in door_adj}
    adjacency = list(door_adj)
    for e in prog_adj:
        key = (min(e.a, e.b), max(e.a, e.b))
        if key not in seen:
            adjacency.append(e)
            seen.add(key)

    furniture = place_furniture(placed)
    windows = place_windows(placed, doors)
    bounds = compute_bounds(placed)
    floors = max((r.floor for r in placed), default=0) + 1
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
        floors=floors,
        pipeline=pipeline_to_dicts(steps),  # type: ignore[arg-type]
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
    plan_id = body.plan_id
    # Don't persist the plan_id field inside nested payload twice awkwardly
    payload.pop("plan_id", None)
    new_id, version = save_plan(payload, plan_id=plan_id)
    return SavePlanResponse(id=new_id, url=f"/plan/{new_id}", version=version)


@router.get("/plan/{plan_id}", response_model=GenerateLayoutResponse)
async def load_plan(
    plan_id: str,
    version: int | None = Query(default=None),
) -> GenerateLayoutResponse:
    data = get_plan(plan_id, version=version)
    if not data:
        raise HTTPException(status_code=404, detail="Plan not found")
    data["id"] = plan_id
    data.setdefault("doors", [])
    data.setdefault("adjacency", [])
    data.setdefault("furniture", [])
    data.setdefault("windows", [])
    data.setdefault("sample", False)
    data.setdefault("floors", 1)
    data.setdefault("pipeline", [])
    return GenerateLayoutResponse(**data)


@router.get("/plan/{plan_id}/versions", response_model=PlanVersionsResponse)
async def plan_versions(plan_id: str) -> PlanVersionsResponse:
    versions = list_versions(plan_id)
    if not versions and not get_plan(plan_id):
        raise HTTPException(status_code=404, detail="Plan not found")
    return PlanVersionsResponse(
        id=plan_id,
        versions=[PlanVersionSummary(**v) for v in versions],
    )
