from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File, Form, Header
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date, datetime
import json

from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from app.routes.helpers import *


router = APIRouter()


@router.post("/venues", response_model=schemas.VenueResponse)
def create_venue(venue: schemas.VenueCreate, db: Session = Depends(get_db)):
    """Add a new sports venue into the discoverable registry."""
    new_venue = models.Venue(
        owner_id=venue.owner_id,
        name=venue.name,
        location=venue.location,
        latitude=venue.latitude,
        longitude=venue.longitude,
        sports_supported=venue.sports_supported,
        amenities=venue.amenities,
        rating=venue.rating or 5.0,
        cover_image=venue.cover_image,
        venue_images=venue.venue_images
    )
    db.add(new_venue)
    db.commit()
    db.refresh(new_venue)
    return new_venue

@router.get("/venues", response_model=List[schemas.VenueResponse])
def get_venues(
    sport: Optional[str] = None,
    location: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    min_rating: Optional[float] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    max_distance: Optional[float] = None,
    date: Optional[str] = None,
    only_available: Optional[bool] = False,
    db: Session = Depends(get_db)
):
    """Search and discover nearby venues filtered by location, sport, pricing, ratings, distance, and availability."""
    query = db.query(models.Venue).filter(models.Venue.venue_owner_id.isnot(None))
    if sport and sport != "all":
        query = query.filter(models.Venue.sports_supported.like(f"%{sport}%"))
    if location:
        query = query.filter(models.Venue.location.like(f"%{location}%"))
    if min_price is not None:
        query = query.filter(models.Venue.base_price_per_hour >= min_price)
    if max_price is not None:
        query = query.filter(models.Venue.base_price_per_hour <= max_price)
    if min_rating is not None:
        query = query.filter(models.Venue.rating >= min_rating)

    venues = query.all()

    # Calculate distances if coordinates are provided
    if latitude is not None and longitude is not None:
        import math
        venues_with_distance = []
        for venue in venues:
            if venue.latitude is not None and venue.longitude is not None:
                R = 6371.0  # Earth radius in km
                lat1_rad = math.radians(latitude)
                lon1_rad = math.radians(longitude)
                lat2_rad = math.radians(venue.latitude)
                lon2_rad = math.radians(venue.longitude)

                dlat = lat2_rad - lat1_rad
                dlon = lon2_rad - lon1_rad

                a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
                c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
                dist = R * c
                venue.distance = round(dist, 2)
            else:
                venue.distance = None
            venues_with_distance.append(venue)

            # Filter by maximum distance if requested
        if max_distance is not None:
            venues_with_distance = [
                v for v in venues_with_distance
                if v.distance is not None and v.distance <= max_distance
            ]

        # Sort by distance (venues with distance calculated first, sorted ascending)
        venues = sorted(
            venues_with_distance,
            key=lambda x: (x.distance is None, x.distance or float('inf'))
        )
    else:
        for venue in venues:
            venue.distance = None

    # Filter by real-time availability on a given date
    if only_available:
        from datetime import date as dt_date
        from datetime import datetime as dt_datetime
        if not date:
            date_str = dt_date.today().isoformat()
        else:
            date_str = date

        try:
            target_date = dt_datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD.")

        available_venues = []
        for venue in venues:
            # Query the database for existing slots on target date
            slots = db.query(models.Slot).filter(
                models.Slot.venue_id == venue.id,
                func.date(models.Slot.start_time) == target_date
            ).all()

            if len(slots) == 0:
                # If no slots are generated yet, it defaults to AVAILABLE (slots generated on-demand)
                available_venues.append(venue)
            else:
                # Must have at least one unblocked slot with AVAILABLE status and no active bookings
                has_available_slot = False
                for slot in slots:
                    if not slot.is_blocked:
                        if slot.status == "AVAILABLE":
                            # Check bookings
                            has_active_booking = any(b.status in ["reserved", "confirmed"] for b in slot.bookings)
                            if not has_active_booking:
                                has_available_slot = True
                                break
                        elif slot.status == "HELD" and slot.held_until and slot.held_until < dt_datetime.utcnow():
                            has_available_slot = True
                            break
                if has_available_slot:
                    available_venues.append(venue)
        venues = available_venues

    return venues

@router.post("/venues/{venue_id}/slots", response_model=List[schemas.SlotResponse])
def create_venue_slots(venue_id: int, slots: List[schemas.SlotCreate], db: Session = Depends(get_db)):
    """Batch insert sports slot inventories for a venue."""
    created_slots = []
    for slot in slots:
        new_slot = models.Slot(
            venue_id=venue_id,
            sport=slot.sport,
            start_time=slot.start_time,
            end_time=slot.end_time,
            base_price=slot.base_price,
            current_price=slot.current_price,
            is_blocked=slot.is_blocked
        )
        db.add(new_slot)
        created_slots.append(new_slot)
    db.commit()
    for slot in created_slots:
        db.refresh(slot)
    return created_slots

@router.get("/venues/{venue_id}/slots", response_model=List[schemas.SlotResponse])
def get_venue_slots(venue_id: int, date_str: Optional[str] = None, db: Session = Depends(get_db)):
    """Fetch availability schedules/slots for a specific venue, filtered by YYYY-MM-DD."""
    if not date_str:
        from datetime import date
        date_str = date.today().isoformat()
        
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD.")
        
    venue = db.query(models.Venue).filter(models.Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")

    existing_slots_count = db.query(models.Slot).filter(
        models.Slot.venue_id == venue_id,
        func.date(models.Slot.start_time) == target_date
    ).count()

    if existing_slots_count == 0:
        sports = ["badminton"]
        if venue.sports_supported:
            try:
                parsed = json.loads(venue.sports_supported)
                if isinstance(parsed, list) and len(parsed) > 0:
                    sports = parsed
            except Exception:
                if "," in venue.sports_supported:
                    sports = [s.strip() for s in venue.sports_supported.split(",") if s.strip()]
                elif venue.sports_supported.strip():
                    sports = [venue.sports_supported.strip()]
                    
        default_times = [
            ("07:00", "08:00", 1200),
            ("09:00", "10:00", 1000),
            ("17:00", "18:00", 1500),
            ("19:00", "20:00", 1800)
        ]
        
        for i, (start_t, end_t, price) in enumerate(default_times):
            sport = sports[i % len(sports)]
            start_dt = datetime.combine(target_date, datetime.strptime(start_t, "%H:%M").time())
            end_dt = datetime.combine(target_date, datetime.strptime(end_t, "%H:%M").time())
            
            new_slot = models.Slot(
                venue_id=venue_id,
                sport=sport,
                start_time=start_dt,
                end_time=end_dt,
                base_price=price,
                current_price=price,
                is_blocked=False
            )
            db.add(new_slot)
        db.commit()

    slots = db.query(models.Slot).filter(
        models.Slot.venue_id == venue_id,
        func.date(models.Slot.start_time) == target_date
    ).all()

    # Dynamic status update for backward-compatibility with old database records
    for slot in slots:
        if slot.status == "AVAILABLE":
            has_active_booking = any(b.status in ["reserved", "confirmed"] for b in slot.bookings)
            if has_active_booking:
                slot.status = "BOOKED"

    return slots

@router.post("/bookings", response_model=schemas.BookingResponse)
def create_booking(booking: schemas.BookingCreate, db: Session = Depends(get_db)):
    """Place a venue slot reservation with concurrency protection to prevent double bookings."""
    # Write lock the target slot rows
    slots = db.query(models.Slot).filter(models.Slot.id.in_(booking.slot_ids)).with_for_update().all()
    
    if len(slots) != len(booking.slot_ids):
        raise HTTPException(status_code=404, detail="One or more slots not found.")
    
    for slot in slots:
        if slot.is_blocked:
            raise HTTPException(status_code=400, detail=f"Slot ID {slot.id} is blocked and unavailable.")
        if slot.status == "BOOKED":
            raise HTTPException(status_code=409, detail=f"Slot ID {slot.id} is already booked.")

    # Proceed to create reservation
    new_booking = models.Booking(
        user_id=booking.user_id,
        court_id=booking.court_id,
        amount_paid=booking.amount_paid or sum(slot.current_price for slot in slots),
        payment_status=booking.payment_status or "pending",
        status="reserved"
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    
    # Associate slots
    for slot in slots:
        new_booking.slots.append(slot)
        slot.status = "BOOKED"
    db.commit()
    db.refresh(new_booking)
    return new_booking


@router.get("/venues/owner/{owner_id}", response_model=List[schemas.VenueResponse])
def get_owner_venues(owner_id: int, db: Session = Depends(get_db)):
    """Retrieve all venues owned by a specific partner/owner."""
    return db.query(models.Venue).filter(models.Venue.owner_id == owner_id).all()


@router.post("/venues/{venue_id}/block-slots")
def block_venue_slots(venue_id: int, req: schemas.BlockSlotsRequest, db: Session = Depends(get_db)):
    """Block slots within a date range for holidays or partner reservation."""
    try:
        start_date = datetime.strptime(req.start_date, "%Y-%m-%d").date()
        end_date = datetime.strptime(req.end_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    if start_date > end_date:
        raise HTTPException(status_code=400, detail="Start date must be before or equal to end date.")

    venue = db.query(models.Venue).filter(models.Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")

    slots = db.query(models.Slot).filter(
        models.Slot.venue_id == venue_id,
        func.date(models.Slot.start_time) >= start_date,
        func.date(models.Slot.start_time) <= end_date
    )
    if req.sport:
        slots = slots.filter(models.Slot.sport == req.sport)
    
    slots_list = slots.all()
    for slot in slots_list:
        slot.is_blocked = True
        
    db.commit()
    return {"message": f"Successfully blocked {len(slots_list)} slots between {req.start_date} and {req.end_date}."}


@router.post("/venues/{venue_id}/unblock-slots")
def unblock_venue_slots(venue_id: int, req: schemas.UnblockSlotsRequest, db: Session = Depends(get_db)):
    """Unblock slots within a date range."""
    try:
        start_date = datetime.strptime(req.start_date, "%Y-%m-%d").date()
        end_date = datetime.strptime(req.end_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    if start_date > end_date:
        raise HTTPException(status_code=400, detail="Start date must be before or equal to end date.")

    venue = db.query(models.Venue).filter(models.Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")

    slots = db.query(models.Slot).filter(
        models.Slot.venue_id == venue_id,
        func.date(models.Slot.start_time) >= start_date,
        func.date(models.Slot.start_time) <= end_date
    )
    if req.sport:
        slots = slots.filter(models.Slot.sport == req.sport)
    
    slots_list = slots.all()
    for slot in slots_list:
        slot.is_blocked = False
        
    db.commit()
    return {"message": f"Successfully unblocked {len(slots_list)} slots between {req.start_date} and {req.end_date}."}


@router.get("/venues/{venue_id}/payouts", response_model=schemas.PayoutsResponse)
def get_venue_payouts(venue_id: int, db: Session = Depends(get_db)):
    """Calculate revenue, platform fees, and payout history for a venue."""
    venue = db.query(models.Venue).filter(models.Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")

    bookings = db.query(models.Booking).join(models.Booking.slots).filter(
        models.Slot.venue_id == venue_id,
        models.Booking.payment_status == "paid"
    ).all()

    total_revenue = sum(b.amount_paid for b in bookings)
    platform_fee = round(total_revenue * 0.10, 2)
    final_payout = round(total_revenue * 0.90, 2)

    payout_history = []
    monthly_data = {}
    
    for booking in bookings:
        month_key = booking.booking_date.strftime("%Y-%m")
        monthly_data[month_key] = monthly_data.get(month_key, 0) + booking.amount_paid

    sorted_months = sorted(monthly_data.keys(), reverse=True)
    for i, month in enumerate(sorted_months):
        m_revenue = monthly_data[month]
        m_payout = round(m_revenue * 0.90, 2)
        current_month = datetime.utcnow().strftime("%Y-%m")
        status = "processing" if month == current_month else "transferred"
        
        payout_history.append(
            schemas.PayoutHistoryResponse(
                id=f"PAY-{venue_id}-{month.replace('-', '')}",
                date=f"{month}-28",
                amount=m_payout,
                status=status,
                utr=f"UTR{venue_id:04d}{month.replace('-', '')}{i:02d}" if status == "transferred" else "PENDING"
            )
        )

    if not payout_history:
        payout_history.append(
            schemas.PayoutHistoryResponse(
                id=f"PAY-{venue_id}-MOCK",
                date=datetime.utcnow().strftime("%Y-%m-%d"),
                amount=0.0,
                status="processing",
                utr="PENDING"
            )
        )

    return schemas.PayoutsResponse(
        total_revenue=float(total_revenue),
        platform_fee=float(platform_fee),
        final_payout=float(final_payout),
        payout_history=payout_history
    )


@router.get("/venues/{venue_id}/analytics", response_model=schemas.SaaSAnalyticsResponse)
def get_venue_analytics(venue_id: int, db: Session = Depends(get_db)):
    """Generate analytics for occupancy, peak hours, revenue trends, and customer retention."""
    venue = db.query(models.Venue).filter(models.Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")

    total_slots = db.query(models.Slot).filter(models.Slot.venue_id == venue_id).count()
    bookings = db.query(models.Booking).join(models.Booking.slots).filter(
        models.Slot.venue_id == venue_id
    ).all()
    
    total_bookings = len(bookings)
    paid_bookings = [b for b in bookings if b.payment_status == "paid"]
    total_revenue = sum(b.amount_paid for b in paid_bookings)

    occupancy_rate = round((total_bookings / total_slots * 100), 1) if total_slots > 0 else 0.0

    hour_counts = {}
    for booking in bookings:
        hour_str = booking.slot.start_time.strftime("%I:%M %p")
        hour_counts[hour_str] = hour_counts.get(hour_str, 0) + 1

    peak_hours = []
    for time_slot, count in hour_counts.items():
        pct = round((count / total_bookings * 100), 1) if total_bookings > 0 else 0.0
        peak_hours.append(
            schemas.PeakHourInfo(
                time=time_slot,
                bookings_count=count,
                percentage=pct
            )
        )
    peak_hours = sorted(peak_hours, key=lambda x: x.bookings_count, reverse=True)[:5]

    monthly_revenue = {}
    for b in paid_bookings:
        month_name = b.booking_date.strftime("%B %Y")
        monthly_revenue[month_name] = monthly_revenue.get(month_name, 0.0) + float(b.amount_paid)

    revenue_trends = []
    if not monthly_revenue:
        revenue_trends.append(
            schemas.RevenueTrendInfo(
                month=datetime.utcnow().strftime("%B %Y"),
                revenue=0.0
            )
        )
    else:
        for month, rev in monthly_revenue.items():
            revenue_trends.append(
                schemas.RevenueTrendInfo(
                    month=month,
                    revenue=rev
                )
            )
        revenue_trends = sorted(revenue_trends, key=lambda x: x.month)

    user_bookings = {}
    for b in bookings:
        user_id = b.user_id
        if user_id not in user_bookings:
            user_bookings[user_id] = []
        user_bookings[user_id].append(b)

    customer_retention = []
    for u_id, u_bookings in user_bookings.items():
        user = db.query(models.User).filter(models.User.id == u_id).first()
        u_name = f"{user.first_name} {user.last_name}" if user else f"User {u_id}"
        u_email = user.email if user else "N/A"
        
        bookings_count = len(u_bookings)
        is_repeat = bookings_count > 1
        
        customer_retention.append(
            schemas.CustomerRetentionInfo(
                user_id=u_id,
                user_name=u_name,
                user_email=u_email,
                bookings_count=bookings_count,
                is_repeat=is_repeat
            )
        )
        
    customer_retention = sorted(customer_retention, key=lambda x: x.bookings_count, reverse=True)[:10]

    return schemas.SaaSAnalyticsResponse(
        occupancy_rate=occupancy_rate,
        total_revenue=float(total_revenue),
        total_bookings=total_bookings,
        peak_hours=peak_hours,
        revenue_trends=revenue_trends,
        customer_retention=customer_retention
    )


# --- ADDITIONAL VENUE DISCOVERY & BOOKING MODULE ROUTES ---

@router.post("/venues/{venue_id}/courts", response_model=schemas.CourtResponse)
def create_court(venue_id: int, court: schemas.CourtCreate, db: Session = Depends(get_db)):
    """Register a new court inside a sports venue."""
    venue = db.query(models.Venue).filter(models.Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")

    new_court = models.Court(
        venue_id=venue_id,
        name=court.name,
        sport_type=court.sport_type,
        capacity=court.capacity,
        price_per_hour=court.price_per_hour
    )
    db.add(new_court)
    db.commit()
    db.refresh(new_court)
    return new_court


@router.post("/venues/{venue_id}/reviews", response_model=schemas.ReviewResponse)
def create_review(venue_id: int, review: schemas.ReviewCreate, db: Session = Depends(get_db)):
    """Post a customer review for a venue."""
    venue = db.query(models.Venue).filter(models.Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")

    new_review = models.Review(
        venue_id=venue_id,
        user_id=review.user_id,
        booking_id=review.booking_id,
        rating=review.rating,
        comment=review.comment,
        created_at=datetime.utcnow()
    )
    db.add(new_review)
    db.flush()

    # Recalculate average rating of venue
    avg_rating = db.query(func.avg(models.Review.rating)).filter(models.Review.venue_id == venue_id).scalar()
    if avg_rating:
        venue.rating = round(float(avg_rating), 1)

    db.commit()
    db.refresh(new_review)

    # Add user name attribute for response compatibility
    user = db.query(models.User).filter(models.User.id == review.user_id).first()
    res = schemas.ReviewResponse.model_validate(new_review)
    res.user_name = f"{user.first_name} {user.last_name}" if user else "Anonymous"
    return res


@router.post("/bookings/hold", response_model=schemas.BookingResponse)
def hold_booking_slots(req: schemas.SlotHoldRequest, db: Session = Depends(get_db)):
    """Atomically locks selected slots for 5 minutes to prevent double-booking."""
    from datetime import timedelta
    now = datetime.utcnow()

    # 1. Acquire row lock on target slots, skip locked rows
    slots = db.query(models.Slot).filter(
        models.Slot.id.in_(req.slot_ids)
    ).with_for_update(skip_locked=True).all()

    # 2. Check if all slots exist and are unlocked
    if len(slots) != len(req.slot_ids):
        db.rollback()
        raise HTTPException(
            status_code=409, 
            detail="One or more selected slots are currently locked in checkout by another session. Please select other slots."
        )

    # 3. Check for availability status
    for s in slots:
        if s.status != "AVAILABLE":
            # If held, check if expired
            if s.status == "HELD" and s.held_until and s.held_until < now:
                continue
            raise HTTPException(
                status_code=400, 
                detail=f"Slot starting at {s.start_time.strftime('%I:%M %p')} is already booked or blocked."
            )

    # 4. Lock slots for 5 minutes
    expiry = now + timedelta(minutes=5)
    total_amount = 0
    court_id = None
    for s in slots:
        s.status = "HELD"
        s.held_until = expiry
        s.held_by_user_id = req.user_id
        total_amount += s.current_price
        if s.court_id:
            court_id = s.court_id

    # 5. Create Booking in pending_payment state
    booking = models.Booking(
        user_id=req.user_id,
        court_id=court_id,
        status="pending_payment",
        amount_paid=total_amount,
        payment_status="pending",
        booking_date=now
    )
    db.add(booking)
    db.flush()

    # Link slots to booking via join table
    for s in slots:
        db.execute(models.booking_slots.insert().values(booking_id=booking.id, slot_id=s.id))

    db.commit()
    db.refresh(booking)
    return booking


@router.post("/bookings/confirm", response_model=schemas.BookingResponse)
def confirm_booking(req: schemas.BookingConfirmRequest, db: Session = Depends(get_db)):
    """Confirm user slots booking after payment gateway webhook response."""
    booking = db.query(models.Booking).filter(models.Booking.id == req.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Lock slots and verify they belong to this booking
    slots = booking.slots

    # Overbooking late webhook recovery edge case
    for s in slots:
        if s.status == "BOOKED":
            # Already confirmed, return booking details
            continue
        if s.status == "AVAILABLE" or (s.status == "HELD" and s.held_by_user_id == booking.user_id):
            s.status = "BOOKED"
            s.held_until = None
            s.held_by_user_id = None
        else:
            # Overbooked slot scenario (slot hold expired and booked by user B in mean time)
            booking.status = "failed_overbooked"
            booking.payment_status = "refund_needed"
            booking.payment_id = req.payment_id
            db.commit()
            raise HTTPException(
                status_code=409, 
                detail="Checkout expired and slot was booked by another user. Refund initiated."
            )

    booking.status = "confirmed"
    booking.payment_status = "paid"
    booking.payment_id = req.payment_id
    db.commit()
    db.refresh(booking)
    return booking


@router.post("/bookings/{booking_id}/cancel", response_model=schemas.BookingResponse)
def cancel_booking(booking_id: int, reason: Optional[str] = "User cancelled", db: Session = Depends(get_db)):
    """Cancel booking and free up the time slots."""
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status == "cancelled":
        return booking

    # Free the slots
    for s in booking.slots:
        s.status = "AVAILABLE"
        s.held_until = None
        s.held_by_user_id = None

    booking.status = "cancelled"
    if booking.payment_status == "paid":
        booking.payment_status = "refunded"
    booking.cancelled_at = datetime.utcnow()
    booking.cancellation_reason = reason

    db.commit()
    db.refresh(booking)
    return booking


@router.get("/users/{user_id}/bookings", response_model=List[schemas.BookingResponse])
def get_user_bookings(user_id: int, db: Session = Depends(get_db)):
    """Get all bookings placed by a specific standard user."""
    # Active cron style automatic hold release before returning
    now = datetime.utcnow()
    expired_slots = db.query(models.Slot).filter(
        models.Slot.status == "HELD",
        models.Slot.held_until < now
    ).all()
    for s in expired_slots:
        s.status = "AVAILABLE"
        s.held_until = None
        s.held_by_user_id = None
    if expired_slots:
        db.commit()

    bookings = db.query(models.Booking).filter(
        models.Booking.user_id == user_id
    ).order_by(models.Booking.booking_date.desc()).all()
    return bookings


@router.get("/bookings/{booking_id}", response_model=schemas.BookingResponse)
def get_booking_by_id(booking_id: int, db: Session = Depends(get_db)):
    """Retrieve a single booking by ID."""
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking



