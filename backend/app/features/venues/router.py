"""
API routes for Admin Venue space profile management.
Provides auditing controllers, verification updates pipelines, and credentials suspension blocks.
"""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_admin
from app.features.venues.schemas import (
    VenueVerificationUpdate,
    VenueResponse,
    PaginatedVenueList,
    CityBriefResponse
)
from app.features.venues.service import VenueService
from app.features.venues.crud import VenueCRUD
from app.features.categories.schemas import CategoryResponse
from app.features.artists.schemas import UserBriefResponse
from app.common.schemas.base import SuccessResponse
from app.core.exceptions import NotFoundException

router = APIRouter()
service = VenueService()
crud = VenueCRUD()


def _format_venue_profile(venue) -> VenueResponse:
    """Format SQLAlchemy base model to pydantic schema mapping."""
    return VenueResponse(
        id=venue.id,
        user_id=venue.user_id,
        user=UserBriefResponse(
            id=venue.user.id,
            name=venue.user.name,
            email=venue.user.email,
            is_active=venue.user.is_active
        ),
        name=venue.name,
        venue_number=venue.venue_number,
        description=venue.description,
        address=venue.address,
        city_id=venue.city_id,
        city=CityBriefResponse(
            id=venue.city.id,
            name=venue.city.name
        ),
        venue_type=venue.venue_type,
        business_name=venue.business_name,
        contact_details=venue.contact_details,
        min_capacity=venue.min_capacity or 0,
        pincode=venue.pincode,
        state=venue.state,
        country=venue.country,
        google_map_location=venue.google_map_location,
        base_price=float(venue.base_price),
        capacity=venue.capacity,
        verification_status=venue.verification_status,
        verification_notes=venue.verification_notes,
        facilities=venue.facilities or [],
        gallery=venue.gallery or [],
        pricing_details=venue.pricing_details or {},
        availability_rules=venue.availability_rules or {},
        documents=venue.documents or {},
        metadata_fields=venue.metadata_fields or {},
        categories=[
            CategoryResponse(
                id=c.id,
                name=c.name,
                type=c.type,
                description=c.description,
                is_active=c.is_active,
                created_at=c.created_at.isoformat()
            ) for c in venue.categories
        ],
        created_at=venue.created_at.isoformat()
    )


@router.get(
    "",
    response_model=SuccessResponse[PaginatedVenueList],
    status_code=status.HTTP_200_OK,
    summary="List all venues (Admin only)"
)
async def list_admin_venues(
    search: Optional[str] = Query(None, description="Search venue name, city or owner"),
    verification_status: Optional[str] = Query(None, description="Filter by status: pending, approved, rejected"),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_admin_claims: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only route returning all venue profiles with verification and search parameters."""
    venues, total = crud.get_filtered_venues(
        db, search=search, verification_status=verification_status, limit=limit, offset=offset
    )
    formatted = [_format_venue_profile(v) for v in venues]
    return SuccessResponse(
        success=True,
        data=PaginatedVenueList(items=formatted, total=total),
        message="Venues list retrieved successfully."
    )


@router.get(
    "/{venue_id}",
    response_model=SuccessResponse[VenueResponse],
    status_code=status.HTTP_200_OK,
    summary="Get venue details (Admin only)"
)
async def get_admin_venue_detail(
    venue_id: UUID,
    current_admin_claims: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only route to inspect complete profile fields of a venue."""
    venue = crud.get(db, venue_id)
    if not venue:
        raise NotFoundException("Venue listing not found.")
    return SuccessResponse(
        success=True,
        data=_format_venue_profile(venue),
        message="Venue details retrieved successfully."
    )


@router.put(
    "/{venue_id}/verify",
    response_model=SuccessResponse[VenueResponse],
    status_code=status.HTTP_200_OK,
    summary="Update venue verification status (Admin only)"
)
async def update_venue_verification(
    venue_id: UUID,
    data: VenueVerificationUpdate,
    current_admin_claims: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only pipeline path to Approve, Reject, or Flag a venue profile verification."""
    venue = service.update_verification_status(db, venue_id, data)
    return SuccessResponse(
        success=True,
        data=_format_venue_profile(venue),
        message="Verification status successfully updated."
    )


@router.put(
    "/{venue_id}/suspend",
    response_model=SuccessResponse[VenueResponse],
    status_code=status.HTTP_200_OK,
    summary="Suspend venue account access (Admin only)"
)
async def suspend_admin_venue(
    venue_id: UUID,
    current_admin_claims: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only endpoint to toggle account credentials activity to inactive (suspend)."""
    venue = service.suspend_venue(db, venue_id)
    return SuccessResponse(
        success=True,
        data=_format_venue_profile(venue),
        message="Venue credentials suspended successfully."
    )


@router.put(
    "/{venue_id}/activate",
    response_model=SuccessResponse[VenueResponse],
    status_code=status.HTTP_200_OK,
    summary="Activate venue account access (Admin only)"
)
async def activate_admin_venue(
    venue_id: UUID,
    current_admin_claims: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only endpoint to toggle account credentials activity to active."""
    venue = service.activate_venue(db, venue_id)
    return SuccessResponse(
        success=True,
        data=_format_venue_profile(venue),
        message="Venue credentials activated successfully."
    )
