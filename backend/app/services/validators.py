"""Shared room-type / dimension validation for LLM outputs."""

from __future__ import annotations

from typing import Any

from app.models.layout import RoomSpec

VALID_TYPES = {
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
}

DEFAULT_SIZES: dict[str, tuple[float, float]] = {
    "bedroom": (3.5, 4.0),
    "kitchen": (3.0, 2.5),
    "hall": (5.0, 4.0),
    "living": (5.0, 4.0),
    "bathroom": (2.0, 2.5),
    "balcony": (2.5, 1.5),
    "dining": (3.5, 3.0),
    "office": (3.0, 3.0),
    "closet": (1.5, 2.0),
    "utility": (2.0, 2.0),
    "garage": (5.0, 3.0),
    "other": (3.0, 3.0),
}

ALIASES = {
    "living room": "living",
    "livingroom": "living",
    "master bedroom": "bedroom",
    "bath": "bathroom",
    "wc": "bathroom",
    "toilet": "bathroom",
    "study": "office",
    "corridor": "hall",
    "lobby": "hall",
    "lounge": "living",
}


def normalize_room(item: dict[str, Any]) -> RoomSpec | None:
    """Coerce a raw dict into a valid RoomSpec or return None."""
    raw_type = str(item.get("type", "other")).lower().strip()
    room_type = ALIASES.get(raw_type, raw_type)
    if room_type not in VALID_TYPES:
        room_type = "other"

    defaults = DEFAULT_SIZES[room_type]
    try:
        width = float(item.get("width", defaults[0]))
        length = float(item.get("length", defaults[1]))
    except (TypeError, ValueError):
        width, length = defaults

    width = max(1.0, min(30.0, round(width, 1)))
    length = max(1.0, min(30.0, round(length, 1)))
    label = item.get("label")
    if label is not None:
        label = str(label)[:60]

    return RoomSpec(type=room_type, width=width, length=length, label=label)  # type: ignore[arg-type]


def validate_rooms_payload(rooms_data: Any) -> list[RoomSpec]:
    """Validate LLM JSON rooms array → list[RoomSpec]. Raises ValueError on failure."""
    if not isinstance(rooms_data, list) or not rooms_data:
        raise ValueError("JSON missing non-empty 'rooms' array")

    rooms: list[RoomSpec] = []
    for item in rooms_data:
        if not isinstance(item, dict):
            continue
        room = normalize_room(item)
        if room:
            rooms.append(room)

    if not rooms:
        raise ValueError("No valid rooms parsed from LLM output")
    return rooms[:12]
