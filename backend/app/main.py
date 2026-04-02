"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.routers import niches, channels, videos, ideas, api, export
from app.config import get_settings

settings = get_settings()

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(
    title="YouTube Niche Intelligence Platform",
    description="MVP API for niche discovery, channel analysis, and video idea generation.",
    version="0.1.0",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — allow frontend (dynamic via settings)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register unified API router (flat endpoints)
app.include_router(api.router, prefix="/api", tags=["Unified API"])

# Register modular routers (backward-compatible)
app.include_router(niches.router, prefix="/api/niches", tags=["Niches"])
app.include_router(channels.router, prefix="/api/channels", tags=["Channels"])
app.include_router(videos.router, prefix="/api/videos", tags=["Videos"])
app.include_router(ideas.router, prefix="/api/ideas", tags=["Ideas"])
app.include_router(export.router, prefix="/api", tags=["Export"])


@app.get("/health")
async def health_check():
    return {"status": "ok"}
