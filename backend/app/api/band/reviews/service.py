"""Band Reviews Service layer — business logic for verified gig reviews and provider replies."""

from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.band_models import BandAccount, BandArtistProfile, BandVenue, BandBooking
from app.models import band_schemas as schemas
from app.api.band.reviews import crud


def submit_review(
    db: Session,
    client_account: BandAccount,
    payload: schemas.BandReviewCreateRequest,
) -> schemas.BandReviewResponse:
    """Submit a verified rating and review."""
    if not payload.artist_profile_id and not payload.venue_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must specify either an artist_profile_id or venue_id to review.",
        )

    # Optional: If booking_id is provided, verify it belongs to this client and is completed
    if payload.booking_id:
        booking = db.query(BandBooking).filter_by(id=payload.booking_id, deleted_at=None).first()
        if not booking:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated booking not found.")
        if booking.client_id != client_account.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only review your own bookings.")

    review = crud.create_review(db, client_id=client_account.id, payload=payload)
    return schemas.BandReviewResponse.model_validate(review)


def get_artist_review_summary(
    db: Session,
    artist_profile_id: int,
    limit: int = 50,
    offset: int = 0,
) -> schemas.BandReviewSummaryResponse:
    """Get aggregated reviews and star distribution for an artist."""
    items, total, avg_score, distribution = crud.get_artist_reviews(
        db, artist_profile_id=artist_profile_id, limit=limit, offset=offset
    )
    return schemas.BandReviewSummaryResponse(
        average_rating=avg_score,
        total_reviews=total,
        rating_distribution=distribution,
        reviews=[schemas.BandReviewResponse.model_validate(r) for r in items],
    )


def get_venue_review_summary(
    db: Session,
    venue_id: int,
    limit: int = 50,
    offset: int = 0,
) -> schemas.BandReviewSummaryResponse:
    """Get aggregated reviews for a venue."""
    items, total, avg_score, distribution = crud.get_venue_reviews(
        db, venue_id=venue_id, limit=limit, offset=offset
    )
    return schemas.BandReviewSummaryResponse(
        average_rating=avg_score,
        total_reviews=total,
        rating_distribution=distribution,
        reviews=[schemas.BandReviewResponse.model_validate(r) for r in items],
    )


def reply_to_review(
    db: Session,
    account: BandAccount,
    review_id: int,
    payload: schemas.BandReviewReplyRequest,
) -> schemas.BandReviewResponse:
    """Provider replies to an existing review."""
    review = crud.get_review_by_id(db, review_id)
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found.")

    # Validate provider authority
    is_authorized = False
    if review.artist_profile_id:
        artist = db.query(BandArtistProfile).filter_by(id=review.artist_profile_id).first()
        if artist and artist.account_id == account.id:
            is_authorized = True

    if review.venue_id:
        venue = db.query(BandVenue).filter_by(id=review.venue_id).first()
        if venue and venue.account_id == account.id:
            is_authorized = True

    if not is_authorized and account.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the reviewed artist or venue owner can post a public reply.",
        )

    updated = crud.reply_to_review(db, review=review, reply_comment=payload.reply_comment)
    return schemas.BandReviewResponse.model_validate(updated)
