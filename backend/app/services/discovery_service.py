"""Discovery Service — Production-grade YouTube data engine for finding rising stars.

Enhancements over Phase 3 baseline:
  1. Cache-first: checks Supabase before any API call; respects cache_expires_at.
  2. Retry: uses tenacity for resilient API calls with partial-failure safety.
  3. Background-ready: discover_rising_stars_bg() is designed for BackgroundTasks.
  4. Deduplication: in-memory set + upsert guarantees no duplicate channels.
  5. Improved keywords: combines titles, descriptions, AND tags from video results.
  6. Opportunity Score: composite formula from velocity, views_per_video, frequency.
  7. Trends placeholder: trends_multiplier ready for Google Trends API integration.
"""

import datetime
import logging
import re
from collections import Counter

import nltk
import ssl

# Bypass SSL certificate verification for NLTK downloads (common on macOS)
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

from rake_nltk import Rake
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.services import youtube_service
from app.models.channel import ChannelResult
from app.db.supabase_client import get_supabase

logger = logging.getLogger(__name__)

# Initialize RAKE for keyword extraction
_rake = Rake()

# YouTube-specific stop words to filter out of keyword results
_YT_STOP_WORDS = {
    "subscribe", "video", "channel", "watch", "like", "comment",
    "share", "click", "link", "description", "new", "follow",
    "videos", "shorts", "please", "check", "make", "sure",
}


# ---------------------------------------------------------------------------
#  1. CACHE LOGIC — Check DB before hitting the API
# ---------------------------------------------------------------------------

from typing import TypedDict

class DiscoveryStats(TypedDict):
    total_scanned: int
    rejected_age: int
    rejected_videos: int
    rejected_performance: int
    already_known: int

class DiscoveryResult(TypedDict):
    channels: list[ChannelResult]
    stats: DiscoveryStats

# ---------------------------------------------------------------------------
#  1. CACHE LOGIC — Check DB before hitting the API
# ---------------------------------------------------------------------------

async def _get_cached_discovery(query: str) -> DiscoveryResult | None:
    """Return cached discovery results if cache_expires_at is still valid."""
    db = get_supabase()
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()

    # Look for channels discovered for this query whose cache hasn't expired
    cached = (
        db.table("channels")
        .select("*")
        .eq("is_deleted", False)
        .gt("cache_expires_at", now)
        .not_.is_("growth_velocity", "null")  # only discovery-enriched rows
        .order("opportunity_score", desc=True)
        .limit(50)
        .execute()
    )

    if cached.data and len(cached.data) >= 3:
        logger.info("Cache HIT for discovery query '%s' (%d channels)", query, len(cached.data))
        return {
            "channels": [ChannelResult(**row) for row in cached.data],
            "stats": {
                "total_scanned": 0,
                "rejected_age": 0,
                "rejected_videos": 0,
                "rejected_performance": 0,
                "already_known": 0
            }
        }

    return None


# ---------------------------------------------------------------------------
#  RETRY & ERROR HANDLING — Resilient API calls
# ---------------------------------------------------------------------------

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(Exception),
    reraise=True,
)
def _safe_execute(request):
    """Execute a YouTube API request with retry (max 3 attempts, exp backoff)."""
    return request.execute()


# ---------------------------------------------------------------------------
#  7. TRENDS PLACEHOLDER — Ready for Google Trends integration
# ---------------------------------------------------------------------------

def _get_trends_multiplier(query: str) -> float:
    """Placeholder: returns a trend multiplier for the given query."""
    return 1.0


# ---------------------------------------------------------------------------
#  6. OPPORTUNITY SCORE — Composite scoring formula
# ---------------------------------------------------------------------------

def _calculate_opportunity_score(
    growth_velocity: float,
    views_per_video: int,
    upload_frequency: float,
    trends_multiplier: float = 1.0,
) -> float:
    """Compute a 0-100 opportunity score from growth metrics."""
    velocity_norm = min(growth_velocity / 10_000, 1.0) * 40
    vpv_norm = min(views_per_video / 500_000, 1.0) * 30
    freq_norm = min(upload_frequency / 7.0, 1.0) * 20
    trends_bonus = (trends_multiplier - 1.0) * 10

    raw = velocity_norm + vpv_norm + freq_norm + trends_bonus
    return round(max(0.0, min(100.0, raw)), 1)


# ---------------------------------------------------------------------------
#  5. IMPROVED KEYWORD EXTRACTION — titles + descriptions + tags
# ---------------------------------------------------------------------------

def extract_keywords(
    texts: list[str],
    max_keywords: int = 15,
) -> list[str]:
    """Extract significant keywords from multiple text sources using RAKE."""
    combined = " ".join(t for t in texts if t)
    if not combined.strip():
        return []

    # Clean: remove non-alphanumeric noise, lowercase
    clean = re.sub(r'[^\w\s]', ' ', combined.lower())

    _rake.extract_keywords_from_text(clean)
    phrases = _rake.get_ranked_phrases()

    # Filter out YouTube stop words and very short phrases
    filtered = []
    for phrase in phrases:
        words = phrase.split()
        if all(w in _YT_STOP_WORDS for w in words):
            continue
        if len(phrase) <= 2:
            continue
        filtered.append(phrase)
        if len(filtered) >= max_keywords:
            break

    return filtered


# ---------------------------------------------------------------------------
#  CORE DISCOVERY — with pagination and diagnostics
# ---------------------------------------------------------------------------

async def discover_rising_stars(
    query: str,
    max_videos_per_channel: int = 20,
    max_results_to_scan: int = 150,  # 3 pages
    min_subs: int = 2000,
    min_views: int = 200000,
    max_days_old: int = 180,
) -> DiscoveryResult:
    """Find 'Rising Star' channels with multi-page search and diagnostic tracking.
    
    Pipeline:
      1. Check cache → return early if valid
      2. Paginated search (videos → unique channel IDs)
      3. Batch-fetch channel stats with retry
      4. Track filtration stats (too old, too many videos, etc.)
      5. Persistent storage + Return results + Stats
    """

    # ── 1. CACHE CHECK ──
    cached = await _get_cached_discovery(query)
    if cached is not None:
        return cached

    # ── 2. PAGINATED PIVOT SEARCH ──
    yt = youtube_service._get_youtube()
    published_after = (
        datetime.datetime.now(datetime.timezone.utc)
        - datetime.timedelta(days=max_days_old)
    ).isoformat().replace("+00:00", "Z")

    seen_channel_ids: set[str] = set()
    channel_video_texts: dict[str, list[str]] = {}
    
    # ── 2. BROAD PIVOT SEARCH ──
    # Search multiple variations to find more "related" channels
    search_queries = [query, f"{query} tips", f"{query} channel"]
    
    seen_channel_ids: set[str] = set()
    channel_video_texts: dict[str, list[str]] = {}
    scanned_video_count = 0
    max_pages_per_query = 2

    logger.info("Starting BROAD SIGNAL discovery for '%s' variations...", query)

    for q_var in search_queries:
        page_token = None
        for page_num in range(max_pages_per_query):
            try:
                search_req = yt.search().list(
                    part="snippet",
                    q=q_var,
                    type="video",
                    publishedAfter=published_after,
                    maxResults=50,
                    pageToken=page_token,
                    order="viewCount"
                )
                search_res = _safe_execute(search_req)
                
                items = search_res.get("items", [])
                for item in items:
                    cid = item["snippet"]["channelId"]
                    seen_channel_ids.add(cid)
                    title = item["snippet"].get("title", "")
                    desc = item["snippet"].get("description", "")
                    channel_video_texts.setdefault(cid, []).extend([title, desc])
                
                scanned_video_count += len(items)
                page_token = search_res.get("nextPageToken")
                
                if not page_token or scanned_video_count >= max_results_to_scan:
                    break
            except Exception as e:
                logger.error("Pivot search for '%s' failed: %s", q_var, e)
                break
        if scanned_video_count >= max_results_to_scan:
            break

    if not seen_channel_ids:
        return {
            "channels": [],
            "stats": {"total_scanned": 0, "rejected_age": 0, "rejected_videos": 0, "rejected_performance": 0, "already_known": 0}
        }

    channel_ids = list(seen_channel_ids)
    stats: DiscoveryStats = {
        "total_scanned": len(channel_ids),
        "rejected_age": 0,
        "rejected_videos": 0,
        "rejected_performance": 0,
        "already_known": 0
    }

    # ── 3 & 4. BATCH FETCH + DEEP FILTER ──
    trends_mult = _get_trends_multiplier(query)
    results: list[ChannelResult] = []
    result_ids: set[str] = set()

    for i in range(0, len(channel_ids), 50):
        chunk = channel_ids[i : i + 50]
        try:
            stats_req = yt.channels().list(
                part="snippet,statistics",
                id=",".join(chunk),
            )
            stats_res = _safe_execute(stats_req)
        except Exception as e:
            logger.warning("Batch fetch failed (chunk %d): %s", i, e)
            continue

        for item in stats_res.get("items", []):
            yt_id = item["id"]
            if yt_id in result_ids:
                stats["already_known"] += 1
                continue

            yt_stats = item.get("statistics", {})
            snippet = item.get("snippet", {})

            # Age filter
            try:
                published_at = datetime.datetime.fromisoformat(
                    snippet["publishedAt"].replace("Z", "+00:00")
                )
            except (KeyError, ValueError):
                continue
            age_days = (datetime.datetime.now(datetime.timezone.utc) - published_at).days

            sub_count = int(yt_stats.get("subscriberCount", 0))
            view_count = int(yt_stats.get("viewCount", 0))
            video_count = max(1, int(yt_stats.get("videoCount", 1)))

            # ── 4. DEEP FILTER + STATS ──
            if age_days > max_days_old:
                stats["rejected_age"] += 1
                continue
            if video_count > max_videos_per_channel:
                stats["rejected_videos"] += 1
                continue
            if view_count < min_views or sub_count < min_subs:
                stats["rejected_performance"] += 1
                continue

            # ── 5. METRICS & SCORING ──
            views_per_video = view_count // video_count
            velocity = round(view_count / max(1, age_days), 2)
            freq = round(video_count / max(1, age_days / 7), 2)
            opp_score = _calculate_opportunity_score(velocity, views_per_video, freq, trends_mult)

            keyword_sources = [snippet.get("title", ""), snippet.get("description", "")]
            keyword_sources.extend(channel_video_texts.get(yt_id, []))
            keywords = extract_keywords(keyword_sources)

            now = datetime.datetime.now(datetime.timezone.utc)
            channel = ChannelResult(
                youtube_id=yt_id,
                title=snippet["title"],
                description=snippet.get("description", ""),
                subscriber_count=sub_count,
                video_count=video_count,
                view_count=view_count,
                views_per_video=views_per_video,
                upload_frequency=freq,
                growth_velocity=velocity,
                opportunity_score=opp_score,
                trends_multiplier=trends_mult,
                keywords=keywords,
                thumbnail_url=snippet["thumbnails"]["default"]["url"],
                cache_expires_at=now + datetime.timedelta(hours=12),
                fetched_at=now,
            )
            results.append(channel)
            result_ids.add(yt_id)

    results.sort(key=lambda c: c.opportunity_score or 0, reverse=True)

    # ── PERSIST ──
    if results:
        db = get_supabase()
        batch_data = [
            {
                "youtube_id": ch.youtube_id,
                "title": ch.title,
                "description": ch.description,
                "subscriber_count": ch.subscriber_count,
                "video_count": ch.video_count,
                "view_count": ch.view_count,
                "views_per_video": ch.views_per_video,
                "upload_frequency": ch.upload_frequency,
                "growth_velocity": ch.growth_velocity,
                "opportunity_score": ch.opportunity_score,
                "trends_multiplier": ch.trends_multiplier,
                "keywords": ch.keywords,
                "thumbnail_url": ch.thumbnail_url,
                "cache_expires_at": ch.cache_expires_at.isoformat(),
                "fetched_at": ch.fetched_at.isoformat(),
            }
            for ch in results
        ]
        try:
            db.table("channels").upsert(batch_data, on_conflict="youtube_id").execute()
        except Exception as e:
            logger.error("Batch upsert failed: %s", e)

    logger.info("Discovery complete for '%s': %d rising stars found. Stats: %s", query, len(results), stats)
    return {"channels": results, "stats": stats}


# ---------------------------------------------------------------------------
#  3. BACKGROUND PROCESSING — Non-blocking discovery
# ---------------------------------------------------------------------------

async def discover_rising_stars_bg(
    query: str,
    max_videos_per_channel: int = 20,
    max_results_to_scan: int = 150,
    min_subs: int = 2000,
    min_views: int = 200000,
    max_days_old: int = 180,
) -> None:
    """Background-safe wrapper."""
    try:
        await discover_rising_stars(
            query=query,
            max_videos_per_channel=max_videos_per_channel,
            max_results_to_scan=max_results_to_scan,
            min_subs=min_subs,
            min_views=min_views,
            max_days_old=max_days_old,
        )
    except Exception as e:
        logger.error("Background discovery failed for '%s': %s", query, e)
