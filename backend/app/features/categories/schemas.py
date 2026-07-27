"""
Pydantic schemas for Categories validation.
"""

from typing import Optional, List
from uuid import UUID
from pydantic import Field
from app.common.schemas.base import BaseSchema


class CategoryCreate(BaseSchema):
    name: str = Field(..., min_length=2, max_length=100)
    type: str = Field(..., description="Discriminator: music_genre, language, event_type, band_type, equipment_category, venue_category")
    description: Optional[str] = Field(None, max_length=255)
    is_active: bool = True


class CategoryUpdate(BaseSchema):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None


class CategoryResponse(BaseSchema):
    id: UUID
    name: str
    type: str
    description: Optional[str] = None
    is_active: bool
    created_at: str


class PaginatedCategoryList(BaseSchema):
    items: List[CategoryResponse]
    total: int
