from uuid import UUID

from fastapi import Header, HTTPException


OWNER_HEADER = "X-Owner-Id"


def get_owner_id(x_owner_id: str | None = Header(default=None, alias=OWNER_HEADER)) -> str:
    """Require a browser-scoped owner token on every resume API call."""
    if not x_owner_id or not x_owner_id.strip():
        raise HTTPException(
            status_code=401,
            detail="Missing owner identity. Refresh the page and try again.",
        )

    owner_id = x_owner_id.strip()
    try:
        return str(UUID(owner_id))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid owner identity.") from exc
