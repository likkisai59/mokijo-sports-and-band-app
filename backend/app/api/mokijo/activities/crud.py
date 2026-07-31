from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.models import Activity, ActivityRSVP, Booking, Slot, Base

def create_activity(db: Session, insert_data: dict) -> int:
    activity = Activity(**insert_data)
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity.id

def get_activity(db: Session, activity_id: int):
    return db.query(Activity).filter(Activity.id == activity_id).first()

def get_activity_for_update(db: Session, activity_id: int):
    return db.query(Activity).filter(Activity.id == activity_id).with_for_update().first()

def get_activities(db: Session, sport: Optional[str], location: Optional[str]):
    query = db.query(Activity)
    if sport and sport != "all":
        query = query.filter(Activity.sport == sport)
    if location:
        query = query.filter(Activity.location.ilike(f"%{location}%"))
    return query.all()

def update_activity(db: Session, activity_id: int, update_data: dict):
    if not update_data:
        return
    activity = get_activity(db, activity_id)
    if activity:
        for k, v in update_data.items():
            setattr(activity, k, v)
        db.commit()

def cancel_activity(db: Session, activity_id: int):
    activity = get_activity(db, activity_id)
    if activity:
        activity.status = 'cancelled'
        db.commit()

# RSVP
def create_rsvp(db: Session, insert_data: dict) -> int:
    rsvp = ActivityRSVP(**insert_data)
    db.add(rsvp)
    db.commit()
    db.refresh(rsvp)
    return rsvp.id

def get_rsvp(db: Session, rsvp_id: int):
    return db.query(ActivityRSVP).filter(ActivityRSVP.id == rsvp_id).first()

def get_rsvp_by_user(db: Session, activity_id: int, user_id: int):
    return db.query(ActivityRSVP).filter(
        ActivityRSVP.activity_id == activity_id,
        ActivityRSVP.user_id == user_id
    ).first()

def get_confirmed_rsvp_count(db: Session, activity_id: int) -> int:
    return db.query(ActivityRSVP).filter(
        ActivityRSVP.activity_id == activity_id,
        ActivityRSVP.status == 'confirmed'
    ).count()

def delete_rsvp(db: Session, rsvp_id: int):
    rsvp = get_rsvp(db, rsvp_id)
    if rsvp:
        db.delete(rsvp)
        db.commit()

def get_next_waitlisted_rsvp(db: Session, activity_id: int):
    return db.query(ActivityRSVP).filter(
        ActivityRSVP.activity_id == activity_id,
        ActivityRSVP.status == 'waitlisted'
    ).order_by(ActivityRSVP.joined_at.asc()).first()

def update_rsvp_status(db: Session, rsvp_id: int, status: str):
    rsvp = get_rsvp(db, rsvp_id)
    if rsvp:
        rsvp.status = status
        db.commit()

# Slots & Bookings interaction for Activities cancellation
def get_reserved_booking_for_slot(db: Session, slot_id: int):
    return db.query(Booking).filter(
        Booking.slots.any(Slot.id == slot_id),
        Booking.status == 'reserved'
    ).first()

def cancel_booking(db: Session, booking_id: int):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if booking:
        booking.status = 'cancelled'
        db.commit()

def get_slots_for_booking(db: Session, booking_id: int):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if booking:
        return [{"slot_id": slot.id} for slot in booking.slots]
    return []

def release_slot(db: Session, slot_id: int):
    slot = db.query(Slot).filter(Slot.id == slot_id).first()
    if slot:
        slot.status = 'AVAILABLE'
        slot.held_until = None
        slot.held_by_user_id = None
        db.commit()
