from fastapi import FastAPI
from app.routers import health, classify, draft

app = FastAPI(title="BookLeaf AI Service", docs_url=None, redoc_url=None)

app.include_router(health.router)
app.include_router(classify.router)
app.include_router(draft.router)
