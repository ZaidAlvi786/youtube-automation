"""Channels Router — Search, discover, and browse YouTube channels."""

from fastapi import APIRouter, Query, BackgroundTasks, Request
from app.models.channel import ChannelResult
from app.services import youtube_service, discovery_service

router = APIRouter()


@router.get("", response_model=list[ChannelResult])
async def search_channels(
    request: Request,
    background_tasks: BackgroundTasks,
    query: str = Query(..., description="Search query (niche keyword)"),
    max_results: int = Query(10, ge=1, le=50),
    min_subs: int | None = Query(None, description="Minimum subscriber count"),
    max_subs: int | None = Query(None, description="Maximum subscriber count"),
    niche_id: str | None = Query(None, description="Associate with a niche"),
):
    """Search YouTube for channels matching a query with optional filtering."""
    channels = await youtube_service.search_channels(
        query=query,
        max_results=max_results,
        min_subscribers=min_subs,
        max_subscribers=max_subs,
        niche_id=niche_id,
    )

    # Background: Prefetch videos for each channel to warm the cache
    for channel in channels:
        background_tasks.add_task(youtube_service.prefetch_channel_videos, channel.youtube_id)

    return channels


@router.get("/discover", response_model=list[ChannelResult])
async def discover_rising_stars(
    request: Request,
    background_tasks: BackgroundTasks,
    query: str = Query(..., description="Niche/Topic to discover rising stars in"),
    max_videos: int = Query(50, ge=1, le=100),
    min_subs: int = Query(2000, ge=0),
    min_views: int = Query(200000, ge=0),
    max_age_days: int = Query(90, ge=1, le=365),
):
    """Advanced discovery: Find channels created in the last X days with high traction.

    If results are cached and valid, returns immediately.
    Otherwise kicks off a background discovery job and returns any existing data.
    """
    # 1. Try cache first (instant response)
    cached = await discovery_service._get_cached_discovery(query)
    if cached is not None:
        return cached

    # 2. No cache → kick off background discovery (non-blocking)
    background_tasks.add_task(
        discovery_service.discover_rising_stars_bg,
        query=query,
        max_videos=max_videos,
        min_subs=min_subs,
        min_views=min_views,
        max_days_old=max_age_days,
    )

    # 3. Return empty list immediately; frontend polls or uses websockets
    return []
