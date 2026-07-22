"""Local file upload helper for the Band module.

Saves uploaded files to ``backend/uploads/band/`` and returns a URL path
served by the static mount registered in app/main.py (``/band/uploads``).

This is intentionally simple and self-contained — it does not depend on the
project's CloudStorage (R2) wrapper, which is not invoked by any existing
route. If S3/R2 is desired later, swap the body of ``save_upload``.
"""

import os
import uuid
from pathlib import Path
from typing import Optional

from fastapi import HTTPException, UploadFile, status

_DEFAULT_UPLOAD_DIR = Path(__file__).resolve().parents[3] / "uploads" / "band"
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE_MB = 5


def _upload_dir() -> Path:
    upload_dir = Path(os.getenv("BAND_UPLOAD_DIR", str(_DEFAULT_UPLOAD_DIR)))
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


def save_upload(file: UploadFile, subfolder: str = "general") -> str:
    """Validate + persist an uploaded image, return its public URL path."""
    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {content_type}. Allowed: {sorted(ALLOWED_IMAGE_TYPES)}",
        )

    contents = file.file.read()
    max_bytes = MAX_FILE_SIZE_MB * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the {MAX_FILE_SIZE_MB}MB limit.",
        )

    ext = Path(file.filename or "").suffix.lower() or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    target_dir = _upload_dir() / subfolder
    target_dir.mkdir(parents=True, exist_ok=True)
    (target_dir / filename).write_bytes(contents)

    return f"/band/uploads/{subfolder}/{filename}"
