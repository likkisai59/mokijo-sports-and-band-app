"""CRUD + serialization helpers for Band artist profiles."""

from typing import Optional

from sqlalchemy.orm import Session

from app.models.band_models import BandArtistProfile, BandCategory, band_artist_genres


def get_by_id(db: Session, artist_id: int) -> Optional[BandArtistProfile]:
    return (
        db.query(BandArtistProfile)
        .filter(BandArtistProfile.id == artist_id)
        .filter(BandArtistProfile.deleted_at.is_(None))
        .first()
    )


def get_by_account(db: Session, account_id: int) -> Optional[BandArtistProfile]:
    return (
        db.query(BandArtistProfile)
        .filter(BandArtistProfile.account_id == account_id)
        .filter(BandArtistProfile.deleted_at.is_(None))
        .first()
    )


def list_filtered(db: Session, search: str | None = None, verification_status: str | None = None,
                  limit: int = 50, offset: int = 0):
    q = db.query(BandArtistProfile).filter(BandArtistProfile.deleted_at.is_(None))
    if search:
        like = f"%{search.lower()}%"
        q = q.filter(
            BandArtistProfile.display_name.ilike(like)
            | BandArtistProfile.bio.ilike(like)
        )
    if verification_status:
        q = q.filter(BandArtistProfile.verification_status == verification_status)
    total = q.count()
    items = q.order_by(BandArtistProfile.created_at.desc()).offset(offset).limit(limit).all()
    return items, total


def list_public_filtered(
    db: Session,
    search: str | None = None,
    city: str | None = None,
    performer_type: str | None = None,
    genre: str | None = None,
    min_rate: float | None = None,
    max_rate: float | None = None,
    min_rating: float | None = None,
    limit: int = 50,
    offset: int = 0
):
    q = db.query(BandArtistProfile).filter(
        BandArtistProfile.deleted_at.is_(None),
        BandArtistProfile.verification_status == "approved"
    )

    if search:
        like = f"%{search.lower()}%"
        q = q.filter(
            BandArtistProfile.display_name.ilike(like)
            | BandArtistProfile.bio.ilike(like)
        )
    
    # Simple JSON/JSONB text matching for city (since geography is minimal or in metadata)
    # Actually, BandAccount doesn't have city directly, and BandArtistProfile relies on metadata/location in the app.
    # We will ignore city for now, or match it if there is a column. There's no direct city column on BandArtistProfile.
    
    if performer_type:
        q = q.filter(BandArtistProfile.band_type.ilike(performer_type))
    
    if genre:
        q = q.join(BandArtistProfile.genres).filter(BandCategory.name.ilike(genre))
        
    if min_rate is not None:
        q = q.filter(BandArtistProfile.base_rate >= min_rate)
        
    if max_rate is not None:
        q = q.filter(BandArtistProfile.base_rate <= max_rate)
        
    if min_rating is not None:
        q = q.filter(BandArtistProfile.rating >= min_rating)
        
    total = q.count()
    items = q.order_by(BandArtistProfile.rating.desc(), BandArtistProfile.created_at.desc()).offset(offset).limit(limit).all()
    return items, total



def resolve_category(db: Session, name: str, type_: str) -> BandCategory:
    """Find or auto-create a taxonomy category by name+type (reference behavior)."""
    cat = (
        db.query(BandCategory)
        .filter(BandCategory.name.ilike(name))
        .filter(BandCategory.type == type_)
        .first()
    )
    if not cat:
        cat = BandCategory(name=name, type=type_, is_active=True)
        db.add(cat)
        db.flush()
    return cat


def serialize(artist: BandArtistProfile) -> dict:
    """Build a JSON-safe dict matching BandArtistProfileResponse."""
    return {
        "id": artist.id,
        "account_id": artist.account_id,
        "display_name": artist.display_name,
        "bio": artist.bio,
        "base_rate": float(artist.base_rate or 0),
        "rating": float(artist.rating or 5.0),
        "verification_status": artist.verification_status,
        "verification_notes": artist.verification_notes,
        "mobile_number": artist.mobile_number,
        "years_of_experience": artist.years_of_experience or 0,
        "profile_image": artist.profile_image,
        "cover_image": artist.cover_image,
        "band_type": artist.band_type,
        "total_members": artist.total_members or 1,
        "currency": artist.currency,
        "travel_radius": float(artist.travel_radius or 0),
        "travel_charges": float(artist.travel_charges or 0),
        "min_booking_hours": float(artist.min_booking_hours or 0),
        "max_booking_hours": float(artist.max_booking_hours or 0),
        "equipment": artist.equipment or [],
        "availability": artist.availability or {},
        "social_links": artist.social_links or {},
        "achievements": artist.achievements or [],
        "documents": artist.documents or [],
        "gallery": artist.gallery or [],
        "videos": artist.videos or [],
        "youtube_links": artist.youtube_links or [],
        "instagram_reels": artist.instagram_reels or [],
        "pricing_details": artist.pricing_details or {},
        "genres": [c.name for c in (artist.genres or [])],
        "languages": [c.name for c in (artist.languages or [])],
        "created_at": artist.created_at,
    }
