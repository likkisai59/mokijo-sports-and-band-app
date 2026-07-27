"""
Attachment upload validation and storage utility for Messaging.
Supports Images, Documents, Archives, Audio, and Video. Rejects executables.
"""

import os
import re
from fastapi import UploadFile, HTTPException, status
from app.core.storage import get_storage

ALLOWED_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_DOC_EXTS = {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt"}
ALLOWED_ARCHIVE_EXTS = {".zip"}
ALLOWED_AUDIO_EXTS = {".mp3", ".wav"}
ALLOWED_VIDEO_EXTS = {".mp4", ".mov", ".webm"}

FORBIDDEN_EXTS = {
    ".exe", ".sh", ".bat", ".cmd", ".dll", ".so", ".msi",
    ".js", ".vbs", ".ps1", ".scr", ".jar", ".apk", ".com",
    ".py", ".php", ".pl", ".bin", ".app"
}

MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024  # 25MB limit


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent directory traversal or invalid characters."""
    base = os.path.basename(filename)
    return re.sub(r"[^\w\.\-]", "_", base)


def determine_message_type_and_validate(file: UploadFile) -> tuple[str, str]:
    """
    Validate file extension, size, and type.
    Returns tuple: (message_type, file_extension)
    """
    filename = file.filename or "file"
    ext = os.path.splitext(filename)[1].lower()

    if ext in FORBIDDEN_EXTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Executable file type '{ext}' is forbidden.",
        )

    message_type = None
    if ext in ALLOWED_IMAGE_EXTS or (file.content_type and file.content_type.startswith("image/")):
        message_type = "IMAGE"
    elif ext in ALLOWED_DOC_EXTS or (file.content_type and ("pdf" in file.content_type or "word" in file.content_type or "excel" in file.content_type or "text" in file.content_type)):
        message_type = "DOCUMENT"
    elif ext in ALLOWED_AUDIO_EXTS or (file.content_type and file.content_type.startswith("audio/")):
        message_type = "AUDIO"
    elif ext in ALLOWED_VIDEO_EXTS or (file.content_type and file.content_type.startswith("video/")):
        message_type = "VIDEO"
    elif ext in ALLOWED_ARCHIVE_EXTS or (file.content_type and "zip" in file.content_type):
        message_type = "FILE"
    else:
        # Fallback for unrecognized extension
        message_type = "FILE"

    # Validate file size
    file.file.seek(0, os.SEEK_END)
    size = file.file.tell()
    file.file.seek(0)

    if size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is empty.",
        )

    if size > MAX_ATTACHMENT_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum allowed limit of 25MB.",
        )

    return message_type, ext, size


async def upload_attachment_file(file: UploadFile, subfolder: str = "attachments") -> dict:
    """
    Validate and store an attachment file.
    Returns dict containing attachment metadata.
    """
    message_type, ext, size = determine_message_type_and_validate(file)
    clean_filename = sanitize_filename(file.filename or f"attachment{ext}")

    storage = get_storage()
    file_url = await storage.upload(file, subfolder)

    return {
        "file_url": file_url,
        "filename": clean_filename,
        "size": size,
        "content_type": file.content_type or "application/octet-stream",
        "message_type": message_type,
    }
