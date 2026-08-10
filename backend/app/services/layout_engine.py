"""Constraint-based floor-plan solver.

Produces realistic residential layouts:
- no overlapping rooms
- injects a hallway when needed for bedroom circulation
- kitchen near living/dining/hall
- bathrooms attached to bedrooms or hallway
- door openings + adjacency graph
- validation pass with collision detection
"""

from __future__ import annotations

import math
import uuid
from dataclasses import dataclass

from app.models.layout import (
    AdjacencyEdge,
    Door,
    FurnitureItem,
    PlacedRoom,
    RoomSpec,
    WindowSpec,
)

# Soft preferred neighbors (used for scoring).
ADJACENCY: dict[str, list[str]] = {
    "kitchen": ["hall", "living", "dining"],
    "dining": ["kitchen", "hall", "living"],
    "bathroom": ["bedroom", "hall", "living"],
    "balcony": ["bedroom", "living", "hall"],
    "bedroom": ["hall", "bathroom", "closet", "living"],
    "closet": ["bedroom"],
    "utility": ["kitchen"],
    "office": ["hall", "living"],
    "garage": ["hall"],
    "living": ["hall", "kitchen", "dining", "bedroom"],
    "hall": ["kitchen", "living", "bedroom", "bathroom", "dining", "office"],
}

TYPE_PRIORITY: dict[str, int] = {
    "hall": 0,
    "living": 0,
    "dining": 1,
    "kitchen": 2,
    "bedroom": 3,
    "office": 3,
    "bathroom": 4,
    "balcony": 5,
    "closet": 6,
    "utility": 6,
    "garage": 7,
    "other": 8,
}

# Circulation hubs bedrooms may attach through.
CIRCULATION = {"hall", "living"}

GRID = 0.5
GAP = 0.0
EDGE_TOL = 0.3  # tolerate small float/snap residuals when detecting shared walls
DOOR_WIDTH = 0.9
MIN_SHARED_FOR_DOOR = 0.7
MAX_GAP_TO_CLOSE = 0.55  # nudge rooms together if nearly touching


@dataclass
class _Rect:
    x: float
    z: float
    width: float
    length: float

    @property
    def min_x(self) -> float:
        return self.x - self.width / 2

    @property
    def max_x(self) -> float:
        return self.x + self.width / 2

    @property
    def min_z(self) -> float:
        return self.z - self.length / 2

    @property
    def max_z(self) -> float:
        return self.z + self.length / 2

    def overlaps(self, other: _Rect, padding: float = 0.0) -> bool:
        """True only for interior intersection. Edge-touching (shared walls) is allowed."""
        eps = 1e-6
        return not (
            self.max_x + padding <= other.min_x + eps
            or other.max_x + padding <= self.min_x + eps
            or self.max_z + padding <= other.min_z + eps
            or other.max_z + padding <= self.min_z + eps
        )

    def shared_wall(self, other: _Rect) -> tuple[float, str, float, float] | None:
        """Return (shared_length, axis, door_x, door_z) if walls touch."""
        # Vertical shared wall (constant X).
        if abs(self.max_x - other.min_x) <= EDGE_TOL:
            overlap = min(self.max_z, other.max_z) - max(self.min_z, other.min_z)
            if overlap >= MIN_SHARED_FOR_DOOR:
                mid_z = (max(self.min_z, other.min_z) + min(self.max_z, other.max_z)) / 2
                return overlap, "x", self.max_x, mid_z
        if abs(other.max_x - self.min_x) <= EDGE_TOL:
            overlap = min(self.max_z, other.max_z) - max(self.min_z, other.min_z)
            if overlap >= MIN_SHARED_FOR_DOOR:
                mid_z = (max(self.min_z, other.min_z) + min(self.max_z, other.max_z)) / 2
                return overlap, "x", self.min_x, mid_z
        # Horizontal shared wall (constant Z).
        if abs(self.max_z - other.min_z) <= EDGE_TOL:
            overlap = min(self.max_x, other.max_x) - max(self.min_x, other.min_x)
            if overlap >= MIN_SHARED_FOR_DOOR:
                mid_x = (max(self.min_x, other.min_x) + min(self.max_x, other.max_x)) / 2
                return overlap, "z", mid_x, self.max_z
        if abs(other.max_z - self.min_z) <= EDGE_TOL:
            overlap = min(self.max_x, other.max_x) - max(self.min_x, other.min_x)
            if overlap >= MIN_SHARED_FOR_DOOR:
                mid_x = (max(self.min_x, other.min_x) + min(self.max_x, other.max_x)) / 2
                return overlap, "z", mid_x, self.min_z
        return None

    def shared_wall_length(self, other: _Rect) -> float:
        hit = self.shared_wall(other)
        return hit[0] if hit else 0.0


def _snap(value: float) -> float:
    return round(value / GRID) * GRID


def _ensure_circulation(rooms: list[RoomSpec]) -> list[RoomSpec]:
    """Inject a hallway when bedrooms exist without a circulation hub."""
    types = {r.type for r in rooms}
    has_bedroom = "bedroom" in types
    has_hub = bool(types & CIRCULATION)
    if has_bedroom and not has_hub:
        rooms = list(rooms) + [
            RoomSpec(type="hall", width=5.0, length=2.2, label="Hallway")
        ]
    # Ensure kitchen has a living/hall neighbor target.
    if "kitchen" in types and not (types & {"hall", "living", "dining"}):
        if "hall" not in {r.type for r in rooms}:
            rooms = list(rooms) + [
                RoomSpec(type="hall", width=4.5, length=3.5, label="Hall")
            ]
    return rooms


def _sort_rooms(rooms: list[RoomSpec]) -> list[RoomSpec]:
    return sorted(
        rooms,
        key=lambda r: (TYPE_PRIORITY.get(r.type, 9), -(r.width * r.length)),
    )


def _slide_offsets(host_span: float, guest_span: float) -> list[float]:
    if guest_span >= host_span:
        return [0.0]
    half_diff = (host_span - guest_span) / 2
    offsets = [-half_diff, 0.0, half_diff]
    cursor = -half_diff
    while cursor <= half_diff + 1e-6:
        offsets.append(_snap(cursor))
        cursor += GRID
    seen: set[float] = set()
    unique: list[float] = []
    for o in offsets:
        key = round(o, 3)
        if key not in seen:
            seen.add(key)
            unique.append(o)
    return unique


def _candidate_positions(
    room: RoomSpec,
    placed: list[tuple[RoomSpec, _Rect]],
) -> list[tuple[float, float, int]]:
    """Candidate centers that sit flush against an existing room edge.

    Important: do NOT snap the attachment axis — snapping half-sizes that aren't
    grid-aligned creates gaps and breaks door adjacency.
    """
    if not placed:
        return [(0.0, 0.0, 0)]

    preferred = set(ADJACENCY.get(room.type, []))
    # Bedrooms strongly prefer hall/living edges.
    if room.type == "bedroom":
        preferred = preferred | CIRCULATION
    if room.type == "bathroom":
        preferred = preferred | {"bedroom", "hall"}
    if room.type == "kitchen":
        preferred = preferred | {"living", "dining", "hall"}

    candidates: list[tuple[float, float, int]] = []
    ordered = sorted(placed, key=lambda item: 0 if item[0].type in preferred else 1)
    hw, hl = room.width / 2, room.length / 2

    for spec, rect in ordered:
        tier = 0 if spec.type in preferred else 1
        # East / west of host — keep exact X contact; slide along Z on grid.
        for dz in _slide_offsets(rect.length, room.length):
            candidates.append((rect.max_x + GAP + hw, _snap(rect.z + dz), tier))
            candidates.append((rect.min_x - GAP - hw, _snap(rect.z + dz), tier))
        # North / south of host — keep exact Z contact; slide along X on grid.
        for dx in _slide_offsets(rect.width, room.width):
            candidates.append((_snap(rect.x + dx), rect.max_z + GAP + hl, tier))
            candidates.append((_snap(rect.x + dx), rect.min_z - GAP - hl, tier))

    seen: set[tuple[float, float]] = set()
    unique: list[tuple[float, float, int]] = []
    for x, z, tier in candidates:
        key = (round(x, 4), round(z, 4))
        if key not in seen:
            seen.add(key)
            unique.append((x, z, tier))
    return unique


def _fits(candidate: _Rect, occupied: list[_Rect]) -> bool:
    return all(not candidate.overlaps(other) for other in occupied)


def _aabb_area(rects: list[_Rect]) -> float:
    if not rects:
        return 0.0
    return (max(r.max_x for r in rects) - min(r.min_x for r in rects)) * (
        max(r.max_z for r in rects) - min(r.min_z for r in rects)
    )


def _touches_types(rect: _Rect, placed: list[tuple[RoomSpec, _Rect]], types: set[str]) -> bool:
    return any(rect.shared_wall_length(other) > 0 and spec.type in types for spec, other in placed)


def _score_placement(
    room: RoomSpec,
    rect: _Rect,
    placed: list[tuple[RoomSpec, _Rect]],
    tier: int,
) -> float:
    if not placed:
        return abs(rect.x) + abs(rect.z)

    preferred = set(ADJACENCY.get(room.type, []))
    occupied = [r for _, r in placed]
    area = _aabb_area([*occupied, rect])
    cx = sum(r.x for r in occupied) / len(occupied)
    cz = sum(r.z for r in occupied) / len(occupied)
    compactness = math.hypot(rect.x - cx, rect.z - cz)

    wall_score = 0.0
    adjacency_bonus = 0.0
    for spec, other in placed:
        shared = rect.shared_wall_length(other)
        if shared <= 0:
            continue
        wall_score -= shared * 2.5
        if spec.type in preferred:
            adjacency_bonus -= 10.0 + shared
        # Hard preference: bedroom must touch circulation when available.
        if room.type == "bedroom" and spec.type in CIRCULATION:
            adjacency_bonus -= 28.0
        if room.type == "bathroom" and spec.type in {"bedroom", "hall"}:
            adjacency_bonus -= 18.0
        if room.type == "kitchen" and spec.type in {"living", "dining", "hall"}:
            adjacency_bonus -= 16.0

    # Soft constraint penalties — force realistic circulation topology.
    has_circ = any(s.type in CIRCULATION for s, _ in placed)
    if room.type == "bedroom" and has_circ and not _touches_types(rect, placed, CIRCULATION):
        adjacency_bonus += 40.0
    if room.type == "bathroom" and not _touches_types(rect, placed, {"bedroom", "hall"}):
        adjacency_bonus += 30.0
    if room.type == "kitchen" and not _touches_types(rect, placed, {"living", "dining", "hall"}):
        adjacency_bonus += 30.0

    if tier >= 1 and wall_score == 0:
        wall_score += 15.0

    return area * 0.3 + compactness * 1.1 + wall_score + adjacency_bonus + tier * 4.0


def _spiral_place(room: RoomSpec, occupied: list[_Rect]) -> _Rect:
    step = GRID
    max_radius = 40
    for radius in range(0, int(max_radius / step) + 1):
        for ix in range(-radius, radius + 1):
            for iz in range(-radius, radius + 1):
                if radius > 0 and abs(ix) != radius and abs(iz) != radius:
                    continue
                rect = _Rect(_snap(ix * step), _snap(iz * step), room.width, room.length)
                if _fits(rect, occupied):
                    return rect
    return _Rect(_snap(max_radius + room.width), 0.0, room.width, room.length)


def _center_rects(rects: list[_Rect]) -> list[_Rect]:
    if not rects:
        return rects
    mid_x = (min(r.min_x for r in rects) + max(r.max_x for r in rects)) / 2
    mid_z = (min(r.min_z for r in rects) + max(r.max_z for r in rects)) / 2
    return [_Rect(r.x - mid_x, r.z - mid_z, r.width, r.length) for r in rects]


def _near_gap(a: _Rect, b: _Rect) -> tuple[str, float] | None:
    """If two rooms nearly touch on one axis with overlap on the other, return nudge."""
    x_overlap = min(a.max_x, b.max_x) - max(a.min_x, b.min_x)
    z_overlap = min(a.max_z, b.max_z) - max(a.min_z, b.min_z)

    # Separated along X, overlapping in Z → vertical shared wall candidate.
    if z_overlap >= MIN_SHARED_FOR_DOOR:
        gap_ab = b.min_x - a.max_x
        if 0 < gap_ab <= MAX_GAP_TO_CLOSE:
            return "x", gap_ab
        gap_ba = a.min_x - b.max_x
        if 0 < gap_ba <= MAX_GAP_TO_CLOSE:
            return "x", -gap_ba
    # Separated along Z, overlapping in X → horizontal shared wall candidate.
    if x_overlap >= MIN_SHARED_FOR_DOOR:
        gap_ab = b.min_z - a.max_z
        if 0 < gap_ab <= MAX_GAP_TO_CLOSE:
            return "z", gap_ab
        gap_ba = a.min_z - b.max_z
        if 0 < gap_ba <= MAX_GAP_TO_CLOSE:
            return "z", -gap_ba
    return None


def _tighten_contacts(
    placed: list[tuple[RoomSpec, _Rect]],
) -> list[tuple[RoomSpec, _Rect]]:
    """Close tiny gaps so preferred neighbors share walls (door-ready)."""
    specs = [s for s, _ in placed]
    rects = [r for _, r in placed]

    # Multiple passes — each nudge can create new near-contacts.
    for _ in range(4):
        moved = False
        for i in range(len(rects)):
            for j in range(i + 1, len(rects)):
                hit = _near_gap(rects[i], rects[j])
                if not hit:
                    continue
                axis, delta = hit
                # Prefer moving the later-placed (usually satellite) room.
                mover = j
                if axis == "x":
                    # delta > 0 means i is left of j with a gap — pull j left by delta.
                    trial = _Rect(
                        rects[mover].x - delta,
                        rects[mover].z,
                        rects[mover].width,
                        rects[mover].length,
                    )
                else:
                    trial = _Rect(
                        rects[mover].x,
                        rects[mover].z - delta,
                        rects[mover].width,
                        rects[mover].length,
                    )
                others = [rects[k] for k in range(len(rects)) if k != mover]
                if _fits(trial, others):
                    rects[mover] = trial
                    moved = True
        if not moved:
            break

    return list(zip(specs, rects))


def arrange_rooms(rooms: list[RoomSpec], wall_height: float = 2.8) -> list[PlacedRoom]:
    """Place rooms with circulation constraints; no overlaps."""
    if not rooms:
        return []

    rooms = _ensure_circulation(rooms)
    ordered = _sort_rooms(rooms)
    placed: list[tuple[RoomSpec, _Rect]] = []
    occupied: list[_Rect] = []

    for room in ordered:
        best: _Rect | None = None
        best_score = float("inf")
        candidates = _candidate_positions(room, placed)

        # For circulation-critical rooms, prefer candidates that already touch hubs.
        require_types: set[str] | None = None
        if room.type == "bedroom" and any(s.type in CIRCULATION for s, _ in placed):
            require_types = CIRCULATION
        elif room.type == "bathroom":
            require_types = {"bedroom", "hall"}
        elif room.type == "kitchen":
            require_types = {"living", "dining", "hall"}

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
                if score < best_score:
                    best_score = score
                    best = rect
            if best is not None:
                break

        if best is None:
            best = _spiral_place(room, occupied)
        occupied.append(best)
        placed.append((room, best))

    placed = _tighten_contacts(placed)
    occupied = [r for _, r in placed]
    occupied = _center_rects(occupied)
    placed = [(spec, occupied[i]) for i, (spec, _) in enumerate(placed)]

    # Validation: reject overlaps (should never happen; spiral guarantees space).
    _validate_no_collision(occupied)

    result: list[PlacedRoom] = []
    for spec, rect in placed:
        result.append(
            PlacedRoom(
                id=str(uuid.uuid4())[:8],
                type=spec.type,
                width=spec.width,
                length=spec.length,
                label=spec.label or ("Hallway" if spec.type == "hall" else spec.type.title()),
                x=round(rect.x, 3),
                z=round(rect.z, 3),
                height=wall_height,
                floor=0,
            )
        )
    return result


def _validate_no_collision(rects: list[_Rect]) -> None:
    for i, a in enumerate(rects):
        for b in rects[i + 1 :]:
            if a.overlaps(b):
                raise ValueError("Layout collision detected — solver failed validation")


def build_doors_and_adjacency(
    rooms: list[PlacedRoom],
) -> tuple[list[Door], list[AdjacencyEdge]]:
    """Create doors on shared walls between preferred/connected neighbors."""
    doors: list[Door] = []
    edges: list[AdjacencyEdge] = []
    rects = {
        r.id: _Rect(r.x, r.z, r.width, r.length)
        for r in rooms
    }
    by_id = {r.id: r for r in rooms}

    ids = list(rects.keys())
    for i, a_id in enumerate(ids):
        for b_id in ids[i + 1 :]:
            a, b = by_id[a_id], by_id[b_id]
            # Multi-floor: never cut doors between storeys even if footprints overlap.
            if getattr(a, "floor", 0) != getattr(b, "floor", 0):
                continue
            hit = rects[a_id].shared_wall(rects[b_id])
            if not hit:
                continue
            shared, axis, dx, dz = hit
            # Prefer doors between semantically related rooms.
            pref_a = set(ADJACENCY.get(a.type, []))
            pref_b = set(ADJACENCY.get(b.type, []))
            related = b.type in pref_a or a.type in pref_b or a.type in CIRCULATION or b.type in CIRCULATION
            if not related and shared < 1.5:
                continue
            door = Door(
                id=str(uuid.uuid4())[:8],
                from_id=a_id,
                to_id=b_id,
                x=round(dx, 3),
                z=round(dz, 3),
                axis=axis,  # type: ignore[arg-type]
                width=min(DOOR_WIDTH, shared * 0.8),
            )
            doors.append(door)
            edges.append(AdjacencyEdge(a=a_id, b=b_id, via="door"))

    return doors, edges


def place_furniture(rooms: list[PlacedRoom]) -> list[FurnitureItem]:
    """Rule-based furniture — basic boxes relative to room center."""
    items: list[FurnitureItem] = []
    for room in rooms:
        rid = room.id
        hw, hl = room.width / 2, room.length / 2

        def add(kind: str, lx: float, lz: float, w: float, l: float, rot: float = 0.0) -> None:
            items.append(
                FurnitureItem(
                    id=str(uuid.uuid4())[:8],
                    room_id=rid,
                    kind=kind,
                    x=round(room.x + lx, 3),
                    z=round(room.z + lz, 3),
                    width=w,
                    length=l,
                    rotation_y=rot,
                )
            )

        if room.type == "bedroom":
            add("bed", 0, -hl * 0.25, min(1.6, room.width * 0.45), min(2.0, room.length * 0.45))
            add("wardrobe", hw * 0.7, hl * 0.55, min(1.8, room.width * 0.5), 0.55)
        elif room.type in {"living", "hall"} and room.width >= 3.5:
            add("sofa", 0, hl * 0.35, min(2.2, room.width * 0.55), 0.85)
            add("table", 0, -hl * 0.15, 1.0, 0.55)
        elif room.type == "kitchen":
            add("counter", 0, -hl + 0.4, room.width * 0.85, 0.6)
            add("counter", hw - 0.35, 0, 0.6, room.length * 0.55)
        elif room.type == "dining":
            add("table", 0, 0, min(1.6, room.width * 0.45), min(1.0, room.length * 0.4))
        elif room.type == "bathroom":
            add("toilet", -hw * 0.45, hl * 0.35, 0.45, 0.65)
            add("sink", hw * 0.4, -hl * 0.4, 0.55, 0.4)
        elif room.type == "office":
            add("table", 0, -hl * 0.35, min(1.4, room.width * 0.5), 0.7)

    return items


def place_windows(rooms: list[PlacedRoom], doors: list[Door]) -> list[WindowSpec]:
    """Put one exterior window on the longest free outer edge of living rooms / bedrooms."""
    windows: list[WindowSpec] = []
    door_points = {(round(d.x, 2), round(d.z, 2)) for d in doors}

    for room in rooms:
        if room.type not in {"bedroom", "living", "kitchen", "dining", "hall"}:
            continue
        # Prefer +Z exterior edge mid-point.
        wx, wz, axis = room.x, room.z + room.length / 2, "z"
        if (round(wx, 2), round(wz, 2)) in door_points:
            wx, wz, axis = room.x + room.width / 2, room.z, "x"
        windows.append(
            WindowSpec(
                id=str(uuid.uuid4())[:8],
                room_id=room.id,
                x=round(wx, 3),
                z=round(wz, 3),
                axis=axis,  # type: ignore[arg-type]
                width=1.2,
            )
        )
    return windows


def compute_bounds(rooms: list[PlacedRoom]) -> dict[str, float]:
    if not rooms:
        return {"min_x": 0, "max_x": 0, "min_z": 0, "max_z": 0, "width": 0, "depth": 0}
    min_x = min(r.x - r.width / 2 for r in rooms)
    max_x = max(r.x + r.width / 2 for r in rooms)
    min_z = min(r.z - r.length / 2 for r in rooms)
    max_z = max(r.z + r.length / 2 for r in rooms)
    return {
        "min_x": min_x,
        "max_x": max_x,
        "min_z": min_z,
        "max_z": max_z,
        "width": max_x - min_x,
        "depth": max_z - min_z,
    }
