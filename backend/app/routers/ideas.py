"""Ideas router — generate and list video ideas with full scripts."""

from fastapi import APIRouter, Query
from app.models.idea import IdeaGenerateRequest, VideoIdea, ScriptSegment
from app.services import ai_service
from app.db.supabase_client import get_supabase

router = APIRouter()


@router.post("/generate", response_model=list[VideoIdea])
async def generate_ideas(request: IdeaGenerateRequest):
    """Generate production-ready video ideas with full scripts, keywords, and SEO data."""
    raw_ideas = await ai_service.generate_video_ideas(
        niche=request.niche,
        reference_videos=request.reference_videos,
        count=request.count,
        audience_level=request.audience_level,
    )

    results: list[VideoIdea] = []
    db = get_supabase()

    for raw in raw_ideas:
        # Parse script outline segments
        script_segments = []
        for seg in raw.get("script_outline", []):
            if isinstance(seg, dict):
                script_segments.append(ScriptSegment(**seg))

        idea = VideoIdea(
            niche_id=request.niche_id,
            title=raw.get("title", "Untitled"),
            title_alt=raw.get("title_alt"),
            hook=raw.get("hook"),
            thumbnail_concept=raw.get("thumbnail_concept"),
            script_outline=script_segments,
            talking_points=raw.get("talking_points", []),
            keywords=raw.get("keywords", []),
            target_length_minutes=raw.get("target_length_minutes"),
            best_upload_time=raw.get("best_upload_time"),
            appeal_score=raw.get("appeal_score"),
            monetization_angle=raw.get("monetization_angle"),
        )

        # Persist to Supabase
        resp = (
            db.table("video_ideas")
            .insert(
                {
                    "niche_id": idea.niche_id,
                    "title": idea.title,
                    "hook": idea.hook,
                    "talking_points": idea.talking_points,
                    "appeal_score": idea.appeal_score,
                }
            )
            .execute()
        )
        if resp.data:
            idea.id = resp.data[0]["id"]

        results.append(idea)

    return results


@router.get("", response_model=list[VideoIdea])
async def list_ideas(niche_id: str | None = Query(None)):
    """List previously generated video ideas."""
    db = get_supabase()
    query = (
        db.table("video_ideas")
        .select("*")
        .eq("is_deleted", False)
        .order("appeal_score", desc=True)
    )

    if niche_id:
        query = query.eq("niche_id", niche_id)

    resp = query.execute()
    return [VideoIdea(**row) for row in resp.data]
