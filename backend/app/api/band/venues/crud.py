"""CRUD + serialization for Band venue profiles."""

from typing import Optional

from sqlalchemy.orm import Session

from app.models.band_models import BandVenue, BandCategory


def get_by_id(db: Session, venue_id: int) -> Optional[BandVenue]:
    return db.query(BandVenue).filter(BandVenue.id == venue_id).filter(BandVenue.deleted_at.is_(None)).first()


def get_by_account(db: Session, account_id: int) -> Optional[BandVenue]:
    return (
        db.query(BandVenue)
        .filter(BandVenue.account_id == account_id)
        .filter(BandVenue.deleted_at.is_(None))
        .first()
    )


def list_filtered(db: Session, search: str | None = None, verification_status: str | None = None,
                  limit: int = 50, offset: int = 0):
    q = db.query(BandVenue).filter(BandVenue.deleted_at.is_(None))
    if search:
        like = f"%{search.lower()}%"
        q = q.filter(BandVenue.name.ilike(like) | BandVenue.address.ilike(like))
    if verification_status:
        q = q.filter(BandVenue.verification_status == verification_status)
    total = q.count()
    items = q.order_by(BandVenue.created_at.desc()).offset(offset).limit(limit).all()
    return items, total


def list_public_filtered(
    db: Session,
    search: str | None = None,
    city: str | None = None,
    min_capacity: int | None = None,
    max_price: float | None = None,
    limit: int = 50,
    offset: int = 0
):
    q = db.query(BandVenue).filter(
        BandVenue.deleted_at.is_(None),
        BandVenue.verification_status == "approved"
    )

    if search:
        like = f"%{search.lower()}%"
        q = q.filter(
            BandVenue.name.ilike(like) | BandVenue.address.ilike(like)
        )
    
    # We will ignore city for now, similar to artists, as geographic modeling is complex
    
    if min_capacity is not None:
        q = q.filter(BandVenue.capacity >= min_capacity)
        
    if max_price is not None:
        q = q.filter(BandVenue.base_price <= max_price)
        
    total = q.count()
    items = q.order_by(BandVenue.created_at.desc()).offset(offset).limit(limit).all()
    return items, total



def resolve_category(db: Session, name: str) -> BandCategory:
    cat = db.query(BandCategory).filter(BandCategory.name.ilike(name)).first()
    if not cat:
        cat = BandCategory(name=name, type="venue_category", is_active=True)
        db.add(cat)
        db.flush()
    return cat


def serialize(venue: BandVenue) -> dict:
    meta = venue.metadata_fields or {}
    return {
        "id": venue.id,
        "account_id": venue.account_id,
        "name": venue.name,
        "description": venue.description,
        "address": venue.address,
        "city_id": venue.city_id,
        "base_price": float(venue.base_price or 0),
        "capacity": venue.capacity or 0,
        "min_capacity": venue.min_capacity or 0,
        "venue_type": venue.venue_type,
        "business_name": venue.business_name,
        "contact_details": venue.contact_details,
        "pincode": venue.pincode,
        "state": venue.state,
        "country": venue.country,
        "google_map_location": venue.google_map_location,
        "verification_status": venue.verification_status,
        "verification_notes": venue.verification_notes,
        "facilities": venue.facilities or [],
        "gallery": venue.gallery or [],
        "pricing_details": venue.pricing_details or {},
        "availability_rules": venue.availability_rules or {},
        "documents": venue.documents or {},
        "metadata_fields": meta,
        "categories": [c.name for c in (venue.categories or [])],
        "created_at": venue.created_at,
    }
