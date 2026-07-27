from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.common.schemas.base import SuccessResponse
from app.features.bookings.schemas import DisputeResolveRequest, BookingResponse
from app.features.bookings.service import booking_service
from app.features.bookings.router import _format_booking, _format_booking_brief

router = APIRouter()


@router.get(
    "",
    response_model=SuccessResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Get all platform bookings list (Admin only)",
)
async def list_admin_bookings(
    status: Optional[str] = Query(
        None,
        description="Filter by pending, accepted, rejected, counter_offered, cancelled, completed, confirmed",
    ),
    search: Optional[str] = Query(
        None, description="Search by event name, client name/email, or location"
    ),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_admin_claims: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Audit query returning all bookings created on the platform with pagination and status filters.
    """
    results, total = booking_service.get_all_bookings(
        db, status, search, page, limit
    )
    return SuccessResponse(
        success=True,
        data={
            "bookings": [_format_booking_brief(b) for b in results],
            "total": total,
            "page": page,
            "limit": limit,
        },
        message="Admin bookings database registry retrieved.",
    )


@router.put(
    "/{booking_id}/dispute",
    response_model=SuccessResponse[BookingResponse],
    status_code=status.HTTP_200_OK,
    summary="Resolve a booking dispute by overriding its status (Admin only)",
)
async def resolve_booking_dispute(
    booking_id: UUID,
    data: DisputeResolveRequest,
    current_admin_claims: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Forcefully overrides the status of any booking on the platform.
    """
    booking = booking_service.resolve_dispute(
        db,
        booking_id,
        data.status,
        current_admin_claims["sub"],
        data.message,
    )
    return SuccessResponse(
        success=True,
        data=_format_booking(booking),
        message="Dispute resolved and booking status updated successfully.",
    )
