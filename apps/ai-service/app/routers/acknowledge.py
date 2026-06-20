from fastapi import APIRouter, HTTPException
from app.config.settings import settings
from app.models.requests import AcknowledgeRequest, AcknowledgeResponse
from app.services.acknowledge_service import acknowledge_ticket
from app.services.cost_tracker import is_over_budget

router = APIRouter()


@router.post("/acknowledge", response_model=AcknowledgeResponse)
def acknowledge(req: AcknowledgeRequest):
    if is_over_budget(settings.max_daily_spend_usd):
        raise HTTPException(status_code=503, detail="AI daily budget exceeded")
    return acknowledge_ticket(req)
