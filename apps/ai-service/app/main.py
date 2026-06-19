from fastapi import FastAPI
from app.config.settings import settings
from app.routers import health, classify, draft
from app.services.cost_tracker import init_tracker

init_tracker(settings.ai_spend_tracker_path)

app = FastAPI(title="BookLeaf AI Service", docs_url=None, redoc_url=None)

app.include_router(health.router)
app.include_router(classify.router)
app.include_router(draft.router)
