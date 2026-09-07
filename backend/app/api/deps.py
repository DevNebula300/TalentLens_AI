from uuid import UUID

from fastapi import Header, HTTPException, Query


def get_owner_id(
    owner_id: str | None = Query(default=None),
    x_owner_id: str | None = Header(default=None, alias="X-Owner-Id"),
) -> str:
    """Resolve browser-scoped owner token from query (preferred) or header."""
    raw = (owner_id or x_owner_id or "").strip()
    if not raw:
        raise HTTPException(
            status_code=401,
            detail="Missing owner identity. Refresh the page and try again.",
        )

    try:
        return str(UUID(raw))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid owner identity.") from exc
