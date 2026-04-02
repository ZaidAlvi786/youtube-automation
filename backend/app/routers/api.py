"""Unified API Router — Clean, flat endpoints for the frontend.

Endpoints:
  POST /generate-niches    → AI niche generation
  GET  /get-channels       → YouTube channel search + discovery
  GET  /get-videos         → YouTube video listing for a channel
  POST /analyze-video      → AI forensic video analysis
  POST /generate-idea      → AI video idea generation with full scripts
  POST /save-idea          → Manually save a video idea to the database
"""

import logging
from fastapi import APIRouter, Query, BackgroundTasks, HTTPException

from app.models.niche import NicheGenerateRequest, NicheResult
from app.models.channel import ChannelResult
from app.models.video import VideoResult
from app.models.idea import IdeaGenerateRequest, VideoIdea, ScriptSegment
from app.models.analysis import VideoAnalyzeRequest, VideoAnalysisResult
from app.models.api_response import APIResponse, SaveIdeaRequest
from app.services import niche_engine, youtube_service, ai_service, discovery_service
from app.db.supabase_client import get_supabase

logger = logging.getLogger(__name__)
router = APIRouter()


# ===========================================================================
#  1. POST /generate-niches
# ===========================================================================

@router.post("/generate-niches", response_model=APIResponse)
async def generate_niches(request: NicheGenerateRequest):
    """Generate 20-50 profitable YouTube sub-niches from a category.

    Request body:
        category (str): Broad category like "Gaming", "Finance", "Health"
        count (int): Number of niches to generate (default: 30, max: 50)

    Returns:
        APIResponse with list of NicheResult objects
    """
    try:
        niches = await niche_engine.generate_niches(
            category=request.category,
            count=request.count,
        )
        return APIResponse.ok(data=[n.model_dump() for n in niches])

    except Exception as e:
        logger.error("generate-niches failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================================================
#  2. GET /get-channels
# ===========================================================================

@router.get("/get-channels", response_model=APIResponse)
async def get_channels(
    background_tasks: BackgroundTasks,
    query: str = Query(..., description="Search query (niche keyword)"),
    max_results: int = Query(10, ge=1, le=50),
    min_subs: int | None = Query(2000, description="Minimum subscriber count"),
    max_subs: int | None = Query(None, description="Maximum subscriber count"),
    max_videos: int | None = Query(20, description="Maximum video count for discovery"),
    niche_id: str | None = Query(None, description="Associate with a niche"),
    discover: bool = Query(False, description="Use deep discovery mode (rising stars)"),
    max_age_days: int = Query(180, ge=1, le=365, description="Max channel age for discovery"),
):
    """Search YouTube channels or discover rising stars.

    Query params:
        query (str): Search keyword
        max_results (int): 1-50, default 10
        min_subs / max_subs (int): Subscriber range filter
        max_videos (int): Video count limit for discovery
        niche_id (str): Link results to a niche
        discover (bool): Enable deep discovery mode
        max_age_days (int): Channel age limit for discovery mode

    Returns:
        APIResponse with list of ChannelResult objects
    """
    try:
        if discover:
            # Try cache first
            cached = await discovery_service._get_cached_discovery(query)
            if cached is not None:
                return APIResponse.ok(
                    data=[c.model_dump() for c in cached["channels"]],
                    meta=cached["stats"]
                )

            # Kick off background discovery
            background_tasks.add_task(
                discovery_service.discover_rising_stars_bg,
                query=query,
                max_videos_per_channel=max_videos or 20,
                max_results_to_scan=150,
                min_subs=min_subs or 2000,
                min_views=200000,
                max_days_old=max_age_days,
            )
            return APIResponse.ok(data=[], count=0)

        # Standard search
        channels = await youtube_service.search_channels(
            query=query,
            max_results=max_results,
            min_subscribers=min_subs,
            max_subscribers=max_subs,
            niche_id=niche_id,
        )

        # Background: prefetch videos for cache warming
        for ch in channels:
            background_tasks.add_task(
                youtube_service.prefetch_channel_videos, ch.youtube_id
            )

        return APIResponse.ok(data=[c.model_dump() for c in channels])

    except Exception as e:
        logger.error("get-channels failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================================================
#  3. GET /get-videos
# ===========================================================================

@router.get("/get-videos", response_model=APIResponse)
async def get_videos(
    channel_id: str = Query(..., description="YouTube channel ID"),
    max_results: int = Query(20, ge=1, le=50),
    order: str = Query("date", description="Sort: date | viewCount"),
):
    """List recent videos from a YouTube channel.

    Query params:
        channel_id (str): YouTube channel ID
        max_results (int): 1-50, default 20
        order (str): "date" or "viewCount"

    Returns:
        APIResponse with list of VideoResult objects
    """
    try:
        videos = await youtube_service.list_videos(
            channel_id=channel_id,
            max_results=max_results,
            order=order,
        )
        return APIResponse.ok(data=[v.model_dump() for v in videos])

    except Exception as e:
        logger.error("get-videos failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================================================
#  4. POST /analyze-video
# ===========================================================================

@router.post("/analyze-video", response_model=APIResponse)
async def analyze_video(request: VideoAnalyzeRequest):
    """Perform AI-powered forensic analysis of a YouTube video.

    Request body:
        title (str): Video title
        description (str): Video description
        view_count (int): View count
        like_count (int): Like count
        channel_name (str): Channel name
        niche (str): Niche context
        video_id (str|null): Optional — persist analysis to this video record

    Returns:
        APIResponse with VideoAnalysisResult (hook_type, structure, emotions, viral_factors, score)
    """
    try:
        analysis = await ai_service.analyze_video(
            title=request.title,
            description=request.description,
            view_count=request.view_count,
            like_count=request.like_count,
            channel_name=request.channel_name,
            niche=request.niche,
        )

        if not analysis:
            return APIResponse.fail(error="Analysis could not be completed. Try again.")

        # Persist to DB if video_id provided
        if request.video_id:
            try:
                db = get_supabase()
                db.table("videos").update(
                    {"video_analysis": analysis}
                ).eq("youtube_id", request.video_id).execute()
            except Exception as db_err:
                logger.warning("Failed to persist analysis for %s: %s", request.video_id, db_err)

        result = VideoAnalysisResult(**analysis)
        return APIResponse.ok(data=result.model_dump())

    except Exception as e:
        logger.error("analyze-video failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================================================
#  5. POST /generate-idea
# ===========================================================================

@router.post("/generate-idea", response_model=APIResponse)
async def generate_idea(request: IdeaGenerateRequest):
    """Generate production-ready video ideas with full scripts and SEO keywords.

    Request body:
        niche (str): Target niche
        niche_id (str|null): Link to a stored niche
        reference_videos (list[str]): Top performer titles for inspiration
        count (int): Number of ideas (default: 5)
        audience_level (str): "beginner" | "intermediate" | "advanced"

    Returns:
        APIResponse with list of VideoIdea objects (title, hook, script, keywords, etc.)
    """
    try:
        raw_ideas = await ai_service.generate_video_ideas(
            niche=request.niche,
            reference_videos=request.reference_videos,
            count=request.count,
            audience_level=request.audience_level,
        )

        results: list[dict] = []
        db = get_supabase()

        for raw in raw_ideas:
            # Parse script segments
            script_segments = []
            for seg in raw.get("script_outline", []):
                if isinstance(seg, dict):
                    script_segments.append(ScriptSegment(**seg).model_dump())

            idea = VideoIdea(
                niche_id=request.niche_id,
                title=raw.get("title", "Untitled"),
                title_alt=raw.get("title_alt"),
                hook=raw.get("hook"),
                thumbnail_concept=raw.get("thumbnail_concept"),
                script_outline=[ScriptSegment(**s) for s in raw.get("script_outline", []) if isinstance(s, dict)],
                talking_points=raw.get("talking_points", []),
                keywords=raw.get("keywords", []),
                target_length_minutes=raw.get("target_length_minutes"),
                best_upload_time=raw.get("best_upload_time"),
                appeal_score=raw.get("appeal_score"),
                monetization_angle=raw.get("monetization_angle"),
            )

            # Persist
            try:
                resp = (
                    db.table("video_ideas")
                    .insert({
                        "niche_id": idea.niche_id,
                        "title": idea.title,
                        "hook": idea.hook,
                        "talking_points": idea.talking_points,
                        "appeal_score": idea.appeal_score,
                    })
                    .execute()
                )
                if resp.data:
                    idea.id = resp.data[0]["id"]
            except Exception as db_err:
                logger.warning("Failed to persist idea '%s': %s", idea.title, db_err)

            results.append(idea.model_dump())

        return APIResponse.ok(data=results)

    except Exception as e:
        logger.error("generate-idea failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================================================
#  6. POST /save-idea
# ===========================================================================

@router.post("/save-idea", response_model=APIResponse)
async def save_idea(request: SaveIdeaRequest):
    """Manually save a video idea to the database.

    Request body:
        title (str): Video title
        niche_id (str|null): Link to a niche
        source_video_id (str|null): Link to a source video
        hook (str|null): Opening hook
        talking_points (list[str]): Key points
        keywords (list[str]): SEO keywords
        appeal_score (float|null): 1-10 score
        monetization_angle (str|null): Revenue strategy

    Returns:
        APIResponse with the saved VideoIdea object (includes generated ID)
    """
    try:
        db = get_supabase()
        resp = (
            db.table("video_ideas")
            .insert({
                "niche_id": request.niche_id,
                "source_video_id": request.source_video_id,
                "title": request.title,
                "hook": request.hook,
                "talking_points": request.talking_points,
                "appeal_score": request.appeal_score,
            })
            .execute()
        )

        if not resp.data:
            return APIResponse.fail(error="Failed to save idea to database.")

        saved = resp.data[0]
        idea = VideoIdea(
            id=saved["id"],
            niche_id=request.niche_id,
            source_video_id=request.source_video_id,
            title=request.title,
            title_alt=request.title_alt,
            hook=request.hook,
            thumbnail_concept=request.thumbnail_concept,
            talking_points=request.talking_points,
            keywords=request.keywords,
            target_length_minutes=request.target_length_minutes,
            appeal_score=request.appeal_score,
            monetization_angle=request.monetization_angle,
            created_at=saved.get("created_at"),
        )

        return APIResponse.ok(data=idea.model_dump())

    except Exception as e:
        logger.error("save-idea failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
