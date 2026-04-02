"""Unified API Response wrapper for consistent JSON responses."""

from pydantic import BaseModel
from typing import Any


class APIResponse(BaseModel):
    """Standardized JSON envelope for all API responses."""
    success: bool = True
    data: Any = None
    error: str | None = None
    count: int | None = None
    meta: dict[str, Any] | None = None

    @classmethod
    def ok(cls, data: Any, count: int | None = None, meta: dict[str, Any] | None = None) -> "APIResponse":
        c = len(data) if isinstance(data, list) else None
        return cls(success=True, data=data, count=count or c, meta=meta)

    @classmethod
    def fail(cls, error: str) -> "APIResponse":
        return cls(success=False, error=error)


class SaveIdeaRequest(BaseModel):
    """Request body for manually saving a video idea."""
    niche_id: str | None = None
    source_video_id: str | None = None
    title: str
    title_alt: str | None = None
    hook: str | None = None
    thumbnail_concept: str | None = None
    talking_points: list[str] = []
    keywords: list[str] = []
    target_length_minutes: int | None = None
    appeal_score: float | None = None
    monetization_angle: str | None = None
