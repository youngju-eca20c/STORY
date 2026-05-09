from fastapi import APIRouter

from app.schemas import HealthResponse, MessageRequest, MessageResponse


router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(status="ok", service="fastapi")


@router.post("/message", response_model=MessageResponse)
def create_message(payload: MessageRequest) -> MessageResponse:
    return MessageResponse(message=f"안녕하세요, {payload.name}님! FastAPI에서 보낸 메시지입니다.")
