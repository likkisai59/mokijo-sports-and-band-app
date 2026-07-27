"""
Structured file storage manager with abstract interface.
Supports AWS S3 and Local filesystem storage engines.
"""

import os
from abc import ABC, abstractmethod
from fastapi import UploadFile
from app.core.config import settings
from app.utils.image_upload import upload_file_generic

class BaseStorage(ABC):
    """Abstract storage class outlining core storage contract operations."""
    
    @abstractmethod
    async def upload(self, file: UploadFile, subfolder: str) -> str:
        """Upload a file to the active storage backend. Returns public url or file path."""
        pass
    
    @abstractmethod
    def delete(self, path: str) -> bool:
        """Delete a file from the active storage backend."""
        pass


class S3Storage(BaseStorage):
    """Storage client configured for AWS S3 backend."""
    def __init__(self):
        import boto3
        self.client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        self.bucket = settings.AWS_BUCKET_NAME

    async def upload(self, file: UploadFile, subfolder: str) -> str:
        return await upload_file_generic(file, subfolder)

    def delete(self, path: str) -> bool:
        key = path.replace(f"https://{self.bucket}.s3.{settings.AWS_REGION}.amazonaws.com/", "")
        try:
            self.client.delete_object(Bucket=self.bucket, Key=key)
            return True
        except Exception:
            return False


class LocalStorage(BaseStorage):
    """Storage client configured for local directory writes."""
    async def upload(self, file: UploadFile, subfolder: str) -> str:
        return await upload_file_generic(file, subfolder)

    def delete(self, path: str) -> bool:
        local_path = path.lstrip("/")
        if os.path.exists(local_path):
            try:
                os.remove(local_path)
                return True
            except OSError:
                return False
        return False


def get_storage() -> BaseStorage:
    """Dependency provider injecting the active storage strategy client."""
    if settings.USE_S3 and settings.AWS_BUCKET_NAME:
        return S3Storage()
    return LocalStorage()
