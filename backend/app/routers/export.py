"""Endpoints for data export (Excel & Word)."""

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import List, Optional
from datetime import datetime
import io

from app.db.supabase_client import get_supabase

supabase = get_supabase()
from app.services import export_service
from app.models.niche import NicheResult
from app.models.channel import ChannelResult
from app.models.idea import VideoIdea
from app.models.video import VideoResult

router = APIRouter(prefix="/export", tags=["Export"])

@router.get("/niches/xlsx")
async def download_niches_xlsx(
    category: Optional[str] = Query(None, description="Filter by category")
):
    """Download all niches (optionally filtered) as an Excel spreadsheet."""
    query = supabase.table("niches").select("*").eq("is_deleted", False)
    if category:
        query = query.eq("category", category)
    
    res = query.execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="No niches found to export.")
    
    niches = [NicheResult(**item) for item in res.data]
    output = export_service.export_niches_to_xlsx(niches)
    
    filename = f"NicheScope_Niches_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/channels/xlsx")
async def download_channels_xlsx(
    niche_id: Optional[str] = Query(None, description="Filter by niche ID"),
    query_str: Optional[str] = Query(None, description="Search query")
):
    """Download channel discovery data as an Excel spreadsheet."""
    db_query = supabase.table("channels").select("*").eq("is_deleted", False)
    if niche_id:
        db_query = db_query.eq("niche_id", niche_id)
    if query_str:
        db_query = db_query.ilike("title", f"%{query_str}%")
    
    res = db_query.execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="No channels found to export.")
    
    channels = [ChannelResult(**item) for item in res.data]
    output = export_service.export_channels_to_xlsx(channels)
    
    filename = f"NicheScope_Channels_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/ideas/{idea_id}/docx")
async def download_script_docx(idea_id: str):
    """Download a full video script outline as a Word document."""
    res = supabase.table("video_ideas").select("*").eq("id", idea_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Video idea not found.")
    
    idea = VideoIdea(**res.data)
    output = export_service.export_script_to_docx(idea)
    
    # Sanitize title for filename
    safe_title = "".join(x for x in idea.title if x.isalnum() or x in " -_").strip()[:50]
    filename = f"Script_{safe_title}.docx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/videos/{video_id}/analysis/docx")
async def download_analysis_docx(video_id: str):
    """Download a forensic video analysis report as a Word document."""
    res = supabase.table("videos").select("*").eq("id", video_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Video data not found.")
    
    video = VideoResult(**res.data)
    if not video.video_analysis:
        raise HTTPException(status_code=400, detail="No analysis report exists for this video yet.")
    
    output = export_service.export_analysis_to_docx(video)
    
    safe_title = "".join(x for x in video.title if x.isalnum() or x in " -_").strip()[:50]
    filename = f"Analysis_{safe_title}.docx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
