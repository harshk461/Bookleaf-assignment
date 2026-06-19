from fastapi import APIRouter
from app.models.requests import ClassifyRequest, ClassifyResponse
from app.services.classify_service import classify_ticket

router = APIRouter()


@router.post("/classify", response_model=ClassifyResponse)
def classify(req: ClassifyRequest):
    return classify_ticket(req)
