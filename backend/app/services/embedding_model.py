"""Shared embedding model — loaded once, lazily, to cut Railway RAM cost."""

from __future__ import annotations

from typing import Any

_model: Any | None = None


def get_embedding_model():
    """Return a singleton SentenceTransformer (all-MiniLM-L6-v2)."""
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer

        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model
