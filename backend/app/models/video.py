"""Pydantic schemas for Videos."""

from pydantic import BaseModel
from datetime import datetime


class VideoResult(BaseModel):
    id: str | None = None
    youtube_id: str
    channel_id: str | None = None
    title: str
    view_count: int | None = None
    like_count: int | None = None
    published_at: datetime | None = None
    thumbnail_url: str | None = None
    video_analysis: dict | None = None
    cache_expires_at: datetime | None = None
    is_deleted: bool = False
    fetched_at: datetime | None = None
