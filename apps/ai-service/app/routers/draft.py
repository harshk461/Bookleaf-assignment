from fastapi import APIRouter, HTTPException
from app.config.settings import settings
from app.models.requests import DraftRequest, DraftResponse
from app.services.cost_tracker import is_over_budget
from app.services.draft_service import draft_response

router = APIRouter()


@router.post("/draft", response_model=DraftResponse)
@router.post("/draft/", response_model=DraftResponse, include_in_schema=False)
def draft(req: DraftRequest):
    if is_over_budget(settings.max_daily_spend_usd):
        raise HTTPException(status_code=503, detail="AI daily budget exceeded")
    return draft_response(req)
