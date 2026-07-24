"""CRUD + helpers for Band reviews."""

from datetime import datetime
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.band_models import BandReview, BandArtistProfile, BandVenue


def _serialize(r: BandReview) -> dict:
    return {
        "id": r.id,
        "artist_profile_id": r.artist_profile_id,
        "venue_id": r.venue_id,
        "client_id": r.client_id,
        "booking_id": r.booking_id,
        "rating": r.rating,
        "comment": r.comment,
        "reply_comment": r.reply_comment,
        "reply_at": r.reply_at,
        "images": r.images or [],
        "videos": r.videos or [],
        "created_at": r.created_at,
    }


def create(db: Session, client_id: int, data) -> BandReview:
    review = BandReview(
        artist_profile_id=data.artist_profile_id,
        venue_id=data.venue_id,
        client_id=client_id,
        booking_id=data.booking_id,
        rating=data.rating,
        comment=data.comment,
        images=data.images or [],
        videos=data.videos or [],
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    _recompute_artist_rating(db, data.artist_profile_id)
    _recompute_venue_rating(db, data.venue_id)
    return review


def summary(db: Session, artist_profile_id=None, venue_id=None, rating=None, search=None, limit=20, offset=0):
    q = db.query(BandReview).filter(BandReview.deleted_at.is_(None))
    if artist_profile_id:
        q = q.filter(BandReview.artist_profile_id == artist_profile_id)
    if venue_id:
        q = q.filter(BandReview.venue_id == venue_id)
    if rating:
        q = q.filter(BandReview.rating == rating)
    if search:
        like = f"%{search.lower()}%"
        q = q.filter(BandReview.comment.ilike(like))

    base = q
    total = base.count()
    rows = base.order_by(BandReview.created_at.desc()).offset(offset).limit(limit).all()

    avg_row = db.query(func.avg(BandReview.rating)).filter(BandReview.deleted_at.is_(None))
    dist_q = db.query(BandReview.rating, func.count(BandReview.id)).filter(BandReview.deleted_at.is_(None))
    if artist_profile_id:
        avg_row = avg_row.filter(BandReview.artist_profile_id == artist_profile_id)
        dist_q = dist_q.filter(BandReview.artist_profile_id == artist_profile_id)
    if venue_id:
        avg_row = avg_row.filter(BandReview.venue_id == venue_id)
        dist_q = dist_q.filter(BandReview.venue_id == venue_id)

    avg = float(avg_row.scalar() or 0)
    distribution = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
    for r_val, cnt in dist_q.group_by(BandReview.rating).all():
        distribution[int(r_val)] = int(cnt)

    return {
        "average_rating": round(avg, 2),
        "total_reviews": total,
        "rating_distribution": distribution,
        "reviews": [_serialize(r) for r in rows],
    }


def reply(db: Session, review_id: int, reply_comment: str, owner_account_id: int, is_venue: bool) -> BandReview:
    review = db.query(BandReview).filter(BandReview.id == review_id).first()
    if not review:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Review not found")

    # Ownership check
    if is_venue:
        v = db.query(BandVenue).filter(BandVenue.id == review.venue_id).first() if review.venue_id else None
        if not v or v.account_id != owner_account_id:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Not allowed to reply to this review")
    else:
        a = db.query(BandArtistProfile).filter(BandArtistProfile.id == review.artist_profile_id).first() if review.artist_profile_id else None
        if not a or a.account_id != owner_account_id:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Not allowed to reply to this review")

    review.reply_comment = reply_comment
    review.reply_at = datetime.utcnow()
    db.commit()
    db.refresh(review)
    _recompute_artist_rating(db, review.artist_profile_id)
    _recompute_venue_rating(db, review.venue_id)
    return review


def _recompute_artist_rating(db: Session, artist_profile_id: Optional[int]):
    if not artist_profile_id:
        return
    avg = db.query(func.avg(BandReview.rating)).filter(
        BandReview.artist_profile_id == artist_profile_id,
        BandReview.deleted_at.is_(None),
    ).scalar()
    artist = db.query(BandArtistProfile).filter(BandArtistProfile.id == artist_profile_id).first()
    if artist and avg is not None:
        artist.rating = round(float(avg), 2)
        db.commit()


def _recompute_venue_rating(db: Session, venue_id: Optional[int]):
    if not venue_id:
        return
    avg = db.query(func.avg(BandReview.rating)).filter(
        BandReview.venue_id == venue_id,
        BandReview.deleted_at.is_(None),
    ).scalar()
    venue = db.query(BandVenue).filter(BandVenue.id == venue_id).first()
    if venue:
        meta = dict(venue.metadata_fields or {})
        meta["average_rating"] = round(float(avg), 2) if avg is not None else 5.0
        venue.metadata_fields = meta
        db.commit()
