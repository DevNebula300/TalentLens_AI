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


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(resume_router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}