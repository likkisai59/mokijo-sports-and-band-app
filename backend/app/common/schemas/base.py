"""
Base Pydantic schema models for standard request/response payloads.
"""

from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel

T = TypeVar("T")

class BaseSchema(BaseModel):
    """Base Pydantic model with custom configurations defaults."""
    class Config:
        from_attributes = True


class SuccessResponse(BaseSchema, Generic[T]):
    """Standard success API envelope structure."""
    success: bool = True
    data: Optional[T] = None
    message: str = "Request processed successfully."
    email_sent: Optional[bool] = None



class ErrorDetails(BaseSchema):
    """Detailed block for validation or execution errors."""
    code: str
    message: str
    details: Optional[Any] = None


class ErrorResponse(BaseSchema):
    """Standard error API envelope structure."""
    success: bool = False
    error: ErrorDetails


class PaginatedMetadata(BaseSchema):
    """Standardized metadata block for list pagination responses."""
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool


class PaginatedData(BaseSchema, Generic[T]):
    """Standard wrapper for items list payload inside paginated responses."""
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool


class PaginatedResponse(BaseSchema, Generic[T]):
    """Standard wrapper for paginated envelope responses."""
    success: bool = True
    data: PaginatedData[T]
    message: str = "Records retrieved successfully."
