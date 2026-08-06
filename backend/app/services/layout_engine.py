"""Grid-based floor-plan layout engine.

Places rectangular rooms without overlap using:
- edge-aligned packing (prefer shared walls over corners)
- adjacency preferences (kitchen↔hall, bathroom↔bedroom, …)
- bounding-box compactness scoring
"""

from __future__ import annotations

import math
import uuid
from dataclasses import dataclass

from app.models.layout import PlacedRoom, RoomSpec

# Preferred neighbor types — soft placement hints.
ADJACENCY: dict[str, list[str]] = {
    "kitchen": ["hall", "living", "dining"],
    "dining": ["kitchen", "hall", "living"],
    "bathroom": ["bedroom", "hall"],
    "balcony": ["bedroom", "living", "hall"],
    "bedroom": ["hall", "bathroom", "closet"],
    "closet": ["bedroom"],
    "utility": ["kitchen"],
    "office": ["hall", "living"],
    "garage": ["hall"],
    "living": ["hall", "kitchen", "dining"],
    "hall": ["kitchen", "living", "bedroom", "bathroom"],
}

# Larger / more central rooms placed first.
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

GRID = 0.5  # snap to half-meter grid
GAP = 0.0  # shared walls (no corridor gap)
EDGE_TOL = 0.05  # tolerance for "touching" walls


@dataclass
class _Rect:
    x: float  # center
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

    def overlaps(self, other: _Rect, padding: float = 0.01) -> bool:
        return not (
            self.max_x + padding <= other.min_x
            or other.max_x + padding <= self.min_x
            or self.max_z + padding <= other.min_z
            or other.max_z + padding <= self.min_z
        )

    def shared_wall_length(self, other: _Rect) -> float:
        """Length of collinear contact between two AABBs (0 if not touching)."""
        # Vertical shared wall (same X edge).
        if abs(self.max_x - other.min_x) <= EDGE_TOL or abs(other.max_x - self.min_x) <= EDGE_TOL:
            overlap = min(self.max_z, other.max_z) - max(self.min_z, other.min_z)
            return max(0.0, overlap)
        # Horizontal shared wall (same Z edge).
        if abs(self.max_z - other.min_z) <= EDGE_TOL or abs(other.max_z - self.min_z) <= EDGE_TOL:
            overlap = min(self.max_x, other.max_x) - max(self.min_x, other.min_x)
            return max(0.0, overlap)
        return 0.0


def _snap(value: float) -> float:
    return round(value / GRID) * GRID


def _sort_rooms(rooms: list[RoomSpec]) -> list[RoomSpec]:
    return sorted(
        rooms,
        key=lambda r: (
            TYPE_PRIORITY.get(r.type, 9),
            -(r.width * r.length),
        ),
    )


def _slide_offsets(host_span: float, guest_span: float) -> list[float]:
    """Offsets along an edge so guest aligns to host start / center / end / steps."""
    if guest_span >= host_span:
        return [0.0]

    half_diff = (host_span - guest_span) / 2
    offsets = [-half_diff, 0.0, half_diff]

    # Extra snap points along long edges for denser packing.
    step = GRID
    cursor = -half_diff
    while cursor <= half_diff + 1e-6:
        offsets.append(_snap(cursor))
        cursor += step

    # De-dupe preserving order.
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
    """Candidate centers with priority tier (0 = preferred edge, 1 = other edge, 2 = corner)."""
    if not placed:
        return [(0.0, 0.0, 0)]

    preferred = set(ADJACENCY.get(room.type, []))
    candidates: list[tuple[float, float, int]] = []

    ordered = sorted(
        placed,
        key=lambda item: 0 if item[0].type in preferred else 1,
    )

    hw, hl = room.width / 2, room.length / 2

    for spec, rect in ordered:
        tier = 0 if spec.type in preferred else 1

        # Right / left of host — slide along Z.
        for dz in _slide_offsets(rect.length, room.length):
            candidates.append((_snap(rect.max_x + GAP + hw), _snap(rect.z + dz), tier))
            candidates.append((_snap(rect.min_x - GAP - hw), _snap(rect.z + dz), tier))

        # Above / below host — slide along X.
        for dx in _slide_offsets(rect.width, room.width):
            candidates.append((_snap(rect.x + dx), _snap(rect.max_z + GAP + hl), tier))
            candidates.append((_snap(rect.x + dx), _snap(rect.min_z - GAP - hl), tier))

        # Corner attachments (lower priority — used only when edges fail scoring).
        for cx, cz in (
            (rect.max_x + GAP + hw, rect.max_z + GAP + hl),
            (rect.max_x + GAP + hw, rect.min_z - GAP - hl),
            (rect.min_x - GAP - hw, rect.max_z + GAP + hl),
            (rect.min_x - GAP - hw, rect.min_z - GAP - hl),
        ):
            candidates.append((_snap(cx), _snap(cz), 2))

    seen: set[tuple[float, float]] = set()
    unique: list[tuple[float, float, int]] = []
    for x, z, tier in candidates:
        key = (x, z)
        if key not in seen:
            seen.add(key)
            unique.append((x, z, tier))
    return unique


def _fits(candidate: _Rect, occupied: list[_Rect]) -> bool:
    return all(not candidate.overlaps(other) for other in occupied)


def _aabb_area(rects: list[_Rect]) -> float:
    if not rects:
        return 0.0
    min_x = min(r.min_x for r in rects)
    max_x = max(r.max_x for r in rects)
    min_z = min(r.min_z for r in rects)
    max_z = max(r.max_z for r in rects)
    return (max_x - min_x) * (max_z - min_z)


def _score_placement(
    room: RoomSpec,
    rect: _Rect,
    placed: list[tuple[RoomSpec, _Rect]],
    tier: int,
) -> float:
    """Lower is better."""
    if not placed:
        return abs(rect.x) + abs(rect.z)

    preferred = set(ADJACENCY.get(room.type, []))
    occupied = [r for _, r in placed]

    # 1) Compact bounding box after placement.
    area = _aabb_area([*occupied, rect])

    # 2) Distance to layout centroid.
    cx = sum(r.x for r in occupied) / len(occupied)
    cz = sum(r.z for r in occupied) / len(occupied)
    compactness = math.hypot(rect.x - cx, rect.z - cz)

    # 3) Shared-wall quality + adjacency.
    wall_score = 0.0
    adjacency_bonus = 0.0
    for spec, other in placed:
        shared = rect.shared_wall_length(other)
        if shared <= 0:
            continue
        wall_score -= shared * 2.0  # longer shared walls = better
        if spec.type in preferred:
            adjacency_bonus -= 8.0 + shared

    # 4) Penalize pure corner docks (no shared wall).
    if tier >= 2 and wall_score == 0:
        wall_score += 12.0

    # 5) Slight preference for axis-aligned flush with existing walls.
    flush = 0.0
    for other in occupied:
        if abs(rect.min_x - other.min_x) < EDGE_TOL or abs(rect.max_x - other.max_x) < EDGE_TOL:
            flush -= 1.0
        if abs(rect.min_z - other.min_z) < EDGE_TOL or abs(rect.max_z - other.max_z) < EDGE_TOL:
            flush -= 1.0

    return area * 0.35 + compactness * 1.2 + wall_score + adjacency_bonus + flush + tier * 3.0


def arrange_rooms(rooms: list[RoomSpec], wall_height: float = 2.8) -> list[PlacedRoom]:
    """Place rooms on a 2D grid without overlap; centers on origin afterward."""
    if not rooms:
        return []

    ordered = _sort_rooms(rooms)
    placed: list[tuple[RoomSpec, _Rect]] = []
    occupied: list[_Rect] = []

    for room in ordered:
        best: _Rect | None = None
        best_score = float("inf")

        for cx, cz, tier in _candidate_positions(room, placed):
            rect = _Rect(cx, cz, room.width, room.length)
            if not _fits(rect, occupied):
                continue
            score = _score_placement(room, rect, placed, tier)
            if score < best_score:
                best_score = score
                best = rect

        if best is None:
            best = _spiral_place(room, occupied)

        occupied.append(best)
        placed.append((room, best))

    # Center the whole layout on the origin for a balanced camera framing.
    occupied = _center_rects(occupied)
    placed = [(spec, occupied[i]) for i, (spec, _) in enumerate(placed)]

    result: list[PlacedRoom] = []
    for spec, rect in placed:
        result.append(
            PlacedRoom(
                id=str(uuid.uuid4())[:8],
                type=spec.type,
                width=spec.width,
                length=spec.length,
                label=spec.label or spec.type.replace("_", " ").title(),
                x=round(rect.x, 3),
                z=round(rect.z, 3),
                height=wall_height,
            )
        )
    return result


def _center_rects(rects: list[_Rect]) -> list[_Rect]:
    """Translate layout so its AABB center sits at the origin (no re-snap)."""
    if not rects:
        return rects
    mid_x = (min(r.min_x for r in rects) + max(r.max_x for r in rects)) / 2
    mid_z = (min(r.min_z for r in rects) + max(r.max_z for r in rects)) / 2
    return [_Rect(r.x - mid_x, r.z - mid_z, r.width, r.length) for r in rects]


def _spiral_place(room: RoomSpec, occupied: list[_Rect]) -> _Rect:
    """Search outward on a grid until a free slot is found."""
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


def compute_bounds(rooms: list[PlacedRoom]) -> dict[str, float]:
    """Axis-aligned bounding box of the full layout."""
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
