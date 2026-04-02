"""AI Service — Production-grade OpenAI wrapper for 3 AI systems.

Systems:
  1. Niche Generator  — category → 20-50 sub-niches with scoring
  2. Video Analyzer    — video data → forensic content analysis
  3. Idea Generator    — niche → full video concepts with scripts + keywords
"""

import json
import logging
import re
from openai import AsyncOpenAI
from app.config import get_settings
from app.services.prompts import (
    niche_generator_prompt,
    video_analyzer_prompt,
    idea_generator_prompt,
)

logger = logging.getLogger(__name__)

def _get_client() -> AsyncOpenAI:
    settings = get_settings()
    # Use OpenRouter if key is provided, else fallback to standard OpenAI
    if settings.openrouter_api_key and settings.openrouter_api_key.startswith("sk-or"):
        logger.info("Initializing AI client with OpenRouter (https://openrouter.ai/api/v1)")
        return AsyncOpenAI(
            api_key=settings.openrouter_api_key,
            base_url="https://openrouter.ai/api/v1",
            default_headers={
                "HTTP-Referer": "https://github.com/nichescope", # Optional but recommended by OpenRouter
                "X-Title": "NicheScope YouTube Platform",
            }
        )
    
    logger.info("Initializing AI client with direct OpenAI (https://api.openai.com/v1)")
    return AsyncOpenAI(api_key=settings.openai_api_key)


async def _call_ai_with_fallback(
    system: str,
    user: str,
    temperature: float = 0.7,
) -> str:
    """Make an AI chat completion call with automatic model fallback."""
    settings = get_settings()
    models = [m.strip() for m in settings.ai_model_priority.split(",")]
    client = _get_client()
    
    last_error = None
    for model_id in models:
        try:
            # Add strict JSON requirement to system prompt for non-OpenAI models
            if "openai" not in model_id.lower():
                system += "\n\nCRITICAL: You MUST return a valid JSON object ONLY. Do not include any preamble, markdown formatting, or explanation."

            # Handle Model ID formatting
            model_to_use = model_id
            is_openrouter = "openrouter" in str(client.base_url)
            
            # If using direct OpenAI, strip the "openai/" prefix if present
            if not is_openrouter and model_to_use.startswith("openai/"):
                model_to_use = model_to_use.replace("openai/", "")
                logger.debug("Stripping prefix for direct OpenAI call: %s -> %s", model_id, model_to_use)

            logger.info("Attempting AI call with model: %s", model_to_use)
            
            # Prepare arguments
            kwargs = {
                "model": model_to_use,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                "temperature": temperature,
            }

            # Only use json_object for OpenAI models or specific high-end providers
            if "openai" in model_id.lower() or "anthropic" in model_id.lower():
                kwargs["response_format"] = {"type": "json_object"}

            response = await client.chat.completions.create(**kwargs)
            
            content = response.choices[0].message.content
            # Clean up potential markdown code blocks if the model ignored instructions
            if content.startswith("```"):
                content = re.sub(r"```(json)?", "", content).strip("`").strip()
                
            return content

        except Exception as e:
            logger.warning("Model %s failed: %s. Trying next...", model_id, e)
            last_error = e
            continue
            
    # If all models fail
    logger.error("All models in priority list failed. Last error: %s", last_error)
    raise last_error or Exception("AI fallback system exhausted all models.")


def _extract_list(raw_json: str, fallback_key: str = "") -> list[dict]:
    """Parse JSON response and extract the list, handling multiple formats."""
    parsed = json.loads(raw_json)
    if isinstance(parsed, list):
        return parsed
    if isinstance(parsed, dict):
        # Try the expected key first, then any list value
        if fallback_key and fallback_key in parsed:
            val = parsed[fallback_key]
            if isinstance(val, list):
                return val
        for value in parsed.values():
            if isinstance(value, list):
                return value
    return []


def _extract_dict(raw_json: str) -> dict:
    """Parse JSON response and return the dict."""
    parsed = json.loads(raw_json)
    if isinstance(parsed, dict):
        return parsed
    return {}


# (Replaced by _call_ai_with_fallback)


# ===========================================================================
#  1. NICHE GENERATOR
# ===========================================================================

async def generate_niche_list(category: str, count: int = 30) -> list[dict]:
    """Generate a deep list of YouTube sub-niches for a given category.

    Returns list of dicts with keys:
        name, description, competition_level, target_audience,
        monetization_potential, content_format, example_titles, growth_strategy
    """
    prompt = niche_generator_prompt(category, count)

    try:
        raw = await _call_ai_with_fallback(
            system=prompt["system"],
            user=prompt["user"],
            temperature=0.85,
        )
        niches = _extract_list(raw, fallback_key="niches")
        logger.info("Generated %d niches for category '%s'", len(niches), category)
        return niches
    except Exception as e:
        logger.error("Niche generation failed for '%s': %s", category, e)
        return []


# ===========================================================================
#  2. VIDEO ANALYZER
# ===========================================================================

async def analyze_video(
    title: str,
    description: str = "",
    view_count: int = 0,
    like_count: int = 0,
    channel_name: str = "",
    niche: str = "",
) -> dict:
    """Perform a forensic analysis of a YouTube video.

    Returns dict with keys:
        hook_type, hook_analysis, structure, emotion_triggers,
        viral_factors, improvement_suggestions, overall_score
    """
    prompt = video_analyzer_prompt(
        title=title,
        description=description,
        view_count=view_count,
        like_count=like_count,
        channel_name=channel_name,
        niche=niche,
    )

    try:
        raw = await _call_ai_with_fallback(
            system=prompt["system"],
            user=prompt["user"],
            temperature=0.6,
        )
        analysis = _extract_dict(raw)
        logger.info("Analyzed video: '%s' — score: %s", title, analysis.get("overall_score"))
        return analysis
    except Exception as e:
        logger.error("Video analysis failed for '%s': %s", title, e)
        return {}


# ===========================================================================
#  3. IDEA GENERATOR
# ===========================================================================

async def generate_video_ideas(
    niche: str,
    reference_videos: list[str] | None = None,
    count: int = 5,
    audience_level: str = "intermediate",
) -> list[dict]:
    """Generate complete video concepts with full scripts 和 SEO keywords.

    Returns list of dicts with keys:
        title, title_alt, hook, thumbnail_concept, script_outline,
        keywords, target_length_minutes, best_upload_time,
        appeal_score, monetization_angle
    """
    prompt = idea_generator_prompt(
        niche=niche,
        reference_videos=reference_videos,
        count=count,
        audience_level=audience_level,
    )

    try:
        raw = await _call_ai_with_fallback(
            system=prompt["system"],
            user=prompt["user"],
            temperature=0.9,
        )
        ideas = _extract_list(raw, fallback_key="ideas")
        logger.info("Generated %d video ideas for niche '%s'", len(ideas), niche)
        return ideas
    except Exception as e:
        logger.error("Idea generation failed for niche '%s': %s", niche, e)
        return []
