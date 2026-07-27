"""
API routes for Admin Performer / Band profile management.
Provides auditing controllers, verification updates pipelines, and credentials suspension blocks.
"""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_admin
from app.features.artists.schemas import (
    ArtistVerificationUpdate,
    ArtistProfileResponse,
    PaginatedArtistList,
    UserBriefResponse
)
from app.features.artists.service import ArtistService
from app.features.artists.crud import ArtistProfileCRUD
from app.features.categories.schemas import CategoryResponse
from app.common.schemas.base import SuccessResponse
from app.core.exceptions import NotFoundException

router = APIRouter()
service = ArtistService()
crud = ArtistProfileCRUD()


def _format_artist_profile(artist) -> ArtistProfileResponse:
    """Format SQLAlchemy base model to pydantic schema mapping."""
    return ArtistProfileResponse(
        id=artist.id,
        user_id=artist.user_id,
        user=UserBriefResponse(
            id=artist.user.id,
            name=artist.user.name,
            email=artist.user.email,
            is_active=artist.user.is_active
        ),
        bio=artist.bio,
        base_rate=float(artist.base_rate),
        rating=float(artist.rating),
        verification_status=artist.verification_status,
        verification_notes=artist.verification_notes,
        display_name=artist.display_name,
        mobile_number=artist.mobile_number,
        years_of_experience=artist.years_of_experience or 0,
        profile_image=artist.profile_image,
        cover_image=artist.cover_image,
        city=artist.city,
        state=artist.state,
        band_type=artist.band_type or "Solo",
        total_members=artist.total_members or 1,
        currency=artist.currency or "INR",
        travel_radius=float(artist.travel_radius or 0.0),
        travel_charges=float(artist.travel_charges or 0.0),
        min_booking_hours=float(artist.min_booking_hours or 0.0),
        max_booking_hours=float(artist.max_booking_hours or 0.0),
        equipment=artist.equipment or {},
        availability=artist.availability or {},
        social_links=artist.social_links or {},
        achievements=artist.achievements or [],
        documents=artist.documents or {},
        gallery=artist.gallery or [],
        videos=artist.videos or [],
        youtube_links=artist.youtube_links or [],
        instagram_reels=artist.instagram_reels or [],
        pricing_details=artist.pricing_details or {},
        genres=[
            CategoryResponse(
                id=c.id,
                name=c.name,
                type=c.type,
                description=c.description,
                is_active=c.is_active,
                created_at=c.created_at.isoformat()
            ) for c in artist.genres
        ],
        languages=[
            CategoryResponse(
                id=c.id,
                name=c.name,
                type=c.type,
                description=c.description,
                is_active=c.is_active,
                created_at=c.created_at.isoformat()
            ) for c in artist.languages
        ],
        created_at=artist.created_at.isoformat()
    )


@router.get(
    "",
    response_model=SuccessResponse[PaginatedArtistList],
    status_code=status.HTTP_200_OK,
    summary="List all artists (Admin only)"
)
async def list_admin_artists(
    search: Optional[str] = Query(None, description="Search artist name or bio"),
    verification_status: Optional[str] = Query(None, description="Filter by status: pending, approved, rejected"),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_admin_claims: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only route returning all performer profiles with verification and search parameters."""
    artists, total = crud.get_filtered_artists(
        db, search=search, verification_status=verification_status, limit=limit, offset=offset
    )
    formatted = [_format_artist_profile(a) for a in artists]
    return SuccessResponse(
        success=True,
        data=PaginatedArtistList(items=formatted, total=total),
        message="Artists list retrieved successfully."
    )


@router.get(
    "/{artist_id}",
    response_model=SuccessResponse[ArtistProfileResponse],
    status_code=status.HTTP_200_OK,
    summary="Get artist details (Admin only)"
)
async def get_admin_artist_detail(
    artist_id: UUID,
    current_admin_claims: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only route to inspect complete profile fields of a performer."""
    artist = crud.get(db, artist_id)
    if not artist:
        raise NotFoundException("Artist profile not found.")
    return SuccessResponse(
        success=True,
        data=_format_artist_profile(artist),
        message="Artist details retrieved successfully."
    )


@router.put(
    "/{artist_id}/verify",
    response_model=SuccessResponse[ArtistProfileResponse],
    status_code=status.HTTP_200_OK,
    summary="Update artist verification status (Admin only)"
)
async def update_artist_verification(
    artist_id: UUID,
    data: ArtistVerificationUpdate,
    current_admin_claims: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only pipeline path to Approve, Reject, or Flag a performer profile verification."""
    artist = service.update_verification_status(db, artist_id, data)
    return SuccessResponse(
        success=True,
        data=_format_artist_profile(artist),
        message="Verification status successfully updated."
    )


@router.put(
    "/{artist_id}/suspend",
    response_model=SuccessResponse[ArtistProfileResponse],
    status_code=status.HTTP_200_OK,
    summary="Suspend artist account access (Admin only)"
)
async def suspend_admin_artist(
    artist_id: UUID,
    current_admin_claims: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only endpoint to toggle account credentials activity to inactive (suspend)."""
    artist = service.suspend_artist(db, artist_id)
    return SuccessResponse(
        success=True,
        data=_format_artist_profile(artist),
        message="Artist credentials suspended successfully."
    )


@router.put(
    "/{artist_id}/activate",
    response_model=SuccessResponse[ArtistProfileResponse],
    status_code=status.HTTP_200_OK,
    summary="Activate artist account access (Admin only)"
)
async def activate_admin_artist(
    artist_id: UUID,
    current_admin_claims: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only endpoint to toggle account credentials activity to active."""
    artist = service.activate_artist(db, artist_id)
    return SuccessResponse(
        success=True,
        data=_format_artist_profile(artist),
        message="Artist credentials activated successfully."
    )
