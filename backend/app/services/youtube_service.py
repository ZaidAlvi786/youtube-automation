"""YouTube Service — YouTube Data API v3 wrapper."""

import datetime
import logging
from googleapiclient.discovery import build
from tenacity import retry, stop_after_attempt, wait_exponential
from app.config import get_settings
from app.models.channel import ChannelResult
from app.models.video import VideoResult
from app.db.supabase_client import get_supabase

logger = logging.getLogger(__name__)

_youtube = None


def _get_youtube():
    global _youtube
    if _youtube is None:
        _youtube = build("youtube", "v3", developerKey=get_settings().youtube_api_key)
    return _youtube


from googleapiclient.errors import HttpError

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
)
def _execute_request(request):
    """Execute a YouTube API request with retry logic and detailed error logging."""
    try:
        return request.execute()
    except HttpError as e:
        logger.error("YouTube API HttpError: %s (Status: %s, Body: %s)", e, e.resp.status, e.content)
        raise e
    except Exception as e:
        logger.error("YouTube API Request failed: %s", e)
        raise e


async def search_channels(
    query: str,
    max_results: int = 10,
    min_subscribers: int | None = None,
    max_subscribers: int | None = None,
    niche_id: str | None = None,
) -> list[ChannelResult]:
    """Search YouTube for channels matching a query, with optional subscriber filters."""
    db = get_supabase()
    
    # 1. Check Cache First (Supabase)
    # Simple strategy: If we have channels for this niche_id fetched in the last 24h, return them
    if niche_id:
        cache_threshold = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=24)).isoformat()
        cached = db.table("channels").select("*").eq("niche_id", niche_id).gt("fetched_at", cache_threshold).execute()
        if cached.data:
            return [ChannelResult(**row) for row in cached.data]

    yt = _get_youtube()

    # Step 1: Search for channels
    search_req = yt.search().list(part="snippet", q=query, type="channel", maxResults=max_results)
    search_response = _execute_request(search_req)

    channel_ids = [item["snippet"]["channelId"] for item in search_response.get("items", [])]
    if not channel_ids:
        return []

    # Step 2: Get channel statistics (Batching)
    results: list[ChannelResult] = []
    # YouTube allows up to 50 IDs per call
    for i in range(0, len(channel_ids), 50):
        chunk = channel_ids[i : i + 50]
        stats_req = yt.channels().list(part="snippet,statistics", id=",".join(chunk))
        stats_response = _execute_request(stats_req)

        for item in stats_response.get("items", []):
            stats = item.get("statistics", {})
            sub_count = int(stats.get("subscriberCount", 0))

            # Apply subscriber filters
            if min_subscribers and sub_count < min_subscribers:
                continue
            if max_subscribers and sub_count > max_subscribers:
                continue

            channel = ChannelResult(
                youtube_id=item["id"],
                niche_id=niche_id,
                title=item["snippet"]["title"],
                description=item["snippet"].get("description", ""),
                subscriber_count=sub_count,
                video_count=int(stats.get("videoCount", 0)),
                view_count=int(stats.get("viewCount", 0)),
                thumbnail_url=item["snippet"]["thumbnails"]["default"]["url"],
                cache_expires_at=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
            )
            results.append(channel)

    # Cache in Supabase
    if results:
        for ch in results:
            db.table("channels").upsert(
                {
                    "youtube_id": ch.youtube_id,
                    "niche_id": ch.niche_id,
                    "title": ch.title,
                    "description": ch.description,
                    "subscriber_count": ch.subscriber_count,
                    "video_count": ch.video_count,
                    "view_count": ch.view_count,
                    "thumbnail_url": ch.thumbnail_url,
                    "cache_expires_at": ch.cache_expires_at.isoformat() if ch.cache_expires_at else None,
                    "fetched_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                },
                on_conflict="youtube_id",
            ).execute()

    return results


async def list_videos(
    channel_id: str,
    max_results: int = 20,
    order: str = "date",
) -> list[VideoResult]:
    """List recent videos from a YouTube channel.
    
    Note: channel_id here is the YouTube string ID (e.g., UC...).
    """
async def list_videos(
    channel_id: str,
    max_results: int = 20,
    order: str = "date",
) -> list[VideoResult]:
    """List recent videos from a YouTube channel.
    
    Robustness: If channel_id is a query/title (doesn't start with 'UC'), 
    we perform a search to resolve the ID first.
    """
    db = get_supabase()
    yt = _get_youtube()

    # 1. Resolve ID if it's a title/query
    resolved_id = channel_id
    if not channel_id.startswith("UC"):
        logger.info("Resolving title query '%s' to a YouTube ID...", channel_id)
        try:
            # Search for the channel by title
            search_req = yt.search().list(
                part="snippet",
                q=channel_id,
                type="channel",
                maxResults=1
            )
            res = _execute_request(search_req)
            if res.get("items"):
                resolved_id = res["items"][0]["snippet"]["channelId"]
                logger.info("Resolved '%s' -> %s", channel_id, resolved_id)
            else:
                logger.warning("No channel found for title '%s'", channel_id)
                return []
        except Exception as e:
            logger.error("Failed to resolve channel title: %s", e)
            return []

    # 2. Resolve the database UUID for this channel
    channel_uuid = None
    try:
        channel_data = db.table("channels").select("id").eq("youtube_id", resolved_id).execute()
        if channel_data.data:
            channel_uuid = channel_data.data[0]["id"]
    except Exception as e:
        logger.warning("Could not resolve channel UUID for %s: %s", resolved_id, e)

    # 3. Check Cache First (Supabase)
    if channel_uuid:
        cache_threshold = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=12)).isoformat()
        try:
            cached = db.table("videos").select("*").eq("channel_id", channel_uuid).gt("fetched_at", cache_threshold).execute()
            if cached.data:
                return [VideoResult(**row) for row in cached.data]
        except Exception as e:
            logger.warning("Video cache lookup failed: %s", e)

    # 4. Fetch from YouTube
    search_req = yt.search().list(
        part="snippet",
        channelId=resolved_id,
        type="video",
        order=order,
        maxResults=max_results,
    )
    search_response = _execute_request(search_req)

    video_ids = [item["id"]["videoId"] for item in search_response.get("items", [])]
    if not video_ids:
        return []

    # Step 2: Get video statistics (Batching)
    results: list[VideoResult] = []
    for i in range(0, len(video_ids), 50):
        chunk = video_ids[i : i + 50]
        stats_req = yt.videos().list(part="snippet,statistics", id=",".join(chunk))
        stats_response = _execute_request(stats_req)

        for item in stats_response.get("items", []):
            stats = item.get("statistics", {})
            video = VideoResult(
                youtube_id=item["id"],
                channel_id=channel_id,
                title=item["snippet"]["title"],
                view_count=int(stats.get("viewCount", 0)),
                like_count=int(stats.get("likeCount", 0)),
                published_at=item["snippet"].get("publishedAt"),
                thumbnail_url=item["snippet"]["thumbnails"]["medium"]["url"],
                cache_expires_at=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
            )
            results.append(video)

    # Cache in Supabase
    if results:
        # If we didn't have the UUID, we can't save (violates FK)
        # Should we log this and continue? Yes.
        if not channel_uuid:
            logger.info("Skipping video cache write: missing channel UUID for %s", resolved_id)
            return results

        for v in results:
            try:
                db.table("videos").upsert(
                    {
                        "youtube_id": v.youtube_id,
                        "channel_id": channel_uuid,
                        "title": v.title,
                        "view_count": v.view_count,
                        "like_count": v.like_count,
                        "published_at": v.published_at.isoformat() if v.published_at else None,
                        "thumbnail_url": v.thumbnail_url,
                        "cache_expires_at": v.cache_expires_at.isoformat() if v.cache_expires_at else None,
                        "fetched_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    },
                    on_conflict="youtube_id",
                ).execute()
            except Exception as e:
                logger.warning("Failed to cache video %s: %s", v.youtube_id, e)

    return results


async def prefetch_channel_videos(channel_id: str):
    """Background task to warm the video cache for a channel."""
    # We just call list_videos which handles the caching logic
    try:
        await list_videos(channel_id=channel_id, max_results=10)
    except Exception as e:
        print(f"Background prefetch failed for {channel_id}: {e}")

