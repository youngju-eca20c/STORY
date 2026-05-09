from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.api import router as api_router


app = FastAPI(
    title="React FastAPI Starter",
    version="0.1.0",
    description="A small FastAPI backend for a React frontend without a database.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api", tags=["api"])


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "FastAPI backend is running. Visit /docs for API docs."}
