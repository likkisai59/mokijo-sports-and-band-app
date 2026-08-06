from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from app.models.models import VenueOwner, Venue, Booking, Slot, User

def to_dict(obj):
    if not obj:
        return None
    d = dict(obj.__dict__)
    d.pop('_sa_instance_state', None)
    return d

def to_dict_list(obj_list):
    return [to_dict(obj) for obj in obj_list]

def create_venue_owner(db: Session, insert_data: dict) -> int:
    owner = VenueOwner(**insert_data)
    db.add(owner)
    db.commit()
    db.refresh(owner)
    return owner.id

def get_venue_owner_by_id(db: Session, owner_id: int):
    return to_dict(db.query(VenueOwner).filter(VenueOwner.id == owner_id).first())

def create_venue(db: Session, insert_data: dict) -> int:
    venue = Venue(**insert_data)
    db.add(venue)
    db.commit()
    db.refresh(venue)
    return venue.id

def get_venues_by_owner_id(db: Session, owner_id: int):
    return to_dict_list(db.query(Venue).filter(or_(Venue.venue_owner_id == owner_id, Venue.owner_id == owner_id)).all())

def get_owner_by_email(db: Session, email: str):
    return to_dict(db.query(VenueOwner).filter(VenueOwner.email.ilike(email)).first())

def update_owner_password(db: Session, owner_id: int, new_password: str):
    db.query(VenueOwner).filter(VenueOwner.id == owner_id).update({"password": new_password}, synchronize_session=False)
    db.commit()

def get_venue_by_id_and_owner(db: Session, venue_id: int, owner_id: int):
    return to_dict(db.query(Venue).filter(Venue.id == venue_id, Venue.venue_owner_id == owner_id).first())

def update_venue_details(db: Session, venue_id: int, update_data: dict):
    db.query(Venue).filter(Venue.id == venue_id).update(update_data, synchronize_session=False)
    db.commit()

def get_venue_basics_by_owner(db: Session, owner_id: int):
    res = db.query(Venue.id, Venue.name).filter(Venue.venue_owner_id == owner_id).all()
    return [{"id": r[0], "name": r[1]} for r in res]

def get_bookings_for_venues(db: Session, venue_ids: list):
    # Mimics: SELECT DISTINCT ON (b.id) b.*, s.sport, s.start_time, s.end_time, s.venue_id 
    # FROM bookings b JOIN booking_slots bs ON b.id = bs.booking_id JOIN slots s ON s.id = bs.slot_id 
    # WHERE s.venue_id IN ({placeholders})
    # Since we just need the dictionary, we can do a distinct fetch.
    res = db.query(Booking, Slot).join(Booking.slots).filter(Slot.venue_id.in_(venue_ids)).distinct(Booking.id).all()
    out = []
    for b, s in res:
        d = to_dict(b)
        d["sport"] = s.sport
        d["start_time"] = s.start_time
        d["end_time"] = s.end_time
        d["venue_id"] = s.venue_id
        out.append(d)
    return out

def get_user_basic(db: Session, user_id: int):
    res = db.query(User.first_name, User.last_name, User.email).filter(User.id == user_id).first()
    if res:
        return {"first_name": res[0], "last_name": res[1], "email": res[2]}
    return None
