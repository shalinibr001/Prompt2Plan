"""Multi-step graph-based floor-plan generation.

Pipeline:
  1) Program graph  — rooms as nodes, required/preferred adjacency as edges
  2) Floor assign   — duplex / storey heuristics
  3) Layer embed    — hub-first topological layering per floor
  4) Constraint solve — flush placement (delegates to layout_engine primitives)
  5) Trace          — pipeline steps for UI / demo storytelling
"""

from __future__ import annotations

import re
import uuid
from dataclasses import dataclass, field

from app.models.layout import AdjacencyEdge, PlacedRoom, RoomSpec
from app.services.layout_engine import (
    ADJACENCY,
    CIRCULATION,
    TYPE_PRIORITY,
    _Rect,
    _center_rects,
    _tighten_contacts,
    _validate_no_collision,
    arrange_rooms as _legacy_arrange,
)


@dataclass
class GraphNode:
    key: str
    spec: RoomSpec
    floor: int = 0


@dataclass
class GraphEdge:
    a: str
    b: str
    weight: float
    kind: str  # required | preferred


@dataclass
class ProgramGraph:
    nodes: list[GraphNode] = field(default_factory=list)
    edges: list[GraphEdge] = field(default_factory=list)


@dataclass
class PipelineStep:
    name: str
    detail: str
    meta: dict


def detect_floors(prompt: str, rooms: list[RoomSpec]) -> int:
    """Infer storey count from prompt (and optional room load)."""
    p = prompt.lower()
    if re.search(r"\b(3[- ]?storey|three[- ]storey|3[- ]story|third floor)\b", p):
        return 3
    if re.search(
        r"\b(2[- ]?storey|two[- ]storey|2[- ]story|duplex|two floors|second floor|upstairs)\b",
        p,
    ):
        return 2
    # Large programs with many bedrooms → suggest duplex-like split when "floor" mentioned.
    bedrooms = sum(1 for r in rooms if r.type == "bedroom")
    if bedrooms >= 3 and "floor" in p:
        return 2
    return 1


def build_program_graph(rooms: list[RoomSpec], floors: int = 1) -> ProgramGraph:
    """Step 1–2: assign keys/floors and create weighted adjacency edges."""
    nodes: list[GraphNode] = []
    for i, spec in enumerate(rooms):
        nodes.append(GraphNode(key=f"n{i}_{spec.type}", spec=spec, floor=0))

    # Floor assignment: keep circulation + kitchen/living/dining on 0;
    # put extra bedrooms (and attached baths) upstairs when floors > 1.
    if floors >= 2:
        bedrooms = [n for n in nodes if n.spec.type == "bedroom"]
        baths = [n for n in nodes if n.spec.type == "bathroom"]
        # Keep at least one bedroom downstairs if possible.
        upstairs_beds = bedrooms[1:] if len(bedrooms) > 1 else bedrooms[:0]
        for n in upstairs_beds:
            n.floor = min(floors - 1, 1)
        # Pair bathrooms with upstairs bedrooms when available.
        for i, bath in enumerate(baths[1:] if len(baths) > 1 else []):
            if i < len(upstairs_beds):
                bath.floor = upstairs_beds[i].floor

    # Ensure each floor with bedrooms has a hall hub.
    by_floor: dict[int, list[GraphNode]] = {}
    for n in nodes:
        by_floor.setdefault(n.floor, []).append(n)

    for fl, group in list(by_floor.items()):
        types = {n.spec.type for n in group}
        if "bedroom" in types and not (types & CIRCULATION):
            hub = GraphNode(
                key=f"hall_f{fl}_{uuid.uuid4().hex[:4]}",
                spec=RoomSpec(type="hall", width=5.0, length=2.2, label=f"Hall L{fl + 1}"),
                floor=fl,
            )
            nodes.append(hub)
            by_floor[fl].append(hub)

    # Build edges: same-floor preferred neighbors + cross-type required rules.
    edges: list[GraphEdge] = []
    for i, a in enumerate(nodes):
        for b in nodes[i + 1 :]:
            if a.floor != b.floor:
                continue
            pref_a = set(ADJACENCY.get(a.spec.type, []))
            pref_b = set(ADJACENCY.get(b.spec.type, []))
            score = 0.0
            kind = "preferred"
            if b.spec.type in pref_a or a.spec.type in pref_b:
                score = 1.0
            if a.spec.type == "bedroom" and b.spec.type in CIRCULATION:
                score, kind = 2.5, "required"
            elif b.spec.type == "bedroom" and a.spec.type in CIRCULATION:
                score, kind = 2.5, "required"
            elif {a.spec.type, b.spec.type} == {"bathroom", "bedroom"}:
                score, kind = 2.0, "required"
            elif a.spec.type == "kitchen" and b.spec.type in {"living", "dining", "hall"}:
                score, kind = 2.0, "required"
            elif b.spec.type == "kitchen" and a.spec.type in {"living", "dining", "hall"}:
                score, kind = 2.0, "required"
            elif a.spec.type in CIRCULATION and b.spec.type in CIRCULATION:
                score = 1.2
            if score > 0:
                edges.append(GraphEdge(a=a.key, b=b.key, weight=score, kind=kind))

    return ProgramGraph(nodes=nodes, edges=edges)


def _layer_order(nodes: list[GraphNode], edges: list[GraphEdge]) -> list[GraphNode]:
    """Step 3: hub-first ordering using edge weights + type priority."""
    weight_sum = {n.key: 0.0 for n in nodes}
    for e in edges:
        weight_sum[e.a] = weight_sum.get(e.a, 0) + e.weight
        weight_sum[e.b] = weight_sum.get(e.b, 0) + e.weight

    return sorted(
        nodes,
        key=lambda n: (
            TYPE_PRIORITY.get(n.spec.type, 9),
            -weight_sum.get(n.key, 0),
            -(n.spec.width * n.spec.length),
        ),
    )


def _place_floor_group(nodes: list[GraphNode]) -> list[tuple[GraphNode, _Rect]]:
    """Constraint place one floor using flush edge attachment (graph order)."""
    from app.services.layout_engine import (
        _candidate_positions,
        _fits,
        _score_placement,
        _spiral_place,
        _touches_types,
    )

    ordered = _layer_order(nodes, [])  # type priority already enough; edges used in scoring
    # Rebuild edges among this floor for scoring context via placed list.
    placed: list[tuple[RoomSpec, _Rect]] = []
    occupied: list[_Rect] = []
    node_rects: list[tuple[GraphNode, _Rect]] = []

    # Local edge lookup for required neighbors
    # (full graph edges filtered by caller — pass via closure by reconstructing prefs)
    for node in ordered:
        room = node.spec
        best: _Rect | None = None
        best_score = float("inf")
        require_types: set[str] | None = None
        if room.type == "bedroom" and any(s.type in CIRCULATION for s, _ in placed):
            require_types = CIRCULATION
        elif room.type == "bathroom":
            require_types = {"bedroom", "hall"}
        elif room.type == "kitchen":
            require_types = {"living", "dining", "hall"}

        candidates = _candidate_positions(room, placed)
        for pass_idx in (0, 1):
            for cx, cz, tier in candidates:
                rect = _Rect(cx, cz, room.width, room.length)
                if not _fits(rect, occupied):
                    continue
                if (
                    pass_idx == 0
                    and require_types is not None
                    and not _touches_types(rect, placed, require_types)
                ):
                    continue
                score = _score_placement(room, rect, placed, tier)
                # Soft: prefer proximity to high-degree hubs already placed.
                if score < best_score:
                    best_score = score
                    best = rect
            if best is not None:
                break
        if best is None:
            best = _spiral_place(room, occupied)
        occupied.append(best)
        placed.append((room, best))
        node_rects.append((node, best))

    # Tighten using rect list
    fake_placed = [(n.spec, r) for n, r in node_rects]
    fake_placed = _tighten_contacts(fake_placed)
    rects = _center_rects([r for _, r in fake_placed])
    return [(node_rects[i][0], rects[i]) for i in range(len(node_rects))]


def arrange_rooms_graph(
    rooms: list[RoomSpec],
    prompt: str = "",
    wall_height: float = 2.8,
) -> tuple[list[PlacedRoom], list[PipelineStep], ProgramGraph]:
    """Full multi-step graph layout. Returns placed rooms + pipeline trace + graph."""
    steps: list[PipelineStep] = []

    floors = detect_floors(prompt, rooms)
    steps.append(
        PipelineStep(
            name="intent",
            detail=f"Parsed {len(rooms)} rooms; storeys={floors}",
            meta={"rooms": len(rooms), "floors": floors},
        )
    )

    graph = build_program_graph(rooms, floors=floors)
    steps.append(
        PipelineStep(
            name="program_graph",
            detail=f"{len(graph.nodes)} nodes, {len(graph.edges)} adjacency edges",
            meta={
                "nodes": [{"key": n.key, "type": n.spec.type, "floor": n.floor} for n in graph.nodes],
                "edges": [
                    {"a": e.a, "b": e.b, "weight": e.weight, "kind": e.kind} for e in graph.edges
                ],
            },
        )
    )

    # Place each floor separately, then offset floors in Z for visual stacking in 3D.
    by_floor: dict[int, list[GraphNode]] = {}
    for n in graph.nodes:
        by_floor.setdefault(n.floor, []).append(n)

    placed_rooms: list[PlacedRoom] = []
    for fl in sorted(by_floor.keys()):
        group = by_floor[fl]
        ordered_keys = [
            n.key
            for n in _layer_order(
                group,
                [e for e in graph.edges if e.a in {x.key for x in group}],
            )
        ]
        steps.append(
            PipelineStep(
                name="layer_embed",
                detail=f"Floor {fl}: hub-first order {', '.join(ordered_keys[:6])}",
                meta={"floor": fl, "order": ordered_keys},
            )
        )
        node_rects = _place_floor_group(group)
        rects = [r for _, r in node_rects]
        _validate_no_collision(rects)

        # Floors share plan footprint; 3D stacks them on Y via room.floor.
        for node, rect in node_rects:
            placed_rooms.append(
                PlacedRoom(
                    id=str(uuid.uuid4())[:8],
                    type=node.spec.type,
                    width=node.spec.width,
                    length=node.spec.length,
                    label=node.spec.label
                    or (
                        f"{node.spec.type.title()} L{fl + 1}"
                        if floors > 1
                        else ("Hallway" if node.spec.type == "hall" else node.spec.type.title())
                    ),
                    x=round(rect.x, 3),
                    z=round(rect.z, 3),
                    height=wall_height,
                    floor=fl,
                )
            )

        steps.append(
            PipelineStep(
                name="constraint_solve",
                detail=f"Floor {fl}: placed {len(node_rects)} rooms, collision-free",
                meta={"floor": fl, "count": len(node_rects)},
            )
        )

    # Map graph keys → room ids for later door preference (label match via order).
    # Attach key onto pipeline for UI.
    steps.append(
        PipelineStep(
            name="enrich_ready",
            detail="Ready for doors, furniture, windows",
            meta={"placed": len(placed_rooms), "floors": floors},
        )
    )

    # Safety: if somehow empty, fall back to legacy single-floor arrange.
    if not placed_rooms:
        legacy = _legacy_arrange(rooms, wall_height=wall_height)
        return legacy, steps, graph

    return placed_rooms, steps, graph


def graph_edges_to_adjacency(
    graph: ProgramGraph,
    rooms: list[PlacedRoom],
) -> list[AdjacencyEdge]:
    """Convert program-graph edges into id-based adjacency when labels/types align.

    Matching is approximate: connect first unused rooms of matching types on same floor.
    """
    unused: dict[tuple[int, str], list[PlacedRoom]] = {}
    for r in rooms:
        unused.setdefault((r.floor, r.type), []).append(r)

    key_to_room: dict[str, PlacedRoom] = {}
    for n in graph.nodes:
        bucket = unused.get((n.floor, n.spec.type)) or []
        if bucket:
            key_to_room[n.key] = bucket.pop(0)

    edges: list[AdjacencyEdge] = []
    seen: set[tuple[str, str]] = set()
    for e in graph.edges:
        ra, rb = key_to_room.get(e.a), key_to_room.get(e.b)
        if not ra or not rb:
            continue
        a, b = sorted([ra.id, rb.id])
        if (a, b) in seen:
            continue
        seen.add((a, b))
        edges.append(AdjacencyEdge(a=a, b=b, via="door" if e.kind == "required" else "open"))
    return edges


def pipeline_to_dicts(steps: list[PipelineStep]) -> list[dict]:
    return [{"name": s.name, "detail": s.detail, "meta": s.meta} for s in steps]
