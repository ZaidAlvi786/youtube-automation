"""Niche Engine — Orchestrates niche generation, scoring, and persistence."""

import datetime
from cachetools import TTLCache, cached
from app.services import ai_service
from app.models.niche import NicheResult
from app.db.supabase_client import get_supabase

# Competition → numeric weight for scoring
_COMPETITION_WEIGHTS = {"low": 1.0, "medium": 0.6, "high": 0.3}

# In-memory cache for niche lists (10 minute TTL)
_niche_cache = TTLCache(maxsize=100, ttl=600)


def _calculate_monetization_score(raw: dict) -> float:
    """Estimate monetization potential based on niche profile."""
    # CPM Factors (High = Finance, Tech; Low = Comedy, Kids)
    # AI provides 'target_audience' and 'description' which we could parse
    # For MVP, we'll assign a base based on AI's competition and description
    # This can be refined once we fetch real channel data
    return round(float(raw.get("monetization_potential", 5.0)), 1)


def _get_trends_score(niche_name: str) -> float:
    """Calculate trend multiplier (Placeholder for Google Trends API)."""
    # In a full version, this would call a trends service
    # 1.0 is neutral, >1.0 is trending up, <1.0 is trending down
    return 1.0


def _score_niche(raw: dict, trends_multiplier: float) -> float:
    """Compute a composite viability score (0-100)."""
    competition = raw.get("competition_level", raw.get("competition", "medium")).lower()
    weight = _COMPETITION_WEIGHTS.get(competition, 0.5)
    
    monetization = _calculate_monetization_score(raw)
    
    # Formula: (Competition Weight * 60) + (Monetization * 4) + (Trends Adjustment)
    base_score = (weight * 60) + (monetization * 4)
    final_score = base_score * trends_multiplier
    
    return round(min(100.0, final_score), 1)


async def generate_niches(category: str, count: int = 10) -> list[NicheResult]:
    """Generate, score, rank, and persist niches for a category."""
    db = get_supabase()

    # 1. Check DB Cache First (last 7 days, not deleted)
    threshold = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=7)).isoformat()
    existing = db.table("niches").select("*").eq("category", category).eq("is_deleted", False).gt("created_at", threshold).execute()
    if existing.data:
        return [NicheResult(**row) for row in existing.data]

    # 2. Generate via AI
    raw_niches = await ai_service.generate_niche_list(category, count)

    results: list[NicheResult] = []
    for raw in raw_niches:
        # Get Trends Signal (simulated)
        trends_mult = _get_trends_score(raw.get("name", ""))
        
        score = _score_niche(raw, trends_mult)
        monetization = _calculate_monetization_score(raw)
        
        niche = NicheResult(
            category=category,
            name=raw.get("name", "Unnamed"),
            description=raw.get("description"),
            competition_level=raw.get("competition", "medium").lower(),
            score=score,
            monetization_score=monetization,
            trends_score=trends_mult,
        )
        results.append(niche)

    # Sort by score descending
    results.sort(key=lambda n: n.score, reverse=True)

    # 3. Persist to Supabase
    for niche in results:
        resp = (
            db.table("niches")
            .insert(
                {
                    "category": niche.category,
                    "name": niche.name,
                    "description": niche.description,
                    "competition_level": niche.competition_level,
                    "score": niche.score,
                    "monetization_score": niche.monetization_score,
                    "trends_score": niche.trends_score,
                }
            )
            .execute()
        )
        if resp.data:
            niche.id = resp.data[0]["id"]

    return results


@cached(_niche_cache)
async def get_niches(category: str | None = None) -> list[NicheResult]:
    """Fetch saved niches from DB with in-memory caching and soft-delete filtering."""
    db = get_supabase()
    query = db.table("niches").select("*").eq("is_deleted", False).order("score", desc=True)

    if category:
        query = query.eq("category", category)

    resp = query.execute()
    return [NicheResult(**row) for row in resp.data]
