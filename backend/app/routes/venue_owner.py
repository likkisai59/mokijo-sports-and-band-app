from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter()


@router.post("/venue-owner/register")
def register_venue_owner(payload: schemas.VenueOwnerRegister, db: Session = Depends(get_db)):
    """Register a new venue owner along with their venue(s)."""
    email_clean = payload.owner.email.replace(" ", "").lower()

    existing = db.query(models.VenueOwner).filter(
        func.lower(models.VenueOwner.email) == email_clean
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered as a venue owner.")

    # Create owner
    owner = models.VenueOwner(
        full_name=payload.owner.full_name.strip(),
        dob=payload.owner.dob,
        email=email_clean,
        phone=payload.owner.phone.strip(),
        aadhar_number=payload.owner.aadhar_number,
        password=hash_password(payload.owner.password.strip()),
        is_verified=True,
    )
    db.add(owner)
    db.flush()  # get owner.id before committing

    # Create venues
    created_venues = []
    for v in payload.venues:
        venue = models.Venue(
            venue_owner_id=owner.id,
            owner_id=None,
            name=v.name.strip(),
            location=v.location.strip(),
            landmark=v.landmark,
            sports_supported=v.sports_supported,
            amenities=v.amenities,
            cover_image=v.cover_image,
            venue_images=v.venue_images,
            opening_time=v.opening_time,
            closing_time=v.closing_time,
            days_open=v.days_open,
            slot_duration=v.slot_duration or 60,
            rating=5.0,
        )
        db.add(venue)
        created_venues.append(venue)

    db.commit()
    db.refresh(owner)

    return {
        "message": "Venue registered successfully!",
        "ownerId": owner.id,
        "ownerName": owner.full_name,
        "venuesCount": len(created_venues),
    }


@router.post("/venue-owner/login")
def login_venue_owner(credentials: schemas.VenueOwnerLogin, db: Session = Depends(get_db)):
    """Authenticate a venue owner."""
    email_clean = credentials.email.replace(" ", "").lower()
    owner = db.query(models.VenueOwner).filter(
        func.lower(models.VenueOwner.email) == email_clean
    ).first()

    if not owner:
        raise HTTPException(status_code=400, detail="Invalid email or password.")
    if not verify_password(credentials.password.strip(), owner.password):
        raise HTTPException(status_code=400, detail="Invalid email or password.")

    # Lazy-migrate plain-text → bcrypt
    if owner.password and not (owner.password.startswith("$2b$") or owner.password.startswith("$2a$")):
        owner.password = hash_password(credentials.password.strip())
        db.commit()

    access_token = create_access_token({"sub": str(owner.id), "role": "venue_owner"})
    return {
        "message": "Login successful",
        "ownerId": owner.id,
        "ownerName": owner.full_name,
        "ownerEmail": owner.email,
        "isVenueOwner": True,
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.get("/venue-owner/{owner_id}/venues")
def get_owner_venues(owner_id: int, db: Session = Depends(get_db)):
    """Get all venues registered by a specific venue owner."""
    venues = db.query(models.Venue).filter(
        models.Venue.venue_owner_id == owner_id
    ).all()
    return [
        {
            "id": v.id,
            "name": v.name,
            "location": v.location,
            "landmark": v.landmark,
            "sports_supported": v.sports_supported,
            "amenities": v.amenities,
            "cover_image": v.cover_image,
            "venue_images": v.venue_images,
            "opening_time": v.opening_time,
            "closing_time": v.closing_time,
            "days_open": v.days_open,
            "slot_duration": v.slot_duration,
            "rating": v.rating,
        }
        for v in venues
    ]


@router.put("/venues/{venue_id}")
def update_venue(venue_id: int, data: schemas.VenueInput, owner_id: int, db: Session = Depends(get_db)):
    """Update venue details. Requires owner_id for authorization."""
    venue = db.query(models.Venue).filter(
        models.Venue.id == venue_id,
        models.Venue.venue_owner_id == owner_id
    ).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found or access denied.")

    venue.name = data.name.strip()
    venue.location = data.location.strip()
    venue.landmark = data.landmark
    venue.sports_supported = data.sports_supported
    venue.amenities = data.amenities
    venue.cover_image = data.cover_image
    venue.venue_images = data.venue_images
    venue.opening_time = data.opening_time
    venue.closing_time = data.closing_time
    venue.days_open = data.days_open
    venue.slot_duration = data.slot_duration or 60

    db.commit()
    db.refresh(venue)
    return {"message": "Venue updated successfully.", "id": venue.id}


@router.get("/bookings/venue-owner/{owner_id}")
def get_bookings_for_venue_owner(owner_id: int, db: Session = Depends(get_db)):
    """Get all bookings across all venues owned by this venue owner."""
    venues = db.query(models.Venue).filter(
        models.Venue.venue_owner_id == owner_id
    ).all()
    venue_ids = [v.id for v in venues]
    venue_map = {v.id: v.name for v in venues}

    if not venue_ids:
        return []

    bookings = (
        db.query(models.Booking)
        .join(models.Slot)
        .filter(models.Slot.venue_id.in_(venue_ids))
        .order_by(models.Booking.booking_date.desc())
        .all()
    )

    result = []
    for b in bookings:
        slot = b.slot
        user = db.query(models.User).filter(models.User.id == b.user_id).first()
        result.append({
            "booking_id": b.id,
            "venue_id": slot.venue_id,
            "venue_name": venue_map.get(slot.venue_id, "Unknown"),
            "sport": slot.sport,
            "start_time": slot.start_time.isoformat() if slot.start_time else None,
            "end_time": slot.end_time.isoformat() if slot.end_time else None,
            "amount_paid": b.amount_paid,
            "payment_status": b.payment_status,
            "booking_status": b.status,
            "booking_date": b.booking_date.isoformat() if b.booking_date else None,
            "customer_name": f"{user.first_name} {user.last_name}" if user else "Guest",
            "customer_email": user.email if user else "",
        })
    return result
