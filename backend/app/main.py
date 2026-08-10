"""Prompt2Plan FastAPI application entrypoint."""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routes.layout import router as layout_router
from app.services.store import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

settings = get_settings()
init_db()

app = FastAPI(
    title="Prompt2Plan API",
    description=(
        "Converts natural-language prompts into structured 3D floor-plan layouts. "
        "Uses Ollama locally, with Gemini as an optional fallback."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(layout_router)


@app.get("/health")
async def health() -> dict[str, str]:
    """Liveness probe for local development and deployments."""
    return {"status": "ok", "service": "prompt2plan"}
