"""Pydantic schemas for Channels."""

from pydantic import BaseModel
from datetime import datetime


class ChannelResult(BaseModel):
    id: str | None = None
    youtube_id: str
    niche_id: str | None = None
    title: str
    description: str | None = None
    subscriber_count: int | None = None
    video_count: int | None = None
    view_count: int | None = None
    views_per_video: int | None = None
    upload_frequency: float | None = None
    growth_velocity: float | None = None
    opportunity_score: float | None = None
    trends_multiplier: float = 1.0
    keywords: list[str] = []
    thumbnail_url: str | None = None
    cache_expires_at: datetime | None = None
    is_deleted: bool = False
    fetched_at: datetime | None = None
