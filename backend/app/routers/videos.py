"""Videos router — list videos and analyze video content."""

from fastapi import APIRouter, Query
from app.models.video import VideoResult
from app.models.analysis import VideoAnalyzeRequest, VideoAnalysisResult
from app.services import youtube_service, ai_service
from app.db.supabase_client import get_supabase

router = APIRouter()


@router.get("", response_model=list[VideoResult])
async def list_videos(
    channel_id: str = Query(..., description="YouTube channel ID"),
    max_results: int = Query(20, ge=1, le=50),
    order: str = Query("date", description="Sort order: date | viewCount"),
):
    """List recent videos from a YouTube channel."""
    return await youtube_service.list_videos(
        channel_id=channel_id,
        max_results=max_results,
        order=order,
    )


@router.post("/analyze", response_model=VideoAnalysisResult)
async def analyze_video(request: VideoAnalyzeRequest):
    """Perform AI-powered forensic analysis of a YouTube video.

    Returns hook type, content structure, emotion triggers, viral factors,
    improvement suggestions, and an overall quality score.
    """
    analysis = await ai_service.analyze_video(
        title=request.title,
        description=request.description,
        view_count=request.view_count,
        like_count=request.like_count,
        channel_name=request.channel_name,
        niche=request.niche,
    )

    if not analysis:
        return VideoAnalysisResult(
            hook_type="unknown",
            hook_analysis="Analysis could not be completed.",
        )

    # Persist analysis to the video record if video_id is provided
    if request.video_id:
        db = get_supabase()
        db.table("videos").update(
            {"video_analysis": analysis}
        ).eq("youtube_id", request.video_id).execute()

    return VideoAnalysisResult(**analysis)
