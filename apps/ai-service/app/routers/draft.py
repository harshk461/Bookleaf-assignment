from fastapi import APIRouter
from app.models.requests import DraftRequest, DraftResponse
from app.services.draft_service import draft_response

router = APIRouter()


@router.post("/draft", response_model=DraftResponse)
def draft(req: DraftRequest):
    return draft_response(req)
