from sqlalchemy.orm import Session
from app.models import band_schemas as schemas
from app.models.band_models import BandArtistProfile, BandVenue, BandBooking, BandReview
from app.api.band.reviews import crud
from app.api.band.notifications import crud as notif_crud
from datetime import datetime
from fastapi import HTTPException

def _artist_profile_id(db: Session, account_id: int) -> int:
    p = db.query(BandArtistProfile).filter(BandArtistProfile.account_id == account_id).first()
    return p.id if p else 0

def _venue_id(db: Session, account_id: int) -> int:
    v = db.query(BandVenue).filter(BandVenue.account_id == account_id).first()
    return v.id if v else 0

def artist_reviews(db: Session, account_id: int, rating: int | None, search: str | None, page: int, limit: int):
    return crud.summary(db, artist_profile_id=_artist_profile_id(db, account_id),
                        rating=rating, search=search, limit=limit, offset=(page - 1) * limit)

def artist_reply(db: Session, account_id: int, review_id: int, payload: schemas.BandReviewReplyRequest):
    review = crud.reply(db, review_id, payload.reply_comment, account_id, is_venue=False)
    return crud._serialize(review)

def venue_reviews(db: Session, account_id: int, rating: int | None, search: str | None, page: int, limit: int):
    return crud.summary(db, venue_id=_venue_id(db, account_id),
                        rating=rating, search=search, limit=limit, offset=(page - 1) * limit)

def venue_reply(db: Session, account_id: int, review_id: int, payload: schemas.BandReviewReplyRequest):
    review = crud.reply(db, review_id, payload.reply_comment, account_id, is_venue=True)
    return crud._serialize(review)

def public_venue_reviews(db: Session, venue_id: int, rating: int | None, search: str | None, page: int, limit: int):
    return crud.summary(db, venue_id=venue_id, rating=rating, search=search, limit=limit, offset=(page - 1) * limit)

def check_eligibility(db: Session, account_id: int, booking_id: int):
    booking = db.query(BandBooking).filter(BandBooking.id == booking_id).first()
    if not booking:
        return {"eligible": False, "booking_id": booking_id, "already_reviewed": False, "reason": "Booking not found"}
    
    if booking.client_id != account_id:
        return {"eligible": False, "booking_id": booking_id, "already_reviewed": False, "reason": "Only the client can review this booking"}
        
    if booking.status != "completed":
        return {"eligible": False, "booking_id": booking_id, "already_reviewed": False, "reason": "Only completed bookings can be reviewed"}

    existing_review = db.query(BandReview).filter(
        BandReview.booking_id == booking_id,
        BandReview.client_id == account_id,
        BandReview.deleted_at.is_(None)
    ).first()

    if existing_review:
        return {"eligible": False, "booking_id": booking_id, "already_reviewed": True, "reason": "You have already submitted a review for this booking"}

    return {"eligible": True, "booking_id": booking_id, "already_reviewed": False, "reason": None}

def create_review(db: Session, account_id: int, payload: schemas.BandReviewCreateRequest):
    if not payload.booking_id:
        raise HTTPException(status_code=400, detail="booking_id is required")

    eligibility = check_eligibility(db, account_id, payload.booking_id)
    if not eligibility.get("eligible"):
        raise HTTPException(status_code=400, detail=eligibility.get("reason", "Not eligible to review"))

    review = crud.create(db, account_id, payload)

    # Timeline & Notifications
    booking = db.query(BandBooking).filter(BandBooking.id == payload.booking_id).first()
    if booking:
        evt = {
            "by": "client",
            "timestamp": datetime.utcnow().isoformat(),
            "message": "Review Submitted"
        }
        booking_timeline = list(booking.timeline)
        booking_timeline.append(evt)
        booking.timeline = booking_timeline
        db.commit()

        if booking.artist_profile_id:
            artist_account_id = booking.artist.account_id if booking.artist else None
            if artist_account_id:
                notif_crud.create(
                    db, account_id=artist_account_id, title="New Review Received",
                    message=f"The client has submitted a {payload.rating}-star review for '{booking.event_name}'.",
                    notification_type="review_received", reference_type="booking", reference_id=booking.id
                )

    return crud._serialize(review)
