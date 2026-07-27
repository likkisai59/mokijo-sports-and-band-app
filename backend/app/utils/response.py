"""
Standardized API Response formatting helpers.
"""

from typing import Any, Optional
from fastapi.responses import JSONResponse

def success_response(
    data: Any = None,
    message: str = "Request processed successfully.",
    status_code: int = 200
) -> JSONResponse:
    """Standard success API response structure."""
    return JSONResponse(
        status_code=status_code,
        content={
            "success": True,
            "data": data,
            "message": message
        }
    )

def error_response(
    code: str,
    message: str,
    details: Optional[Any] = None,
    status_code: int = 400
) -> JSONResponse:
    """Standard error API response structure."""
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": {
                "code": code,
                "message": message,
                "details": details
            }
        }
    )
