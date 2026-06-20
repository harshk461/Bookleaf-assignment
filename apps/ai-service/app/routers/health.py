import os

from fastapi import APIRouter
from app.config.settings import settings

router = APIRouter()


@router.get("/")
def root():
    return {"status": "ok", "service": "ai-service"}


@router.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ai-service",
        "port": int(os.environ.get("PORT", settings.port)),
        "geminiConfigured": bool(settings.gemini_api_key),
    }
