"""Pydantic schemas for Video Analysis — forensic content analysis results."""

from pydantic import BaseModel


# ---------- Requests ----------

class VideoAnalyzeRequest(BaseModel):
    title: str
    description: str = ""
    view_count: int = 0
    like_count: int = 0
    channel_name: str = ""
    niche: str = ""
    video_id: str | None = None  # optional: link to a stored video


# ---------- Sub-models ----------

class EmotionTrigger(BaseModel):
    emotion: str
    technique: str
    intensity: int | None = None


class VideoStructure(BaseModel):
    type: str  # tutorial, story, listicle, reaction, etc.
    estimated_segments: list[dict] = []
    pacing: str = "medium"  # fast | medium | slow


class ViralFactors(BaseModel):
    primary_reason: str
    shareability_score: float | None = None
    rewatchability_score: float | None = None
    algorithm_signals: list[str] = []


# ---------- Response ----------

class VideoAnalysisResult(BaseModel):
    hook_type: str  # curiosity_gap, shock_value, listicle, how_to, etc.
    hook_analysis: str
    structure: VideoStructure | None = None
    emotion_triggers: list[EmotionTrigger] = []
    viral_factors: ViralFactors | None = None
    improvement_suggestions: list[str] = []
    overall_score: float | None = None
