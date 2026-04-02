"""Pydantic schemas for Video Ideas — enhanced with full script + SEO support."""

from pydantic import BaseModel
from datetime import datetime


# ---------- Requests ----------

class IdeaGenerateRequest(BaseModel):
    niche: str
    niche_id: str | None = None
    reference_videos: list[str] = []
    count: int = 5
    audience_level: str = "intermediate"


# ---------- Responses ----------

class ScriptSegment(BaseModel):
    """One segment of a video script outline."""
    section: str
    duration_seconds: int | None = None
    content: str
    visual_notes: str | None = None
    retention_technique: str | None = None


class VideoIdea(BaseModel):
    id: str | None = None
    niche_id: str | None = None
    source_video_id: str | None = None
    title: str
    title_alt: str | None = None
    hook: str | None = None
    thumbnail_concept: str | None = None
    script_outline: list[ScriptSegment] = []
    talking_points: list[str] = []
    keywords: list[str] = []
    target_length_minutes: int | None = None
    best_upload_time: str | None = None
    appeal_score: float | None = None
    monetization_angle: str | None = None
    is_deleted: bool = False
    created_at: datetime | None = None
