from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, status, File, UploadFile, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.features.venues.schemas import (
    VenueRegisterRequest,
    VenueResponse,
    VenueDashboardResponse,
    VenueProfileUpdateRequest,
    VenueMediaResponse,
    VenueMediaUpdateRequest,
    VenueAvailabilityResponse,
    VenueAvailabilityUpdateRequest,
    CheckConflictRequest,
    CheckConflictResponse,
    VenueFacilitiesResponse,
    VenueFacilitiesUpdateRequest,
    VenuePricingResponse,
    VenuePricingUpdateRequest,
    VenueAnalyticsResponse,
    VenueDocumentsResubmitRequest,
    VenueSettingsUpdateRequest,
    VenueProfileCreateRequest,
    PaginatedVenueList
)
from app.features.venues.service import VenueService
from app.common.schemas.base import SuccessResponse
from app.features.venues.router import _format_venue_profile
from app.core.storage import get_storage
from app.core.dependencies import get_current_user
from app.core.exceptions import NotFoundException

router = APIRouter(tags=["Venues"])
service = VenueService()


@router.get(
    "/me/media",
    response_model=SuccessResponse[VenueMediaResponse],
    status_code=status.HTTP_200_OK,
    summary="Get authenticated venue gallery and media configurations"
)
async def get_current_venue_media(
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves cover images, gallery photos list, videos list, Matterport placeholders, and YouTube walkthrough links.
    """
    media = service.get_media(db, current_user_claims["sub"])
    return SuccessResponse(
        success=True,
        data=media,
        message="Venue media settings retrieved successfully."
    )


@router.put(
    "/me/media",
    response_model=SuccessResponse[VenueMediaResponse],
    status_code=status.HTTP_200_OK,
    summary="Update authenticated venue gallery and media configurations"
)
async def update_current_venue_media(
    data: VenueMediaUpdateRequest,
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates cover image, gallery photos list, videos list, Matterport placeholders, and YouTube walkthrough links.
    """
    media = service.update_media(db, current_user_claims["sub"], data)
    return SuccessResponse(
        success=True,
        data=media,
        message="Venue media settings updated successfully."
    )


@router.get(
    "/me/availability",
    response_model=SuccessResponse[VenueAvailabilityResponse],
    status_code=status.HTTP_200_OK,
    summary="Get authenticated venue calendar rules and bookings"
)
async def get_current_venue_availability(
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves weekly hours schedule, blocked dates list, maintenance lists, public holidays, and booked events.
    """
    avail = service.get_availability(db, current_user_claims["sub"])
    return SuccessResponse(
        success=True,
        data=avail,
        message="Venue availability settings retrieved successfully."
    )


@router.put(
    "/me/availability",
    response_model=SuccessResponse[VenueAvailabilityResponse],
    status_code=status.HTTP_200_OK,
    summary="Update authenticated venue calendar rules and bookings"
)
async def update_current_venue_availability(
    data: VenueAvailabilityUpdateRequest,
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates operational schedule, blocks dates, registers maintenance days, and schedules holidays.
    """
    avail = service.update_availability(db, current_user_claims["sub"], data)
    return SuccessResponse(
        success=True,
        data=avail,
        message="Venue availability settings updated successfully."
    )


@router.post(
    "/me/availability/check-conflict",
    response_model=SuccessResponse[CheckConflictResponse],
    status_code=status.HTTP_200_OK,
    summary="Checks if a proposed slot conflicts with the venue schedule"
)
async def check_venue_slot_conflict(
    data: CheckConflictRequest,
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Validates if a given date and time range overlaps with any blocked, maintenance, holiday, or booked slots.
    """
    conflict_info = service.check_booking_conflict(
        db, current_user_claims["sub"], data.date, data.start_time, data.end_time
    )
    return SuccessResponse(
        success=True,
        data=conflict_info,
        message="Booking slot conflict evaluation complete."
    )


@router.get(
    "/me/facilities",
    response_model=SuccessResponse[VenueFacilitiesResponse],
    status_code=status.HTTP_200_OK,
    summary="Get authenticated venue facilities and details"
)
async def get_current_venue_facilities(
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves core active facilities list and custom parameters (AC slots, parking count).
    """
    facs = service.get_facilities(db, current_user_claims["sub"])
    return SuccessResponse(
        success=True,
        data=facs,
        message="Venue facilities configuration retrieved successfully."
    )


@router.put(
    "/me/facilities",
    response_model=SuccessResponse[VenueFacilitiesResponse],
    status_code=status.HTTP_200_OK,
    summary="Update authenticated venue facilities and details"
)
async def update_current_venue_facilities(
    data: VenueFacilitiesUpdateRequest,
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates core facilities list and sets specification parameter details inside metadata.
    """
    facs = service.update_facilities(db, current_user_claims["sub"], data)
    return SuccessResponse(
        success=True,
        data=facs,
        message="Venue facilities configuration updated successfully."
    )


@router.get(
    "/me/pricing",
    response_model=SuccessResponse[VenuePricingResponse],
    status_code=status.HTTP_200_OK,
    summary="Get authenticated venue pricing packages and details"
)
async def get_current_venue_pricing(
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves base rates, hourly pricing, discount packages, security deposits, and cleaning charges.
    """
    pricing = service.get_pricing(db, current_user_claims["sub"])
    return SuccessResponse(
        success=True,
        data=pricing,
        message="Venue pricing configuration retrieved successfully."
    )


@router.put(
    "/me/pricing",
    response_model=SuccessResponse[VenuePricingResponse],
    status_code=status.HTTP_200_OK,
    summary="Update authenticated venue pricing packages and details"
)
async def update_current_venue_pricing(
    data: VenuePricingUpdateRequest,
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates base rate, packages (half-day/full-day), surcharges, cancellations, and active discounts.
    """
    pricing = service.update_pricing(db, current_user_claims["sub"], data)
    return SuccessResponse(
        success=True,
        data=pricing,
        message="Venue pricing configuration updated successfully."
    )


@router.post(
    "/me",
    response_model=SuccessResponse[VenueResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create venue profile for an already-authenticated venue owner"
)
async def create_venue_profile(
    data: VenueProfileCreateRequest,
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates the Venue domain profile for a user who was registered via the standard
    /auth/register endpoint with role=venue_owner. The user account already exists.
    This endpoint creates the missing Venue record.
    Returns 409 Conflict if a venue profile already exists for this user.
    """
    venue = service.create_venue_profile_for_user(db, current_user_claims["sub"], data)
    return SuccessResponse(
        success=True,
        data=_format_venue_profile(venue),
        message="Venue profile created successfully."
    )


@router.get(
    "/me",
    response_model=SuccessResponse[VenueResponse],
    status_code=status.HTTP_200_OK,
    summary="Get currently authenticated venue profile details"
)
async def get_current_venue_profile(
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves the complete profile information for the authenticated venue owner.
    """
    venue = service.get_venue_by_user_id(db, current_user_claims["sub"])
    return SuccessResponse(
        success=True,
        data=_format_venue_profile(venue),
        message="Venue profile retrieved successfully."
    )


@router.put(
    "/me",
    response_model=SuccessResponse[VenueResponse],
    status_code=status.HTTP_200_OK,
    summary="Update authenticated venue profile details"
)
async def update_current_venue_profile(
    data: VenueProfileUpdateRequest,
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates basic details, capacity, and operational parameters for the logged-in venue.
    """
    venue = service.update_profile(db, current_user_claims["sub"], data)
    return SuccessResponse(
        success=True,
        data=_format_venue_profile(venue),
        message="Venue profile updated successfully."
    )



@router.get(
    "/me/dashboard",
    response_model=SuccessResponse[VenueDashboardResponse],
    status_code=status.HTTP_200_OK,
    summary="Get logged-in venue owner dashboard metrics and widgets"
)
async def get_venue_dashboard(
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns dashboard stats, recent reviews, upcoming events, notifications, and monthly performance.
    """
    stats = service.get_dashboard_stats(db, current_user_claims["sub"])
    return SuccessResponse(
        success=True,
        data=stats,
        message="Venue dashboard data retrieved successfully."
    )


@router.post(
    "/upload",
    response_model=SuccessResponse[str],
    status_code=status.HTTP_200_OK,
    summary="Upload a venue document or media file"
)
async def upload_venue_file(
    file: UploadFile = File(...),
    subfolder: str = "venues"
):
    """
    Uploads a file (image, video, document) using the configured storage backend (local/S3).
    Returns the access URL of the uploaded file.
    """
    storage = get_storage()
    file_url = await storage.upload(file, subfolder)
    return SuccessResponse(
        success=True,
        data=file_url,
        message="File uploaded successfully."
    )


@router.post(
    "/register",
    response_model=SuccessResponse[VenueResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Register a new Venue and Owner account"
)
async def register_venue_owner(
    data: VenueRegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Submits a 10-step wizard form to register a new Venue Owner credentials and space details.
    """
    venue = service.register_venue(db, data)
    return SuccessResponse(
        success=True,
        data=_format_venue_profile(venue),
        message="Venue and owner registered successfully. Awaiting administration review."
    )


@router.get(
    "/me/analytics",
    response_model=SuccessResponse[VenueAnalyticsResponse],
    status_code=status.HTTP_200_OK,
    summary="Get authenticated venue analytics, occupancy rates, and distributions"
)
async def get_current_venue_analytics(
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns total statistics, revenue/booking charts, occupancy charts, and top clients, cities, and seasons datasets.
    """
    analytics = service.get_venue_analytics(db, current_user_claims["sub"])
    return SuccessResponse(
        success=True,
        data=analytics,
        message="Venue analytics insights retrieved successfully."
    )


@router.put(
    "/me/verification/resubmit",
    response_model=SuccessResponse[VenueResponse],
    status_code=status.HTTP_200_OK,
    summary="Resubmit verification documents for audit (Venue Owner only)"
)
async def resubmit_venue_documents(
    data: VenueDocumentsResubmitRequest,
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Allows venue owners to update verification documents and reset verification status back to pending.
    """
    venue = service.resubmit_verification_documents(db, current_user_claims["sub"], data)
    return SuccessResponse(
        success=True,
        data=_format_venue_profile(venue),
        message="Verification documents successfully resubmitted. Profile status reset to pending."
    )


@router.put(
    "/me/settings",
    response_model=SuccessResponse[VenueResponse],
    status_code=status.HTTP_200_OK,
    summary="Update venue custom configuration settings (Venue Owner only)"
)
async def update_venue_configuration_settings(
    data: VenueSettingsUpdateRequest,
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates notification, deactivation, and visibility configurations.
    """
    venue = service.update_venue_settings(db, current_user_claims["sub"], data)
    return SuccessResponse(
        success=True,
        data=_format_venue_profile(venue),
        message="Venue configuration settings updated successfully."
    )


def _format_public_venue_profile(venue) -> VenueResponse:
    profile = _format_venue_profile(venue)
    # Ensure sensitive verification details are never leaked in public profile endpoints
    profile.documents = {}
    return profile


@router.get(
    "",
    response_model=SuccessResponse[PaginatedVenueList],
    status_code=status.HTTP_200_OK,
    summary="Public marketplace search and filter for approved venues"
)
async def list_marketplace_venues(
    search: Optional[str] = Query(None, description="Search venue name, address, or description"),
    venue_type: Optional[str] = Query(None, description="E.g. Banquet Hall, Concert Arena"),
    city: Optional[str] = Query(None, description="Filter by city name"),
    city_id: Optional[UUID] = Query(None, description="Filter by city ID"),
    capacity: Optional[int] = Query(None, description="Minimum capacity required"),
    min_price: Optional[float] = Query(None, description="Minimum base price"),
    max_price: Optional[float] = Query(None, description="Maximum base price"),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    from app.features.venues.models import Venue
    from app.features.locations.models import City
    from app.features.auth.models import User

    # Only approved and active venues should be visible in the marketplace
    query = (
        db.query(Venue)
        .join(Venue.user)
        .join(Venue.city)
        .filter(
            Venue.verification_status == "approved",
            User.is_active.is_(True),
            Venue.deleted_at.is_(None)
        )
    )

    if search:
        query = query.filter(
            (Venue.name.ilike(f"%{search}%")) |
            (Venue.address.ilike(f"%{search}%")) |
            (Venue.description.ilike(f"%{search}%"))
        )

    if venue_type:
        query = query.filter(Venue.venue_type == venue_type)

    if city_id:
        query = query.filter(Venue.city_id == city_id)
    elif city:
        query = query.filter(City.name.ilike(f"%{city}%"))

    if capacity is not None:
        query = query.filter(Venue.capacity >= capacity)

    if min_price is not None:
        query = query.filter(Venue.base_price >= min_price)

    if max_price is not None:
        query = query.filter(Venue.base_price <= max_price)

    total = query.count()
    venues = query.offset(offset).limit(limit).all()

    formatted = [_format_public_venue_profile(v) for v in venues]
    return SuccessResponse(
        success=True,
        data=PaginatedVenueList(items=formatted, total=total),
        message="Marketplace venues retrieved successfully."
    )


@router.get(
    "/{venue_id}",
    response_model=SuccessResponse[VenueResponse],
    status_code=status.HTTP_200_OK,
    summary="Get venue details publicly by ID"
)
async def get_public_venue_detail(
    venue_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Retrieves the complete profile information for a venue by its ID publicly (no authentication required).
    """
    venue = service.crud.get(db, venue_id)
    if not venue or venue.deleted_at is not None:
        raise NotFoundException("Venue listing not found.")
    return SuccessResponse(
        success=True,
        data=_format_public_venue_profile(venue),
        message="Venue profile retrieved successfully."
    )
