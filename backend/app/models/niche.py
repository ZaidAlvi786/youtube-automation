"""Pydantic schemas for Niches."""

from pydantic import BaseModel
from datetime import datetime


# ---------- Requests ----------

class NicheGenerateRequest(BaseModel):
    category: str
    count: int = 30  # AI system generates 20-50 niches


# ---------- Responses ----------

class NicheResult(BaseModel):
    id: str | None = None
    category: str
    name: str
    description: str | None = None
    competition_level: str | None = None  # low | medium | high
    score: float = 0.0
    monetization_score: float = 0.0
    trends_score: float = 1.0
    is_deleted: bool = False
    created_at: datetime | None = None
