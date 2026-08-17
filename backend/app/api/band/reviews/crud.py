"""Band Reviews CRUD layer — database operations for ratings, reviews, and provider replies."""

from typing import List, Optional, Tuple, Dict
from datetime import datetime
from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from app.models.band_models import BandReview, BandArtistProfile, BandVenue, BandAccount
from app.models import band_schemas as schemas


def get_review_by_id(db: Session, review_id: int) -> Optional[BandReview]:
    """Retrieve single review."""
    return (
        db.query(BandReview)
        .filter(BandReview.id == review_id, BandReview.deleted_at.is_(None))
        .first()
    )


def create_review(
    db: Session,
    client_id: int,
    payload: schemas.BandReviewCreateRequest,
) -> BandReview:
    """Create verified review and recalculate provider average rating."""
    review = BandReview(
        client_id=client_id,
        artist_profile_id=payload.artist_profile_id,
        venue_id=payload.venue_id,
        booking_id=payload.booking_id,
        rating=payload.rating,
        comment=payload.comment,
        images=payload.images or [],
        videos=payload.videos or [],
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    # Recalculate average rating for Artist or Venue
    if payload.artist_profile_id:
        avg_rating = (
            db.query(func.avg(BandReview.rating))
            .filter(
                BandReview.artist_profile_id == payload.artist_profile_id,
                BandReview.deleted_at.is_(None),
            )
            .scalar()
        )
        if avg_rating is not None:
            artist = db.query(BandArtistProfile).filter_by(id=payload.artist_profile_id).first()
            if artist:
                artist.rating = round(float(avg_rating), 1)
                db.add(artist)
                db.commit()

    return review


def get_artist_reviews(
    db: Session,
    artist_profile_id: int,
    limit: int = 50,
    offset: int = 0,
) -> Tuple[List[BandReview], int, float, Dict[int, int]]:
    """Retrieve artist reviews, total count, average rating, and 1-5 star distribution."""
    query = db.query(BandReview).filter(
        BandReview.artist_profile_id == artist_profile_id,
        BandReview.deleted_at.is_(None),
    )

    total = query.count()
    items = query.order_by(desc(BandReview.created_at)).offset(offset).limit(limit).all()

    avg_rating = (
        db.query(func.avg(BandReview.rating))
        .filter(
            BandReview.artist_profile_id == artist_profile_id,
            BandReview.deleted_at.is_(None),
        )
        .scalar()
    )
    avg_score = round(float(avg_rating), 1) if avg_rating else 5.0

    # Rating distribution 1 to 5 stars
    dist_query = (
        db.query(BandReview.rating, func.count(BandReview.id))
        .filter(
            BandReview.artist_profile_id == artist_profile_id,
            BandReview.deleted_at.is_(None),
        )
        .group_by(BandReview.rating)
        .all()
    )
    distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for score, count in dist_query:
        distribution[score] = count

    return items, total, avg_score, distribution


def get_venue_reviews(
    db: Session,
    venue_id: int,
    limit: int = 50,
    offset: int = 0,
) -> Tuple[List[BandReview], int, float, Dict[int, int]]:
    """Retrieve venue reviews with distribution."""
    query = db.query(BandReview).filter(
        BandReview.venue_id == venue_id,
        BandReview.deleted_at.is_(None),
    )

    total = query.count()
    items = query.order_by(desc(BandReview.created_at)).offset(offset).limit(limit).all()

    avg_rating = (
        db.query(func.avg(BandReview.rating))
        .filter(
            BandReview.venue_id == venue_id,
            BandReview.deleted_at.is_(None),
        )
        .scalar()
    )
    avg_score = round(float(avg_rating), 1) if avg_rating else 5.0

    dist_query = (
        db.query(BandReview.rating, func.count(BandReview.id))
        .filter(
            BandReview.venue_id == venue_id,
            BandReview.deleted_at.is_(None),
        )
        .group_by(BandReview.rating)
        .all()
    )
    distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for score, count in dist_query:
        distribution[score] = count

    return items, total, avg_score, distribution


def reply_to_review(
    db: Session,
    review: BandReview,
    reply_comment: str,
) -> BandReview:
    """Save provider public reply."""
    review.reply_comment = reply_comment
    review.reply_at = datetime.utcnow()
    review.updated_at = datetime.utcnow()
    db.add(review)
    db.commit()
    db.refresh(review)
    return review
