from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text
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
    return to_dict_list(db.query(Venue).filter(Venue.venue_owner_id == owner_id).all())

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

def get_slots_by_venue_and_date(db: Session, venue_id: int, start: str, end: str):
    query = "SELECT * FROM slots WHERE venue_id = %s AND start_time >= %s AND start_time < %s ORDER BY start_time ASC"
    return fetch_all(db, query, (venue_id, start, end))

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
def get_expired_held_slots(db: Session, hold_expiry_time: str):
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
