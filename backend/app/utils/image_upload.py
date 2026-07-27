"""
File upload utilities supporting local filesystem storage or AWS S3 integration.
"""

import os
import uuid
import boto3
from fastapi import UploadFile, HTTPException, status
from loguru import logger
from app.core.config import settings

def validate_image_file(file: UploadFile):
    """Validate file content type and size limits for image uploads."""
    if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Allowed types: {', '.join(settings.ALLOWED_IMAGE_TYPES)}"
        )
    
    file.file.seek(0, os.SEEK_END)
    size = file.file.tell()
    file.file.seek(0)
    
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum size of {settings.MAX_FILE_SIZE_MB}MB."
        )

async def upload_file_generic(file: UploadFile, subfolder: str = "general") -> str:
    """
    Upload any validated file to S3 or local filesystem.
    Returns the file access URL path.
    """
    file_ext = os.path.splitext(file.filename or "file")[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"

    if settings.USE_S3 and settings.AWS_BUCKET_NAME:
        try:
            s3_client = boto3.client(
                "s3",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION
            )
            key = f"{subfolder}/{unique_filename}"
            s3_client.upload_fileobj(
                file.file,
                settings.AWS_BUCKET_NAME,
                key,
                ExtraArgs={"ContentType": file.content_type or "application/octet-stream"}
            )
            return f"https://{settings.AWS_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
        except Exception as e:
            logger.error(f"S3 upload failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="File upload failed on cloud storage."
            )
    else:
        upload_path = os.path.join(settings.UPLOAD_DIR, subfolder)
        os.makedirs(upload_path, exist_ok=True)
        
        full_path = os.path.join(upload_path, unique_filename)
        try:
            with open(full_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            return f"/{settings.UPLOAD_DIR}/{subfolder}/{unique_filename}"
        except Exception as e:
            logger.error(f"Local file write failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="File upload failed on local storage."
            )

async def upload_image(file: UploadFile, subfolder: str = "general") -> str:
    """
    Validate and upload an image file.
    Returns the file URL or local path.
    """
    validate_image_file(file)
    return await upload_file_generic(file, subfolder)
