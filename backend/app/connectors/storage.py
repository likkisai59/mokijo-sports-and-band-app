"""
storage.py — S3/R2 Cloud storage wrapper using boto3.
"""

from fastapi import HTTPException, Request
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from urllib.parse import urlparse
import json
from datetime import datetime

from app.core.config import get_settings
from app.logger import logger

settings = get_settings()


class CloudStorage:
    def __init__(self):
        """
        Initialize the Cloudflare R2 client using CF S3-compatible credentials.
        """
        # Read from settings or fallback to dummy values to avoid crashes on init
        access_key = getattr(settings, "CF_S3_ACCESS_KEY", None) or "dummy_access_key"
        secret_key = getattr(settings, "CF_S3_SECRET_KEY", None) or "dummy_secret_key"
        endpoint_url = getattr(settings, "CF_S3_ENDPOINT_URL", None) or "https://dummy.r2.cloudflarestorage.com"

        try:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key,
                endpoint_url=endpoint_url,
                region_name="auto",
                config=Config(signature_version='s3v4')
            )
        except Exception as e:
            logger.log_error_sync(message=f"Could not initialize CloudStorage: {e}")
            self.s3_client = None

        self._public_base_url = "https://assets.learningpadedu.com"

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if hasattr(self, 's3_client') and self.s3_client:
            logger.log_message_sync(message="Cloudflare R2 Client Closed")

    def get_cloudstorage_driver(self):
        return self.s3_client
    
    def get_buckets_list(self):
        if not self.s3_client:
            return []
        return [item.name for item in list(self.s3_client.list_buckets())]
    
    async def upload_object(
        self,
        request: Request,
        bucket_name: str,
        object_cloud_path: str,
        object_local_path: str,
        make_public: bool = False
    ):
        if not self.s3_client:
            raise HTTPException(status_code=503, detail="Storage service is unavailable.")

        try:
            await logger.log_message(request=request, message=f"Starting upload for file: {object_local_path}")
            try:
                self.s3_client.head_bucket(Bucket=bucket_name)
            except ClientError as e:
                if e.response['Error']['Code'] == 'AccessDenied':
                    raise HTTPException(
                        status_code=403,
                        detail=f"Access denied: {str(e)}. Please check IAM permissions."
                    )
                raise HTTPException(
                    status_code=404,
                    detail=f"Bucket '{bucket_name}' not found or access denied: {str(e)}"
                )
            
            content_type = self._get_content_type(object_cloud_path)
            
            if content_type:
                await logger.log_message(request=request, message=f"Detected content type: {content_type}")
                extra_args = {'ContentType': content_type}
                await logger.log_message(request=request, message="Uploading file to S3 with content type")
                self.s3_client.upload_file(
                    object_local_path, 
                    bucket_name, 
                    object_cloud_path,
                    ExtraArgs=extra_args
                )
            else:
                await logger.log_message(request=request, message="Uploading file to S3 without content type")
                self.s3_client.upload_file(
                    object_local_path, 
                    bucket_name, 
                    object_cloud_path
                )
            
            await logger.log_message(request=request, message=f"Cloudflare R2 object uploaded successfully: {object_cloud_path}")
            return f"{self._public_base_url}/{object_cloud_path}"

        except FileNotFoundError as e:
            error_message = f"File not found: {e}"
            await logger.log_error(request=request, message=error_message)
            raise e
        except Exception as e:
            error_message = f"Failed to upload file: {str(e)}"
            await logger.log_error(request=request, message=error_message)
            raise e
    
    def _get_content_type(self, file_path: str) -> str:
        extension = file_path.lower().split('.')[-1]
        
        content_types = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg', 
            'webp': 'image/webp',
            'svg': 'image/svg+xml',
            'html': 'text/html',
            'htm': 'text/html',
            'json': 'application/json',
            'pdf': 'application/pdf',
            'txt': 'text/plain',
            'csv': 'text/csv',
        }
        
        return content_types.get(extension)
    
    def get_public_url(self, object_cloud_path: str) -> str:
        return f"{self._public_base_url}/{object_cloud_path}"

    async def create_signed_url(self, request: Request, bucket_name: str, object_cloud_path: str):
        if not self.s3_client:
            raise HTTPException(status_code=503, detail="Storage service is unavailable.")

        try:
            await logger.log_message(request=request, message=f"Attempting to generate signed URL for object: {object_cloud_path}")
            signed_url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': bucket_name, 'Key': object_cloud_path},
                ExpiresIn=3600
            )
            await logger.log_message(request=request, message=f"Signed URL generated for object: {object_cloud_path}")
            return signed_url
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to generate signed URL: {str(e)}")
            raise e

    async def create_download_url(self, request: Request, bucket_name: str, object_cloud_path: str, filename: str = None, expiration: int = 3600):
        if not self.s3_client:
            raise HTTPException(status_code=503, detail="Storage service is unavailable.")

        try:
            await logger.log_message(request=request, message=f"Attempting to generate download URL for object: {object_cloud_path}")
            
            if not filename:
                filename = object_cloud_path.split('/')[-1]
            
            params = {
                'Bucket': bucket_name,
                'Key': object_cloud_path,
                'ResponseContentDisposition': f'attachment; filename="{filename}"',
                'ResponseContentType': 'application/octet-stream'
            }
            
            signed_url = self.s3_client.generate_presigned_url(
                'get_object',
                Params=params,
                ExpiresIn=expiration
            )
            
            await logger.log_message(request=request, message=f"Download URL generated for object: {object_cloud_path} with filename: {filename}")
            return signed_url
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to generate download URL: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate download URL: {str(e)}"
            )
    
    async def check_file_exists(self, object_url: str) -> bool:
        if not self.s3_client:
            return False

        try:
            await logger.log_message(request=None, message=f"Checking existence of file at URL: {object_url}")

            parsed_url = urlparse(object_url)
            path_parts = parsed_url.path.split('/')
            
            path_parts = [part for part in path_parts if part]
            
            bucket_name = path_parts[0]
            object_path = '/'.join(path_parts[1:])
            
            self.s3_client.head_object(Bucket=bucket_name, Key=object_path)
            return True
        except ClientError as e:
            await logger.log_error(request=None, message=f"Error checking file existence: {str(e)}")
            return False
    
    async def delete_object(self, request: Request, bucket_name: str, object_path: str):
        if not self.s3_client:
            raise HTTPException(status_code=503, detail="Storage service is unavailable.")

        try:
            self.s3_client.delete_object(Bucket=bucket_name, Key=object_path)
            await logger.log_message(request=request, message=f"Successfully deleted object: {object_path}")
        except ClientError as e:
            await logger.log_error(request=request, message=f"Failed to delete object: {str(e)}")
            raise HTTPException(
                status_code=404,
                detail=f"Object '{object_path}' not found or could not be deleted: {str(e)}"
            )

    async def download_file_content(self, request: Request, bucket_name: str, object_cloud_path: str):
        if not self.s3_client:
            raise HTTPException(status_code=503, detail="Storage service is unavailable.")

        try:
            await logger.log_message(request=request, message=f"Downloading file content for object: {object_cloud_path}")
            
            response = self.s3_client.get_object(Bucket=bucket_name, Key=object_cloud_path)
            file_content = response['Body'].read()
            
            await logger.log_message(request=request, message=f"Successfully downloaded file content for object: {object_cloud_path}")
            return file_content
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchKey':
                await logger.log_error(request=request, message=f"File not found in S3: {object_cloud_path}")
                raise HTTPException(
                    status_code=404,
                    detail=f"File not found: {object_cloud_path}"
                )
            else:
                await logger.log_error(request=request, message=f"S3 error downloading file: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to download file from S3: {str(e)}"
                )
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to download file content: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to download file content: {str(e)}"
            )
