"""Niches router — generate and list niches."""

from fastapi import APIRouter
from app.models.niche import NicheGenerateRequest, NicheResult
from app.services import niche_engine

router = APIRouter()


@router.post("/generate", response_model=list[NicheResult])
async def generate_niches(request: NicheGenerateRequest):
    """Generate sub-niches for a given category using AI."""
    return await niche_engine.generate_niches(
        category=request.category,
        count=request.count,
    )


@router.get("", response_model=list[NicheResult])
async def list_niches(category: str | None = None):
    """List previously generated niches, optionally filtered by category."""
    return await niche_engine.get_niches(category=category)
