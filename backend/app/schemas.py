from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    service: str


class MessageRequest(BaseModel):
    name: str = Field(default="사용자", min_length=1, max_length=40)


class MessageResponse(BaseModel):
    message: str
