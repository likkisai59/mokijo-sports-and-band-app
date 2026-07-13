"""
jwt.py — JWT token creation and verification.

Uses python-jose for decode/verify with HS256 algorithm.
"""

from fastapi import HTTPException, Request, status
from datetime import datetime, timedelta
from jose import JWTError, jwt, ExpiredSignatureError

from app.core.config import get_settings
from app.logger import logger

settings = get_settings()


class JWTManager:
    """
    JWT Manager — handles token creation and verification.
    """

    def __init__(self):
        logger.log_message_sync(message="Initializing JWTManager")
        self.ALGORITHM = "HS256"

    async def create_access_token(self, request: Request, data: dict, expires_delta: timedelta = None) -> str:
        """
        Create a JWT access token.
        """
        logger.log_message_sync(message="Creating access token")
        try:
            await logger.log_message(request=request, message=f"Generating token with data: {data}")
            to_encode = data.copy()
            expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
            to_encode.update({"exp": expire})
            encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=self.ALGORITHM)
            await logger.log_message(request=request, message="Access token created successfully")
            return encoded_jwt
        except Exception as e:
            await logger.log_error(request=request, message=f"Error creating access token: {str(e)}")
            raise

    async def verify_token(self, request: Request, token: str) -> dict:
        """
        Verify and decode a JWT token.
        """
        try:
            await logger.log_message(request=request, message=f"Starting to decode the token: {token}")
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[self.ALGORITHM]
            )
            await logger.log_message(request=request, message=f"Token decoded successfully. Payload: {payload}")
            return payload

        except ExpiredSignatureError as e:
            await logger.log_error(request=request, message=f"JWT Token Expired: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: Token Expired. Refresh the token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        except JWTError as e:
            await logger.log_error(request=request, message=f"JWT verification failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )

        except Exception as e:
            await logger.log_error(request=request, message=f"Unexpected error during token verification: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error during token verification",
            )


# Singleton instance
jwt_manager = JWTManager()
