from fastapi import APIRouter, HTTPException
from app.config.settings import settings
from app.models.requests import ClassifyRequest, ClassifyResponse
from app.services.classify_service import classify_ticket
from app.services.cost_tracker import is_over_budget

router = APIRouter()


@router.post("/classify", response_model=ClassifyResponse)
def classify(req: ClassifyRequest):
    if is_over_budget(settings.max_daily_spend_usd):
        raise HTTPException(status_code=503, detail="AI daily budget exceeded")
    return classify_ticket(req)
