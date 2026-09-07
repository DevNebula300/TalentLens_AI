import threading

_db_init_lock = threading.Lock()
_db_initialized = False


def ensure_database_ready() -> None:
    """Lazy one-time schema setup — safe to call on first API request."""
    global _db_initialized
    if _db_initialized:
        return

    with _db_init_lock:
        if _db_initialized:
            return

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
        _db_initialized = True
