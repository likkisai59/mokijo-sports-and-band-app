from typing import Optional, List, Dict, Any
from datetime import datetime, time, date
from sqlalchemy.orm import Session
from sqlalchemy import text, or_, desc
from app.models.models import Venue, Court, Slot, Booking, Review, VenueBookingOrder, User, Message

def to_dict(obj):
    if not obj:
        return None
    d = dict(obj.__dict__)
    d.pop('_sa_instance_state', None)
    return d

def to_dict_list(obj_list):
    return [to_dict(obj) for obj in obj_list]

def execute_query(db: Session, query: str, params: tuple = ()):
    query = query.replace('%s', ':p_')
    for i in range(query.count(':p_')):
        query = query.replace(':p_', f':p_{i}', 1)
    
    bind_params = {f'p_{i}': val for i, val in enumerate(params)}
    db.execute(text(query), bind_params)
    db.commit()

def fetch_one(db: Session, query: str, params: tuple = ()):
    query = query.replace('%s', ':p_')
    for i in range(query.count(':p_')):
        query = query.replace(':p_', f':p_{i}', 1)
    
    bind_params = {f'p_{i}': val for i, val in enumerate(params)}
    result = db.execute(text(query), bind_params).mappings().first()
    return dict(result) if result else None

def fetch_all(db: Session, query: str, params: tuple = ()):
    query = query.replace('%s', ':p_')
    for i in range(query.count(':p_')):
        query = query.replace(':p_', f':p_{i}', 1)
    
    bind_params = {f'p_{i}': val for i, val in enumerate(params)}
    result = db.execute(text(query), bind_params).mappings().all()
    return [dict(row) for row in result]

# VENUES
def create_venue(db: Session, insert_data: dict) -> int:
    venue = Venue(**insert_data)
    db.add(venue)
    db.commit()
    db.refresh(venue)
    return venue.id

def get_venue(db: Session, venue_id: int):
    return to_dict(db.query(Venue).filter(Venue.id == venue_id).first())

def get_venue_id(db: Session, venue_id: int):
    res = db.query(Venue.id).filter(Venue.id == venue_id).first()
    return {"id": res[0]} if res else None

def get_venues_by_owner(db: Session, owner_id: int):
    return to_dict_list(db.query(Venue).filter(or_(Venue.venue_owner_id == owner_id, Venue.owner_id == owner_id)).all())

def get_venues_filtered(
    db: Session,
    sport: Optional[str] = None,
    location: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    min_rating: Optional[float] = None
):
    query = db.query(Venue)
    if sport:
        query = query.filter(Venue.sports_supported.ilike(f"%{sport}%"))
    if location:
        query = query.filter(Venue.location.ilike(f"%{location}%"))
    if min_price is not None:
        query = query.filter(Venue.base_price_per_hour >= min_price)
    if max_price is not None:
        query = query.filter(Venue.base_price_per_hour <= max_price)
    if min_rating is not None:
        query = query.filter(Venue.rating >= min_rating)
    return to_dict_list(query.order_by(Venue.id.desc()).all())

def get_venues_dynamic(db: Session, query: str, params: tuple):
    return fetch_all(db, query, params)

def update_venue_dynamic(db: Session, query: str, params: tuple):
    execute_query(db, query, params)

def update_venue_rating(db: Session, venue_id: int, rating: float):
    db.query(Venue).filter(Venue.id == venue_id).update({"rating": rating})
    db.commit()

# SLOTS
def get_slots_by_booking(db: Session, booking_id: int):
    query = "SELECT s.* FROM slots s JOIN booking_slots bs ON s.id = bs.slot_id WHERE bs.booking_id = %s"
    return fetch_all(db, query, (booking_id,))

def create_slot(db: Session, insert_data: dict) -> int:
    slot = Slot(**insert_data)
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot.id

def get_slots_by_ids(db: Session, placeholders: str, slot_ids: tuple):
    query = f"SELECT * FROM slots WHERE id IN ({placeholders})"
    return fetch_all(db, query, slot_ids)

from datetime import date, datetime, time

def get_slots_by_venue_and_date(db: Session, venue_id: int, start_date, end_date=None):
    if isinstance(start_date, (date, datetime)):
        d = start_date if type(start_date) is date else start_date.date()
        start_ts = datetime.combine(d, time.min)
        end_ts = datetime.combine(d, time.max)
    elif end_date:
        start_ts = start_date
        end_ts = end_date
    else:
        start_ts = start_date
        end_ts = start_date
    return to_dict_list(db.query(Slot).filter(
        Slot.venue_id == venue_id,
        Slot.start_time >= start_ts,
        Slot.start_time <= end_ts
    ).order_by(Slot.start_time.asc()).all())

def update_slot_status(db: Session, slot_id: int, status: str):
    db.query(Slot).filter(Slot.id == slot_id).update({"status": status})
    db.commit()

def update_slots_status_available(db: Session, placeholders: str, slot_ids: tuple):
    query = f"UPDATE slots SET status = 'AVAILABLE' WHERE id IN ({placeholders})"
    execute_query(db, query, slot_ids)

def update_slots_unblock(db: Session, placeholders: str, slot_ids: tuple):
    query = f"UPDATE slots SET status = 'AVAILABLE', is_blocked = FALSE WHERE id IN ({placeholders})"
    execute_query(db, query, slot_ids)

def get_venue_slots_count(db: Session, venue_id: int):
    count = db.query(Slot).filter(Slot.venue_id == venue_id).count()
    return {"count": count}

def get_slot_for_update(db: Session, slot_id: int):
    slot = db.query(Slot).filter(Slot.id == slot_id).with_for_update().first()
    return to_dict(slot)

def get_expired_held_slots(db: Session, venue_id: int, target_date=None, now=None):
    now = now or datetime.utcnow()
    query = db.query(Slot).filter(
        Slot.venue_id == venue_id,
        Slot.status == "HELD",
        Slot.held_until < now
    )
    return to_dict_list(query.all())

def release_slots(db: Session, slot_ids: list):
    if slot_ids:
        db.query(Slot).filter(Slot.id.in_(slot_ids)).update({
            "status": "AVAILABLE",
            "held_until": None,
            "held_by_user_id": None
        }, synchronize_session=False)
        db.commit()

def get_active_bookings_for_slots(db: Session, slot_ids: list):
    if not slot_ids:
        return []
    try:
        return fetch_all(
            db,
            "SELECT bs.slot_id, b.status FROM booking_slots bs JOIN bookings b ON bs.booking_id = b.id WHERE bs.slot_id IN ({}) AND b.status IN ('CONFIRMED', 'PENDING', 'reserved')".format(
                ", ".join(["%s"] * len(slot_ids))
            ),
            tuple(slot_ids)
        )
    except Exception:
        return []

def update_slot_status(db: Session, slot_id: int, status_val: str):
    db.query(Slot).filter(Slot.id == slot_id).update({"status": status_val}, synchronize_session=False)
    db.commit()

# BOOKINGS
def create_booking(db: Session, insert_booking: dict) -> int:
    booking = Booking(**insert_booking)
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking.id

def create_booking_slot(db: Session, booking_id: int, slot_id: int):
    execute_query(db, "INSERT INTO booking_slots (booking_id, slot_id) VALUES (%s, %s)", (booking_id, slot_id))

def get_booking(db: Session, booking_id: int):
    return to_dict(db.query(Booking).filter(Booking.id == booking_id).first())

def get_booking_for_update(db: Session, booking_id: int):
    booking = db.query(Booking).filter(Booking.id == booking_id).with_for_update().first()
    return to_dict(booking)

def get_active_bookings(db: Session, venue_id: int, dt: str):
    query = "SELECT * FROM bookings WHERE venue_id = %s AND status = 'CONFIRMED' AND booking_date >= %s"
    return fetch_all(db, query, (venue_id, dt))

def get_bookings_by_venue(db: Session, venue_id: int):
    query = "SELECT * FROM bookings WHERE venue_id = %s ORDER BY created_at DESC"
    return fetch_all(db, query, (venue_id,))

def update_booking_status(db: Session, booking_id: int, status: str, cancelled_at: Optional[str] = None, reason: Optional[str] = None):
    update_data = {"status": status}
    if cancelled_at and reason:
        update_data["cancelled_at"] = cancelled_at
        update_data["cancellation_reason"] = reason
    db.query(Booking).filter(Booking.id == booking_id).update(update_data)
    db.commit()

def update_booking_payment(db: Session, booking_id: int, payment_id: str, status: str = 'CONFIRMED', payment_status: str = 'PAID'):
    db.query(Booking).filter(Booking.id == booking_id).update({
        "status": status,
        "payment_status": payment_status,
        "payment_id": payment_id
    })
    db.commit()

# OTHERS
def get_expired_held_slots_by_time(db: Session, hold_expiry_time: str):
    query = "SELECT id FROM slots WHERE status = 'HELD' AND (hold_expires_at IS NULL OR hold_expires_at <= %s)"
    return fetch_all(db, query, (hold_expiry_time,))

def clear_expired_held_slots(db: Session, hold_expiry_time: str):
    query = "UPDATE slots SET status = 'AVAILABLE', hold_expires_at = NULL WHERE status = 'HELD' AND (hold_expires_at IS NULL OR hold_expires_at <= %s)"
    execute_query(db, query, (hold_expiry_time,))

def create_court(db: Session, insert_data: dict) -> int:
    court = Court(**insert_data)
    db.add(court)
    db.commit()
    db.refresh(court)
    return court.id

def get_court(db: Session, court_id: int):
    return to_dict(db.query(Court).filter(Court.id == court_id).first())

def create_review(db: Session, insert_data: dict) -> int:
    review = Review(**insert_data)
    db.add(review)
    db.commit()
    db.refresh(review)
    return review.id

def get_review(db: Session, review_id: int):
    return to_dict(db.query(Review).filter(Review.id == review_id).first())

def get_average_rating(db: Session, venue_id: int):
    query = "SELECT AVG(rating) as avg FROM reviews WHERE venue_id = %s"
    return fetch_one(db, query, (venue_id,))

def create_venue_booking_order(db: Session, insert_data: dict) -> int:
    order = VenueBookingOrder(**insert_data)
    db.add(order)
    db.commit()
    db.refresh(order)
    return order.id

def get_venue_booking_order(db: Session, razorpay_order_id: str):
    return to_dict(db.query(VenueBookingOrder).filter(VenueBookingOrder.razorpay_order_id == razorpay_order_id).first())

def update_venue_booking_order_status(db: Session, razorpay_order_id: str, status: str):
    db.query(VenueBookingOrder).filter(VenueBookingOrder.razorpay_order_id == razorpay_order_id).update({"status": status})
    db.commit()

def get_expired_pending_bookings(db: Session, expiry_time: str):
    query = "SELECT id FROM bookings WHERE status = 'PENDING' AND created_at <= %s"
    return fetch_all(db, query, (expiry_time,))

def cancel_expired_pending_bookings(db: Session, expiry_time: str):
    query = "UPDATE bookings SET status = 'CANCELLED' WHERE status = 'PENDING' AND created_at <= %s"
    execute_query(db, query, (expiry_time,))

def get_user_basic(db: Session, user_id: int):
    res = db.query(User.first_name, User.last_name, User.email).filter(User.id == user_id).first()
    return {"first_name": res.first_name, "last_name": res.last_name, "email": res.email} if res else None

def get_user_full(db: Session, user_id: int):
    return to_dict(db.query(User).filter(User.id == user_id).first())

def create_message(db: Session, insert_data: dict) -> int:
    msg = Message(**insert_data)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg.id

def get_slot_by_id(db: Session, slot_id: int, venue_id: Optional[int] = None):
    query = db.query(Slot).filter(Slot.id == slot_id)
    if venue_id:
        query = query.filter(Slot.venue_id == venue_id)
    return to_dict(query.first())

def update_slot_by_id(db: Session, slot_id: int, update_data: dict):
    valid_keys = {c.name for c in Slot.__table__.columns}
    clean_data = {k: v for k, v in update_data.items() if k in valid_keys and v is not None}
    if clean_data:
        db.query(Slot).filter(Slot.id == slot_id).update(clean_data, synchronize_session=False)
        db.commit()
    return get_slot_by_id(db, slot_id)

def delete_slot_by_id(db: Session, slot_id: int):
    db.query(Slot).filter(Slot.id == slot_id).delete(synchronize_session=False)
    db.commit()

def get_bookings_by_user(db: Session, user_id: int):
    return to_dict_list(
        db.query(Booking)
        .filter(
            (Booking.user_id == user_id) | (Booking.member_id == user_id)
        )
        .order_by(desc(Booking.booking_date))
        .all()
    )

def get_slots_by_venue_and_date(db: Session, venue_id: int, target_date: date):
    start_dt = datetime.combine(target_date, time.min)
    end_dt = datetime.combine(target_date, time.max)
    return to_dict_list(
        db.query(Slot)
        .filter(
            Slot.venue_id == venue_id,
            Slot.start_time >= start_dt,
            Slot.start_time <= end_dt
        )
        .order_by(Slot.start_time.asc())
        .all()
    )

def get_slots_by_booking_id(db: Session, booking_id: int):
    res = db.execute(
        text("SELECT slot_id FROM booking_slots WHERE booking_id = :b_id"),
        {"b_id": booking_id}
    ).fetchall()
    slot_ids = [r[0] for r in res]
    if not slot_ids:
        return []
    return to_dict_list(db.query(Slot).filter(Slot.id.in_(slot_ids)).all())

def get_venue_basic(db: Session, venue_id: int):
    return to_dict(db.query(Venue).filter(Venue.id == venue_id).first())

def get_user_basic(db: Session, user_id: int):
    return to_dict(db.query(User).filter(User.id == user_id).first())

def get_user_full(db: Session, user_id: int):
    return to_dict(db.query(User).filter(User.id == user_id).first())

def get_member_by_id(db: Session, member_id: int):
    return to_dict(db.query(Member).filter(Member.id == member_id).first())

def get_slots_for_update(db: Session, slot_ids: List[int]):
    return to_dict_list(
        db.query(Slot)
        .filter(Slot.id.in_(slot_ids))
        .with_for_update()
        .all()
    )

def hold_slot(db: Session, slot_id: int, expiry: datetime, user_id: int):
    db.query(Slot).filter(Slot.id == slot_id).update({
        "status": "HELD",
        "held_until": expiry,
        "held_by_user_id": user_id
    }, synchronize_session=False)
    db.commit()

def release_slot(db: Session, slot_id: int):
    db.query(Slot).filter(Slot.id == slot_id).update({
        "status": "AVAILABLE",
        "held_until": None,
        "held_by_user_id": None
    }, synchronize_session=False)
    db.commit()

def release_slots(db: Session, slot_ids: List[int]):
    db.query(Slot).filter(Slot.id.in_(slot_ids)).update({
        "status": "AVAILABLE",
        "held_until": None,
        "held_by_user_id": None
    }, synchronize_session=False)
    db.commit()

def book_slot(db: Session, slot_id: int):
    db.query(Slot).filter(Slot.id == slot_id).update({
        "status": "BOOKED",
        "held_until": None,
        "held_by_user_id": None
    }, synchronize_session=False)
    db.commit()

def create_booking(db: Session, insert_data: dict):
    b = Booking(**insert_data)
    db.add(b)
    db.commit()
    db.refresh(b)
    return b.id

def create_booking_slot(db: Session, booking_id: int, slot_id: int):
    try:
        db.execute(text("INSERT INTO booking_slots (booking_id, slot_id) VALUES (:b_id, :s_id) ON CONFLICT DO NOTHING"), {"b_id": booking_id, "s_id": slot_id})
        db.commit()
    except Exception:
        db.rollback()

def get_booking(db: Session, booking_id: int):
    return to_dict(db.query(Booking).filter(Booking.id == booking_id).first())

def get_booking_by_id(db: Session, booking_id: int):
    return to_dict(db.query(Booking).filter(Booking.id == booking_id).first())

def get_booking_by_id_and_user(db: Session, booking_id: int, user_id: int):
    return to_dict(db.query(Booking).filter(Booking.id == booking_id, (Booking.user_id == user_id) | (Booking.member_id == user_id)).first())

def update_booking_status_confirmed(db: Session, booking_id: int, payment_id: Optional[str] = None):
    db.query(Booking).filter(Booking.id == booking_id).update({
        "status": "confirmed",
        "payment_status": "paid",
        "payment_id": payment_id
    }, synchronize_session=False)
    db.commit()

def update_booking_status_failed(db: Session, booking_id: int, payment_id: Optional[str] = None):
    db.query(Booking).filter(Booking.id == booking_id).update({
        "status": "failed",
        "payment_status": "failed",
        "payment_id": payment_id
    }, synchronize_session=False)
    db.commit()

def create_venue_booking_order(db: Session, order_data: dict):
    order = VenueBookingOrder(**order_data)
    db.add(order)
    db.commit()
    db.refresh(order)
    return order.id

def get_venue_booking_order(db: Session, booking_id: int, razorpay_order_id: str):
    return to_dict(db.query(VenueBookingOrder).filter(VenueBookingOrder.booking_id == booking_id, VenueBookingOrder.razorpay_order_id == razorpay_order_id).first())

def update_venue_booking_order_success(db: Session, order_id: int, razorpay_payment_id: str, razorpay_signature: str, verified_at: datetime):
    db.query(VenueBookingOrder).filter(VenueBookingOrder.id == order_id).update({
        "status": "paid",
        "razorpay_payment_id": razorpay_payment_id,
        "razorpay_signature": razorpay_signature,
        "verified_at": verified_at
    }, synchronize_session=False)
    db.commit()

def update_venue_booking_order_failed(db: Session, order_id: int, razorpay_payment_id: str, razorpay_signature: str):
    db.query(VenueBookingOrder).filter(VenueBookingOrder.id == order_id).update({
        "status": "failed",
        "razorpay_payment_id": razorpay_payment_id,
        "razorpay_signature": razorpay_signature
    }, synchronize_session=False)
    db.commit()

def get_expired_held_slots(db: Session, venue_id: int, target_date: date, now: datetime):
    start_dt = datetime.combine(target_date, time.min)
    end_dt = datetime.combine(target_date, time.max)
    return to_dict_list(
        db.query(Slot)
        .filter(
            Slot.venue_id == venue_id,
            Slot.start_time >= start_dt,
            Slot.start_time <= end_dt,
            Slot.status == "HELD",
            Slot.held_until < now
        )
        .all()
    )

def get_active_bookings_for_slots(db: Session, slot_ids: List[int]):
    if not slot_ids:
        return []
    res = db.execute(
        text("SELECT bs.slot_id, bs.booking_id FROM booking_slots bs JOIN bookings b ON bs.booking_id = b.id WHERE bs.slot_id IN :s_ids AND b.status IN ('confirmed', 'pending_payment')"),
        {"s_ids": tuple(slot_ids)}
    ).fetchall()
    return [{"slot_id": r[0], "booking_id": r[1]} for r in res]

def get_venue_by_id(db: Session, venue_id: int):
    return to_dict(db.query(Venue).filter(Venue.id == venue_id).first())

def get_slot_ids_for_booking(db: Session, booking_id: int):
    res = db.execute(
        text("SELECT slot_id FROM booking_slots WHERE booking_id = :b_id"),
        {"b_id": booking_id}
    ).fetchall()
    return [{"slot_id": r[0]} for r in res]

def update_booking_cancelled(db: Session, booking_id: int, payment_status: str, cancelled_at: datetime, reason: str):
    db.query(Booking).filter(Booking.id == booking_id).update({
        "status": "cancelled",
        "payment_status": payment_status,
        "cancelled_at": cancelled_at,
        "cancellation_reason": reason
    }, synchronize_session=False)
    db.commit()

def update_booking_status_rejected(db: Session, booking_id: int):
    db.query(Booking).filter(Booking.id == booking_id).update({
        "status": "rejected"
    }, synchronize_session=False)
    db.commit()

def get_bookings_by_venue_with_time(db: Session, venue_id: int):
    res = db.execute(
        text("""
            SELECT b.id, b.user_id, b.status, b.payment_status, b.amount_paid, b.booking_date,
                   s.start_time, s.end_time
            FROM bookings b
            JOIN booking_slots bs ON b.id = bs.booking_id
            JOIN slots s ON bs.slot_id = s.id
            WHERE s.venue_id = :v_id
            ORDER BY b.booking_date DESC
        """),
        {"v_id": venue_id}
    ).mappings().all()
    return [dict(r) for r in res]

def get_paid_bookings_by_venue(db: Session, venue_id: int):
    res = db.execute(
        text("""
            SELECT b.id, b.amount_paid, b.booking_date, b.payment_status
            FROM bookings b
            JOIN booking_slots bs ON b.id = bs.booking_id
            JOIN slots s ON bs.slot_id = s.id
            WHERE s.venue_id = :v_id AND b.payment_status = 'paid'
            ORDER BY b.booking_date DESC
        """),
        {"v_id": venue_id}
    ).mappings().all()
    return [dict(r) for r in res]

def block_slots_bulk(db: Session, slot_ids: List[int]):
    if not slot_ids:
        return
    db.query(Slot).filter(Slot.id.in_(slot_ids)).update(
        {"is_blocked": True, "status": "BLOCKED"}, synchronize_session=False
    )
    db.commit()

def unblock_slots_bulk(db: Session, slot_ids: List[int]):
    if not slot_ids:
        return
    db.query(Slot).filter(Slot.id.in_(slot_ids)).update(
        {"is_blocked": False, "status": "AVAILABLE"}, synchronize_session=False
    )
    db.commit()

def get_slot_by_id_and_venue(db: Session, slot_id: int, venue_id: int):
    return to_dict(db.query(Slot).filter(Slot.id == slot_id, Slot.venue_id == venue_id).first())

def block_slot(db: Session, slot_id: int):
    db.query(Slot).filter(Slot.id == slot_id).update(
        {"is_blocked": True, "status": "BLOCKED"}, synchronize_session=False
    )
    db.commit()

def unblock_slot(db: Session, slot_id: int):
    db.query(Slot).filter(Slot.id == slot_id).update(
        {"is_blocked": False, "status": "AVAILABLE"}, synchronize_session=False
    )
    db.commit()

