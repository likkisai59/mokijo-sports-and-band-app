"""
Pydantic schemas for Location validation.
"""

from typing import Optional, List
from uuid import UUID
from pydantic import Field
from app.common.schemas.base import BaseSchema


class CountryCreate(BaseSchema):
    name: str = Field(..., min_length=2, max_length=100)
    code: str = Field(..., min_length=2, max_length=10)


class CountryResponse(BaseSchema):
    id: UUID
    name: str
    code: str


class StateCreate(BaseSchema):
    name: str = Field(..., min_length=2, max_length=100)
    country_id: UUID


class StateResponse(BaseSchema):
    id: UUID
    name: str
    country_id: UUID


class CityCreate(BaseSchema):
    name: str = Field(..., min_length=2, max_length=100)
    state_id: UUID


class CityResponse(BaseSchema):
    id: UUID
    name: str
    state_id: UUID


class AreaCreate(BaseSchema):
    name: str = Field(..., min_length=2, max_length=100)
    pincode: str = Field(..., min_length=4, max_length=20)
    city_id: UUID
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    service_radius: float = Field(50.0, description="Service radius in kilometers")


class AreaUpdate(BaseSchema):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    pincode: Optional[str] = Field(None, min_length=4, max_length=20)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    service_radius: Optional[float] = None


class AreaResponse(BaseSchema):
    id: UUID
    name: str
    pincode: str
    city_id: UUID
    city_name: str
    state_name: str
    country_name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    service_radius: float
    created_at: str


class PaginatedAreaList(BaseSchema):
    items: List[AreaResponse]
    total: int
