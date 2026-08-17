"""Band Reviews Router — submit reviews, view star distributions, and provider replies."""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import band_schemas as schemas
from app.models.band_models import BandAccount
from app.api.band.common.deps import get_band_account
from app.api.band.reviews import service

router = APIRouter(prefix="/band/reviews", tags=["Band Reviews"])


@router.post(
    "",
    response_model=schemas.BandReviewResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_review(
    payload: schemas.BandReviewCreateRequest,
    db: Session = Depends(get_db),
    account: BandAccount = Depends(get_band_account),
):
    """Submit a verified review and star rating."""
    return service.submit_review(db, account, payload)


@router.get(
    "/artist/{artist_profile_id}",
    response_model=schemas.BandReviewSummaryResponse,
)
def get_artist_reviews(
    artist_profile_id: int,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Get all reviews and star score distribution for an artist."""
    return service.get_artist_review_summary(db, artist_profile_id, limit=limit, offset=offset)


@router.get(
    "/venue/{venue_id}",
    response_model=schemas.BandReviewSummaryResponse,
)
def get_venue_reviews(
    venue_id: int,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Get all reviews and star score distribution for a venue."""
    return service.get_venue_review_summary(db, venue_id, limit=limit, offset=offset)


@router.post(
    "/{review_id}/reply",
    response_model=schemas.BandReviewResponse,
)
def reply_review(
    review_id: int,
    payload: schemas.BandReviewReplyRequest,
    db: Session = Depends(get_db),
    account: BandAccount = Depends(get_band_account),
):
    """Provider posts a public reply to a client review."""
    return service.reply_to_review(db, account, review_id, payload)
