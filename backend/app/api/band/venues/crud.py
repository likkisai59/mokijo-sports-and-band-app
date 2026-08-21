"""
CRUD operations for Band Venues discovery and profiles.
"""
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, desc, asc
from app.models.band_models import BandVenue, BandAccount, BandCategory, BandCity


def get_venues(
    db: Session,
    query: Optional[str] = None,
    city: Optional[str] = None,
    venue_type: Optional[str] = None,
    min_capacity: Optional[int] = None,
    max_capacity: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    verification_status: Optional[str] = "approved",
    sort_by: str = "recommended",
    skip: int = 0,
    limit: int = 50,
) -> Tuple[List[BandVenue], int]:
    q = db.query(BandVenue).join(BandAccount, BandVenue.account_id == BandAccount.id)
    q = q.filter(BandAccount.is_active == True, BandVenue.deleted_at.is_(None))

    if verification_status and verification_status != "all":
        q = q.filter(BandVenue.verification_status == verification_status)

    if query:
        search_pattern = f"%{query}%"
        q = q.filter(
            or_(
                BandVenue.name.ilike(search_pattern),
                BandVenue.description.ilike(search_pattern),
                BandVenue.address.ilike(search_pattern),
                BandVenue.venue_type.ilike(search_pattern),
            )
        )

    if venue_type:
        q = q.filter(BandVenue.venue_type.ilike(venue_type))

    if min_capacity is not None:
        q = q.filter(BandVenue.capacity >= min_capacity)

    if max_capacity is not None:
        q = q.filter(BandVenue.capacity <= max_capacity)

    if min_price is not None:
        q = q.filter(BandVenue.base_price >= min_price)

    if max_price is not None:
        q = q.filter(BandVenue.base_price <= max_price)

    if city:
        q = q.join(BandCity, BandVenue.city_id == BandCity.id).filter(BandCity.name.ilike(f"%{city}%"))

    total = q.count()

    if sort_by == "price_asc":
        q = q.order_by(asc(BandVenue.base_price))
    elif sort_by == "price_desc":
        q = q.order_by(desc(BandVenue.base_price))
    elif sort_by == "capacity_desc":
        q = q.order_by(desc(BandVenue.capacity))
    else:
        q = q.order_by(desc(BandVenue.id))

    items = q.options(
        joinedload(BandVenue.city),
        joinedload(BandVenue.categories),
        joinedload(BandVenue.account),
    ).offset(skip).limit(limit).all()

    return items, total


def get_venue_by_id(db: Session, venue_id: int) -> Optional[BandVenue]:
    return (
        db.query(BandVenue)
        .options(
            joinedload(BandVenue.city),
            joinedload(BandVenue.categories),
            joinedload(BandVenue.account),
        )
        .filter(BandVenue.id == venue_id, BandVenue.deleted_at.is_(None))
        .first()
    )


def get_venue_by_account_id(db: Session, account_id: int) -> Optional[BandVenue]:
    return (
        db.query(BandVenue)
        .options(
            joinedload(BandVenue.city),
            joinedload(BandVenue.categories),
            joinedload(BandVenue.account),
        )
        .filter(BandVenue.account_id == account_id, BandVenue.deleted_at.is_(None))
        .first()
    )
