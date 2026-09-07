import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def _init_database() -> None:
    from sqlalchemy import text

    from app.database.connection import Base, engine
    from app.models import Analysis, Resume  # noqa: F401

    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))

    Base.metadata.create_all(bind=engine)

    with engine.begin() as conn:
        conn.execute(
            text(
                "ALTER TABLE resumes "
                "ADD COLUMN IF NOT EXISTS owner_id VARCHAR(36)"
            )
        )
        conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_resumes_owner_id "
                "ON resumes (owner_id)"
            )
        )


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Never block readiness forever if DB init fails — surface /health first.
    try:
        _init_database()
    except Exception as exc:  # noqa: BLE001
        print(f"[startup] database init failed: {exc}")
    yield


app = FastAPI(
    title="Talent Lens",
    description="AI powered resume analysis and scoring",
    version="1.0.0",
    lifespan=lifespan,
)

# Always allow the production Vercel app; merge with ALLOWED_ORIGINS from Railway.
default_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://talent-lens-ai-weld.vercel.app",
]
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "")
extra_origins = [
    origin.strip()
    for origin in allowed_origins_str.split(",")
    if origin.strip()
]
origins = list(dict.fromkeys([*default_origins, *extra_origins]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "ok"}


# Import routes after app/health exist so cold start reaches listen sooner.
from app.api.routes.resume import router as resume_router  # noqa: E402

app.include_router(resume_router)
