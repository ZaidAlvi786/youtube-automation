"""Prompt Templates — Production-grade prompts for all 3 AI systems.

Each template is a function that returns the system + user message pair.
This keeps prompts testable, versionable, and decoupled from the API layer.
"""


# ===========================================================================
#  1. NICHE GENERATOR — Category → 20-50 profitable sub-niches
# ===========================================================================

def niche_generator_prompt(category: str, count: int = 30) -> dict:
    """Build the prompt for deep niche generation."""

    system = """You are the world's #1 YouTube market intelligence analyst.
You have spent 10 years studying the YouTube algorithm, creator economics,
audience behavior patterns, and niche monetization across every category.

Your analysis is data-driven, specific, and actionable — never generic."""

    user = f"""TASK: Perform a deep niche analysis for the YouTube category "{category}".

Generate exactly {count} highly specific, profitable sub-niches that a new creator
could realistically dominate within 6-12 months.

REQUIREMENTS FOR EACH NICHE:
1. "name" — A precise, searchable niche name (NOT broad categories like "fitness tips")
2. "description" — 2-3 sentences explaining what content this niche covers and WHY it works
3. "competition_level" — "low", "medium", or "high" based on current creator saturation
4. "target_audience" — Specific demographic (age, interests, pain points)
5. "monetization_potential" — Score from 1-10 (10 = highest RPM/sponsorship potential)
6. "content_format" — Primary format that works (shorts, long-form, tutorials, vlogs, etc.)
7. "example_titles" — 3 example video titles that would perform well in this niche
8. "growth_strategy" — 1-2 sentences on how to break into this niche

QUALITY RULES:
- Each niche must be SPECIFIC enough to build a channel around
- Avoid generic niches everyone already knows about
- Include a mix of competition levels
- Prioritize niches with high monetization + low competition
- Consider trending topics and underserved audiences

OUTPUT: Return ONLY a JSON object with key "niches" containing an array of objects.
No markdown. No explanations outside the JSON."""

    return {"system": system, "user": user}


# ===========================================================================
#  2. VIDEO ANALYZER — Video data → deep content analysis
# ===========================================================================

def video_analyzer_prompt(
    title: str,
    description: str = "",
    view_count: int = 0,
    like_count: int = 0,
    channel_name: str = "",
    niche: str = "",
) -> dict:
    """Build the prompt for deep video analysis."""

    system = """You are a viral content forensic analyst who has reverse-engineered
over 10,000 viral YouTube videos. You can identify exactly WHY a video performed
the way it did by analyzing its title, structure, psychological triggers,
and audience manipulation techniques.

Your analysis is clinical, precise, and actionable."""

    metrics_section = ""
    if view_count > 0:
        metrics_section = f"""
PERFORMANCE METRICS:
- Views: {view_count:,}
- Likes: {like_count:,}
- Like/View ratio: {round(like_count / max(1, view_count) * 100, 2)}%
- Channel: {channel_name}"""

    niche_section = f'\nNICHE CONTEXT: This video is in the "{niche}" niche.' if niche else ""

    user = f"""TASK: Perform a forensic analysis of this YouTube video.

VIDEO TITLE: "{title}"
DESCRIPTION: "{description[:500]}"
{metrics_section}{niche_section}

Analyze and return a JSON object with these exact keys:

1. "hook_type" — Classify the hook strategy used in the title. Choose ONE:
   - "curiosity_gap" (withholds key information)
   - "shock_value" (unexpected or controversial claim)
   - "listicle" (numbered list format)
   - "how_to" (educational promise)
   - "story" (narrative or personal experience)
   - "challenge" (dare or challenge format)
   - "comparison" (X vs Y)
   - "transformation" (before/after)
   - "authority" (expert or credential-based)
   - "urgency" (time-sensitive or fear-based)

2. "hook_analysis" — 2-3 sentences explaining WHY this hook works psychologically

3. "structure" — Object with:
   - "type": "tutorial" | "story" | "listicle" | "reaction" | "documentary" | "vlog" | "review" | "commentary"
   - "estimated_segments": Array of objects, each with "name" and "purpose" (e.g., hook, problem, solution, CTA)
   - "pacing": "fast" | "medium" | "slow"

4. "emotion_triggers" — Array of objects, each with:
   - "emotion": The emotion exploited (curiosity, fear, aspiration, outrage, nostalgia, etc.)
   - "technique": How it's triggered (1 sentence)
   - "intensity": 1-10

5. "viral_factors" — Object with:
   - "primary_reason": The #1 reason this video got traction (1-2 sentences)
   - "shareability_score": 1-10
   - "rewatchability_score": 1-10
   - "algorithm_signals": Array of strings (what signals this sends to YouTube's algo)

6. "improvement_suggestions" — Array of 3 specific, actionable improvements

7. "overall_score" — 1-100 composite quality score

OUTPUT: Return ONLY a JSON object. No markdown. No text outside JSON."""

    return {"system": system, "user": user}


# ===========================================================================
#  3. IDEA GENERATOR — Niche → full video concepts with scripts
# ===========================================================================

def idea_generator_prompt(
    niche: str,
    reference_videos: list[str] | None = None,
    count: int = 5,
    audience_level: str = "intermediate",
) -> dict:
    """Build the prompt for comprehensive video idea generation with full scripts."""

    system = """You are an elite YouTube content architect who has helped channels
grow from 0 to 1M+ subscribers. You combine deep knowledge of the YouTube algorithm
with proven storytelling frameworks, SEO optimization, and audience psychology.

You create video concepts that are impossible to scroll past."""

    ref_section = ""
    if reference_videos:
        ref_list = "\n".join(f"  - \"{v}\"" for v in reference_videos[:10])
        ref_section = f"""

REFERENCE VIDEOS (top performers in this niche — use as inspiration, NOT copies):
{ref_list}
Analyze what makes these titles work and create something BETTER."""

    user = f"""TASK: Create {count} complete, production-ready video concepts for the niche "{niche}".
Target audience level: {audience_level}.
{ref_section}

For EACH video idea, return a JSON object with:

1. "title" — An irresistible, algorithm-optimized YouTube title (under 60 chars)
   - Must contain a hook, a promise, and ideally a power word
   - A/B test worthy — include a "title_alt" alternative version

2. "title_alt" — Alternative title for A/B testing

3. "hook" — The exact first 2 sentences the creator should say in the video
   (this determines 70% of retention — make it count)

4. "thumbnail_concept" — 1-2 sentences describing the ideal thumbnail
   (colors, text overlay, facial expression, composition)

5. "script_outline" — Full script structure as an array of objects:
   Each segment has:
   - "section": Name (e.g., "Cold Open", "Problem Setup", "Solution", "CTA")
   - "duration_seconds": Estimated length
   - "content": 2-4 sentences of what to say/show
   - "visual_notes": What should be on screen
   - "retention_technique": How to keep viewers watching through this part

6. "keywords" — Array of 8-12 SEO keywords/phrases for:
   - Title optimization
   - Description stuffing
   - Tag targeting
   (ordered by search volume priority)

7. "target_length_minutes" — Ideal video length for this content

8. "best_upload_time" — Suggested day + time based on niche audience

9. "appeal_score" — 1-10 estimated viral potential with 1-sentence justification

10. "monetization_angle" — How this video can be monetized beyond AdSense
    (sponsorship type, affiliate potential, product tie-in)

QUALITY RULES:
- Every title must pass the "would I click this?" test
- Scripts should follow proven retention frameworks (hook → problem → solution → CTA)
- Keywords must be real, searchable terms (not made-up phrases)
- Each idea must be DISTINCT — no overlapping concepts
- Think about what's MISSING in the niche, not what already exists

OUTPUT: Return ONLY a JSON object with key "ideas" containing an array.
No markdown. No explanations outside the JSON."""

    return {"system": system, "user": user}
