import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.resume import router as resume_router
from app.database.connection import Base, engine
from app.models import Analysis, Resume  # noqa: F401


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Talent Lens",
    description="AI powered resume analysis and scoring",
    version="1.0.0",
)

# Parse ALLOWED_ORIGINS from environment, fallback to local dev ports
allowed_origins_str = os.getenv(
    "ALLOWED_ORIGINS", 
    "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001"
)
origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(resume_router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}