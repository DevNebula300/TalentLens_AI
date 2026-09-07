import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Intentionally empty: DB init is lazy so Railway can bind $PORT immediately.
    yield


app = FastAPI(
    title="Talent Lens",
    description="AI powered resume analysis and scoring",
    version="1.0.0",
    lifespan=lifespan,
)

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


from app.api.routes.resume import router as resume_router  # noqa: E402

app.include_router(resume_router)
