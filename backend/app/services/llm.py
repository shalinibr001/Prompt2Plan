"""LLM-powered prompt → room list conversion.

Primary: Ollama (local, free)
Fallback: Gemini API (when Ollama is unreachable)
Last resort: deterministic heuristic parser for sample/demo prompts
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any, Literal

import httpx

from app.config import Settings, get_settings
from app.models.layout import RoomSpec

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You convert natural-language house descriptions into floor-plan JSON.

Rules:
- Return ONLY valid JSON (no markdown, no commentary).
- Schema: {"rooms":[{"type":"<type>","width":<meters>,"length":<meters>,"label":"<optional>"}]}
- type must be one of: bedroom, kitchen, hall, living, bathroom, balcony, dining, office, closet, utility, garage, other
- Dimensions are realistic meters for residential rooms (typically 2–6 m).
- Include every room implied by the prompt (e.g. 2BHK → 2 bedrooms + hall + kitchen).
- Prefer "hall" for circulation / living-dining combined spaces when ambiguous.
- Keep room counts reasonable (max 12 rooms).
"""

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

# Default sizes (width, length) in meters when LLM omits dimensions.
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


Source = Literal["ollama", "gemini", "fallback"]


class LayoutLLMService:
    """Orchestrates Ollama → Gemini → heuristic fallback."""

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    async def generate_rooms(self, prompt: str) -> tuple[list[RoomSpec], Source]:
        # 1) Try Ollama
        try:
            rooms = await self._from_ollama(prompt)
            if rooms:
                return rooms, "ollama"
        except Exception as exc:  # noqa: BLE001 — intentional soft-fail to next provider
            logger.warning("Ollama failed: %s", exc)

        # 2) Try Gemini if configured
        if self.settings.gemini_api_key:
            try:
                rooms = await self._from_gemini(prompt)
                if rooms:
                    return rooms, "gemini"
            except Exception as exc:  # noqa: BLE001
                logger.warning("Gemini failed: %s", exc)

        # 3) Deterministic fallback so the app always responds
        logger.info("Using heuristic fallback for prompt: %s", prompt)
        return self._heuristic_rooms(prompt), "fallback"

    async def _from_ollama(self, prompt: str) -> list[RoomSpec]:
        url = f"{self.settings.ollama_base_url.rstrip('/')}/api/chat"
        payload = {
            "model": self.settings.ollama_model,
            "stream": False,
            "format": "json",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            "options": {"temperature": 0.2},
        }
        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()

        content = data.get("message", {}).get("content", "")
        return self._parse_rooms_json(content)

    async def _from_gemini(self, prompt: str) -> list[RoomSpec]:
        # Lazy import so the package is optional at runtime if unused.
        import google.generativeai as genai

        genai.configure(api_key=self.settings.gemini_api_key)
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=SYSTEM_PROMPT,
        )
        result = await model.generate_content_async(
            prompt,
            generation_config={
                "temperature": 0.2,
                "response_mime_type": "application/json",
            },
        )
        return self._parse_rooms_json(result.text or "")

    def _parse_rooms_json(self, raw: str) -> list[RoomSpec]:
        payload = _extract_json(raw)
        rooms_data = payload.get("rooms")
        if not isinstance(rooms_data, list) or not rooms_data:
            raise ValueError("JSON missing non-empty 'rooms' array")

        rooms: list[RoomSpec] = []
        for item in rooms_data:
            if not isinstance(item, dict):
                continue
            room = _normalize_room(item)
            if room:
                rooms.append(room)

        if not rooms:
            raise ValueError("No valid rooms parsed from LLM output")
        return rooms[:12]

    def _heuristic_rooms(self, prompt: str) -> list[RoomSpec]:
        """Simple keyword / BHK parser used when no LLM is available."""
        text = prompt.lower()
        rooms: list[RoomSpec] = []

        bhk = re.search(r"(\d)\s*bhk", text)
        bedroom_count = int(bhk.group(1)) if bhk else (1 if "bedroom" in text else 0)

        def add(room_type: str, count: int = 1, label: str | None = None) -> None:
            w, l = DEFAULT_SIZES[room_type]
            for i in range(count):
                name = label
                if count > 1:
                    name = f"{(label or room_type.title())} {i + 1}"
                rooms.append(
                    RoomSpec(type=room_type, width=w, length=l, label=name)  # type: ignore[arg-type]
                )

        if bedroom_count:
            add("bedroom", bedroom_count, "Bedroom")
            add("hall")
            add("kitchen")
            add("bathroom", max(1, bedroom_count - 1 if bedroom_count > 1 else 1))
        else:
            # Keyword scan
            keywords = [
                ("kitchen", "kitchen"),
                ("living", "living"),
                ("hall", "hall"),
                ("dining", "dining"),
                ("bathroom", "bathroom"),
                ("toilet", "bathroom"),
                ("balcony", "balcony"),
                ("office", "office"),
                ("study", "office"),
                ("garage", "garage"),
                ("closet", "closet"),
                ("utility", "utility"),
                ("bedroom", "bedroom"),
            ]
            for needle, room_type in keywords:
                if needle in text:
                    add(room_type)

        if "balcony" in text and not any(r.type == "balcony" for r in rooms):
            add("balcony")

        if not rooms:
            # Sensible default demo layout
            add("hall")
            add("kitchen")
            add("bedroom")
            add("bathroom")

        return rooms


def _extract_json(raw: str) -> dict[str, Any]:
    text = raw.strip()
    # Strip markdown fences if the model ignored instructions.
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        text = fence.group(1).strip()
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        # Attempt to find the first {...} block.
        match = re.search(r"\{[\s\S]*\}", text)
        if not match:
            raise
        data = json.loads(match.group(0))
    if not isinstance(data, dict):
        raise ValueError("Expected a JSON object")
    return data


def _normalize_room(item: dict[str, Any]) -> RoomSpec | None:
    raw_type = str(item.get("type", "other")).lower().strip()
    aliases = {
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
    room_type = aliases.get(raw_type, raw_type)
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
