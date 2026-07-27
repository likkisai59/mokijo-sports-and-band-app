"""
API routes for public and onboarding Artist / Band profile management.
"""

from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.core.exceptions import NotFoundException
from app.features.artists.schemas import (
    ArtistRegisterRequest,
    ArtistProfileCreateRequest,
    ArtistProfileResponse,
    ArtistDashboardResponse,
    ArtistProfileUpdate,
    AvailabilityUpdate,
    ConflictCheckRequest,
    ConflictCheckResponse,
    MediaGalleryUpdate,
    PricingUpdate,
    AnalyticsResponse,
    PaginatedArtistList
)
from app.features.artists.router import _format_artist_profile
from app.features.artists.service import ArtistService
from app.common.schemas.base import SuccessResponse

router = APIRouter()
service = ArtistService()

@router.post(
    "/register",
    response_model=SuccessResponse[ArtistProfileResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Register a new Artist / Band profile with complete details"
)
async def register_artist(
    data: ArtistRegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Onboard a new artist or music band profile.
    This handles registration of the User account, assigning roles, and creating the profile.
    """
    artist = service.register_artist(db, data)
    return SuccessResponse(
        success=True,
        data=_format_artist_profile(artist),
        message="Artist profile successfully registered."
    )


@router.post(
    "/me",
    response_model=SuccessResponse[ArtistProfileResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create artist profile for an already-authenticated artist user"
)
async def create_artist_profile(
    data: ArtistProfileCreateRequest,
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates the Artist/Band domain profile for a user who was registered via the standard
    /auth/register endpoint with role=artist. The user account already exists.
    This endpoint creates the missing ArtistProfile record.
    Returns 409 Conflict if a profile already exists for this user.
    """
    artist = service.create_artist_profile_for_user(db, current_user_claims["sub"], data)
    return SuccessResponse(
        success=True,
        data=_format_artist_profile(artist),
        message="Artist profile created successfully."
    )


@router.get(
    "/me/dashboard",
    response_model=SuccessResponse[ArtistDashboardResponse],
    status_code=status.HTTP_200_OK,
    summary="Get logged-in artist dashboard metrics and widgets"
)
async def get_artist_dashboard(
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
        message="Artist dashboard data retrieved successfully."
    )

@router.get(
    "/me",
    response_model=SuccessResponse[ArtistProfileResponse],
    status_code=status.HTTP_200_OK,
    summary="Get currently authenticated artist profile details"
)
async def get_current_artist_profile(
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves the complete profile information for the authenticated performer.
    """
    artist = service.get_artist_by_user_id(db, current_user_claims["sub"])
    return SuccessResponse(
        success=True,
        data=_format_artist_profile(artist),
        message="Artist profile retrieved successfully."
    )

@router.put(
    "/me",
    response_model=SuccessResponse[ArtistProfileResponse],
    status_code=status.HTTP_200_OK,
    summary="Update authenticated artist profile details"
)
async def update_current_artist_profile(
    data: ArtistProfileUpdate,
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates basic details, genres, languages, and pricing configuration for the logged-in performer.
    """
    artist = service.update_profile(db, current_user_claims["sub"], data)
    return SuccessResponse(
        success=True,
        data=_format_artist_profile(artist),
        message="Artist profile updated successfully."
    )

@router.get(
    "/me/availability",
    response_model=SuccessResponse[AvailabilityUpdate],
    status_code=status.HTTP_200_OK,
    summary="Get authenticated artist availability schedule configuration"
)
async def get_current_artist_availability(
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves weekly schedule settings, holidays list, blocked dates list, and break hours for the performer.
    """
    avail = service.get_availability(db, current_user_claims["sub"])
    return SuccessResponse(
        success=True,
        data=avail,
        message="Availability schedule config retrieved successfully."
    )

@router.put(
    "/me/availability",
    response_model=SuccessResponse[AvailabilityUpdate],
    status_code=status.HTTP_200_OK,
    summary="Update authenticated artist availability schedule configuration"
)
async def update_current_artist_availability(
    data: AvailabilityUpdate,
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates weekly schedule working hours, holidays list, blocked dates list, and break hours.
    """
    avail = service.update_availability(db, current_user_claims["sub"], data.model_dump())
    return SuccessResponse(
        success=True,
        data=avail,
        message="Availability schedule config updated successfully."
    )

@router.post(
    "/me/availability/check-conflict",
    response_model=SuccessResponse[ConflictCheckResponse],
    status_code=status.HTTP_200_OK,
    summary="Check booking slot for schedule conflicts with the performer"
)
async def check_artist_booking_conflict(
    data: ConflictCheckRequest,
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Checks if a requested date and time has overlaps with blocked dates, holidays, breaks, or events.
    """
    has_conflict, reason = service.check_availability_conflict(
        db, current_user_claims["sub"], data.date, data.start_time, data.end_time
    )
    return SuccessResponse(
        success=True,
        data=ConflictCheckResponse(has_conflict=has_conflict, reason=reason),
        message="Availability conflict check completed."
    )

@router.get(
    "/me/media",
    response_model=SuccessResponse[MediaGalleryUpdate],
    status_code=status.HTTP_200_OK,
    summary="Get authenticated artist media gallery configuration"
)
async def get_current_artist_media(
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves gallery photos lists, videos files lists, and youtube/instagram links.
    """
    media = service.get_media(db, current_user_claims["sub"])
    return SuccessResponse(
        success=True,
        data=media,
        message="Artist media assets config retrieved."
    )

@router.put(
    "/me/media",
    response_model=SuccessResponse[MediaGalleryUpdate],
    status_code=status.HTTP_200_OK,
    summary="Update authenticated artist media gallery configuration"
)
async def update_current_artist_media(
    data: MediaGalleryUpdate,
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates gallery photos lists, videos files lists, and youtube/instagram links.
    """
    media = service.update_media(db, current_user_claims["sub"], data.model_dump())
    return SuccessResponse(
        success=True,
        data=media,
        message="Artist media assets updated successfully."
    )

@router.get(
    "/me/pricing",
    response_model=SuccessResponse[PricingUpdate],
    status_code=status.HTTP_200_OK,
    summary="Get authenticated artist pricing configuration"
)
async def get_current_artist_pricing(
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves base rates, currencies, hourly schedules, surcharges and package lists.
    """
    pricing = service.get_pricing(db, current_user_claims["sub"])
    return SuccessResponse(
        success=True,
        data=pricing,
        message="Artist pricing details retrieved."
    )

@router.put(
    "/me/pricing",
    response_model=SuccessResponse[PricingUpdate],
    status_code=status.HTTP_200_OK,
    summary="Update authenticated artist pricing configuration"
)
async def update_current_artist_pricing(
    data: PricingUpdate,
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates base rates, currencies, hourly schedules, surcharges and package lists.
    """
    pricing = service.update_pricing(db, current_user_claims["sub"], data.model_dump())
    return SuccessResponse(
        success=True,
        data=pricing,
        message="Artist pricing details updated successfully."
    )

@router.get(
    "/me/analytics",
    response_model=SuccessResponse[AnalyticsResponse],
    status_code=status.HTTP_200_OK,
    summary="Get authenticated artist dashboard business analytics and trends"
)
async def get_current_artist_analytics(
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves booking conversions, popular event counts, peak slot hours, and ratings trends.
    """
    analytics = service.get_analytics(db, current_user_claims["sub"])
    return SuccessResponse(
        success=True,
        data=analytics,
        message="Artist analytics insights retrieved successfully."
    )


def _format_public_artist_profile(artist) -> ArtistProfileResponse:
    profile = _format_artist_profile(artist)
    # Ensure sensitive verification details are never leaked in public profile endpoints
    profile.documents = None
    profile.mobile_number = None
    return profile


@router.get(
    "",
    response_model=SuccessResponse[PaginatedArtistList],
    status_code=status.HTTP_200_OK,
    summary="Public marketplace search and filter for approved artists"
)
async def list_marketplace_artists(
    search: Optional[str] = Query(None, description="Search by name, display name, or bio"),
    performer_type: Optional[str] = Query(None, description="Solo, Duo, Trio, 4 Members, 5+ Members"),
    genre: Optional[str] = Query(None, description="Filter by genre"),
    language: Optional[str] = Query(None, description="Filter by language"),
    city: Optional[str] = Query(None, description="Filter by city"),
    min_rate: Optional[float] = Query(None, description="Minimum performance rate"),
    max_rate: Optional[float] = Query(None, description="Maximum performance rate"),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    from app.features.artists.models import ArtistProfile
    from app.features.categories.models import Category
    from app.features.auth.models import User

    # Only approved and active performers should be visible in the marketplace
    query = (
        db.query(ArtistProfile)
        .join(ArtistProfile.user)
        .filter(
            ArtistProfile.verification_status == "approved",
            User.is_active.is_(True),
            ArtistProfile.deleted_at.is_(None)
        )
    )

    if search:
        query = query.filter(
            (User.name.ilike(f"%{search}%")) |
            (ArtistProfile.display_name.ilike(f"%{search}%")) |
            (ArtistProfile.bio.ilike(f"%{search}%"))
        )

    if performer_type:
        query = query.filter(ArtistProfile.band_type == performer_type)

    if city:
        query = query.filter(ArtistProfile.city.ilike(f"%{city}%"))

    if min_rate is not None:
        query = query.filter(ArtistProfile.base_rate >= min_rate)

    if max_rate is not None:
        query = query.filter(ArtistProfile.base_rate <= max_rate)

    if genre:
        query = (
            query.join(ArtistProfile.genres)
            .filter(Category.name.ilike(genre))
        )

    if language:
        from sqlalchemy.orm import aliased
        LangCategory = aliased(Category)
        query = (
            query.join(ArtistProfile.languages.of_type(LangCategory))
            .filter(LangCategory.name.ilike(language))
        )

    total = query.count()
    artists = query.offset(offset).limit(limit).all()

    formatted = [_format_public_artist_profile(a) for a in artists]
    return SuccessResponse(
        success=True,
        data=PaginatedArtistList(items=formatted, total=total),
        message="Marketplace artists retrieved successfully."
    )


@router.get(
    "/{artist_id}",
    response_model=SuccessResponse[ArtistProfileResponse],
    status_code=status.HTTP_200_OK,
    summary="Get public profile details of an approved artist"
)
async def get_public_artist_profile(
    artist_id: UUID,
    db: Session = Depends(get_db)
):
    from app.features.artists.models import ArtistProfile
    from app.features.auth.models import User

    artist = (
        db.query(ArtistProfile)
        .join(ArtistProfile.user)
        .filter(
            ArtistProfile.id == artist_id,
            ArtistProfile.verification_status == "approved",
            User.is_active.is_(True),
            ArtistProfile.deleted_at.is_(None)
        )
        .first()
    )
    if not artist:
        raise NotFoundException("Artist profile not found or not approved.")

    return SuccessResponse(
        success=True,
        data=_format_public_artist_profile(artist),
        message="Artist profile retrieved successfully."
    )
