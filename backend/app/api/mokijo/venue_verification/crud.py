from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.models import Venue, VenueOwner, VenueDocument, VenueVerificationLog, MukijoAdmin

def to_dict(obj):
    if not obj:
        return None
    d = dict(obj.__dict__)
    d.pop('_sa_instance_state', None)
    return d

def to_dict_list(obj_list):
    return [to_dict(obj) for obj in obj_list]

def get_venue_by_id(db: Session, venue_id: int):
    return to_dict(db.query(Venue).filter(Venue.id == venue_id).first())

def get_venue_by_id_and_owner(db: Session, venue_id: int, owner_id: int):
    return to_dict(db.query(Venue).filter(Venue.id == venue_id, Venue.venue_owner_id == owner_id).first())

def get_owner_email(db: Session, venue_id: int):
    res = db.query(VenueOwner.email).join(Venue, Venue.venue_owner_id == VenueOwner.id).filter(Venue.id == venue_id).first()
    return res[0] if res else None

def count_venue_documents(db: Session, venue_id: int):
    return db.query(VenueDocument).filter(VenueDocument.venue_id == venue_id).count()

def update_venue_details(db: Session, venue_id: int, update_data: dict):
    db.query(Venue).filter(Venue.id == venue_id).update(update_data, synchronize_session=False)
    db.commit()

def update_venue_gps(db: Session, venue_id: int, latitude: str, longitude: str, captured_at):
    db.query(Venue).filter(Venue.id == venue_id).update({
        "gps_latitude": latitude,
        "gps_longitude": longitude,
        "gps_captured_at": captured_at
    }, synchronize_session=False)
    db.commit()

def update_venue_documents_submitted(db: Session, venue_id: int, submitted: bool):
    db.query(Venue).filter(Venue.id == venue_id).update({"documents_submitted": submitted}, synchronize_session=False)
    db.commit()

def get_venue_documents(db: Session, venue_id: int):
    return to_dict_list(db.query(VenueDocument).filter(VenueDocument.venue_id == venue_id).order_by(desc(VenueDocument.uploaded_at)).all())

def get_venues_with_owners_by_status(db: Session, verification_status: str):
    res = db.query(Venue, VenueOwner).outerjoin(VenueOwner, Venue.venue_owner_id == VenueOwner.id).filter(Venue.verification_status == verification_status).order_by(desc(Venue.verification_submitted_at)).all()
    out = []
    for v, vo in res:
        d = to_dict(v)
        if vo:
            d["owner_name"] = vo.full_name
            d["owner_email"] = vo.email
        out.append(d)
    return out

def get_all_venues_with_owners(db: Session):
    res = db.query(Venue, VenueOwner).outerjoin(VenueOwner, Venue.venue_owner_id == VenueOwner.id).filter(Venue.venue_owner_id.isnot(None)).order_by(desc(Venue.verification_submitted_at)).all()
    out = []
    for v, vo in res:
        d = to_dict(v)
        if vo:
            d["owner_name"] = vo.full_name
            d["owner_email"] = vo.email
        out.append(d)
    return out

def get_venue_with_owner_by_id(db: Session, venue_id: int):
    res = db.query(Venue, VenueOwner).outerjoin(VenueOwner, Venue.venue_owner_id == VenueOwner.id).filter(Venue.id == venue_id).first()
    if res:
        v, vo = res
        d = to_dict(v)
        if vo:
            d["owner_name"] = vo.full_name
            d["owner_email"] = vo.email
            d["owner_phone"] = vo.phone
        return d
    return None

def get_venue_verification_logs(db: Session, venue_id: int):
    return to_dict_list(db.query(VenueVerificationLog).filter(VenueVerificationLog.venue_id == venue_id).order_by(desc(VenueVerificationLog.created_at)).all())

def update_venue_verification_status(db: Session, venue_id: int, status: str):
    db.query(Venue).filter(Venue.id == venue_id).update({"verification_status": status}, synchronize_session=False)
    db.commit()

def update_venue_verification_approved(db: Session, venue_id: int, verified_at, verified_by, notes):
    db.query(Venue).filter(Venue.id == venue_id).update({
        "verification_status": 'VERIFIED',
        "verified_at": verified_at,
        "verified_by": verified_by,
        "rejection_reason": None,
        "verification_notes": notes
    }, synchronize_session=False)
    db.commit()

def update_venue_verification_rejected(db: Session, venue_id: int, reason: str, notes: str):
    db.query(Venue).filter(Venue.id == venue_id).update({
        "verification_status": 'REJECTED',
        "rejection_reason": reason,
        "verification_notes": notes
    }, synchronize_session=False)
    db.commit()

def update_venue_verification_more_info(db: Session, venue_id: int, notes: str):
    db.query(Venue).filter(Venue.id == venue_id).update({
        "verification_status": 'MORE_INFO_REQUIRED',
        "verification_notes": notes
    }, synchronize_session=False)
    db.commit()

def update_venue_verification_suspended(db: Session, venue_id: int, reason: str):
    db.query(Venue).filter(Venue.id == venue_id).update({
        "verification_status": 'SUSPENDED',
        "rejection_reason": reason
    }, synchronize_session=False)
    db.commit()

def get_admin_id_by_email(db: Session, email: str):
    admin = db.query(MukijoAdmin).filter(MukijoAdmin.email.ilike(email)).first()
    return {"id": admin.id} if admin else None

def get_admin_by_email(db: Session, email: str):
    return to_dict(db.query(MukijoAdmin).filter(MukijoAdmin.email.ilike(email)).first())

def log_verification_action(db: Session, insert_data: dict):
    log = VenueVerificationLog(**insert_data)
    db.add(log)
    db.commit()
    db.refresh(log)

def add_venue_document(db: Session, insert_data: dict):
    doc = VenueDocument(**insert_data)
    db.add(doc)
    db.commit()
    db.refresh(doc)
