"""
CRUD operations for Band Artists discovery and profiles.
"""
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, desc, asc
from app.models.band_models import BandArtistProfile, BandAccount, BandCategory


def get_artists(
    db: Session,
    query: Optional[str] = None,
    genre: Optional[str] = None,
    language: Optional[str] = None,
    band_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    verification_status: Optional[str] = "approved",
    sort_by: str = "rating_desc",
    skip: int = 0,
    limit: int = 50,
) -> Tuple[List[BandArtistProfile], int]:
    q = db.query(BandArtistProfile).join(BandAccount, BandArtistProfile.account_id == BandAccount.id)
    q = q.filter(BandAccount.is_active == True, BandArtistProfile.deleted_at.is_(None))

    if verification_status and verification_status != "all":
        q = q.filter(BandArtistProfile.verification_status == verification_status)

    if query:
        search_pattern = f"%{query}%"
        q = q.filter(
            or_(
                BandArtistProfile.display_name.ilike(search_pattern),
                BandArtistProfile.username.ilike(search_pattern),
                BandArtistProfile.bio.ilike(search_pattern),
                BandAccount.name.ilike(search_pattern),
            )
        )

    if band_type:
        q = q.filter(BandArtistProfile.band_type.ilike(band_type))

    if min_price is not None:
        q = q.filter(BandArtistProfile.base_rate >= min_price)

    if max_price is not None:
        q = q.filter(BandArtistProfile.base_rate <= max_price)

    if min_rating is not None:
        q = q.filter(BandArtistProfile.rating >= min_rating)

    if genre:
        q = q.filter(BandArtistProfile.genres.any(BandCategory.name.ilike(genre)))

    if language:
        q = q.filter(BandArtistProfile.languages.any(BandCategory.name.ilike(language)))

    total = q.count()

    # Sorting
    if sort_by == "price_asc":
        q = q.order_by(asc(BandArtistProfile.base_rate))
    elif sort_by == "price_desc":
        q = q.order_by(desc(BandArtistProfile.base_rate))
    elif sort_by == "rating_desc":
        q = q.order_by(desc(BandArtistProfile.rating), desc(BandArtistProfile.id))
    else:
        q = q.order_by(desc(BandArtistProfile.id))

    items = q.options(
        joinedload(BandArtistProfile.genres),
        joinedload(BandArtistProfile.languages),
        joinedload(BandArtistProfile.account),
    ).offset(skip).limit(limit).all()

    return items, total


def get_artist_by_id(db: Session, artist_id: int) -> Optional[BandArtistProfile]:
    return (
        db.query(BandArtistProfile)
        .options(
            joinedload(BandArtistProfile.genres),
            joinedload(BandArtistProfile.languages),
            joinedload(BandArtistProfile.account),
        )
        .filter(BandArtistProfile.id == artist_id, BandArtistProfile.deleted_at.is_(None))
        .first()
    )


def get_artist_by_username(db: Session, username: str) -> Optional[BandArtistProfile]:
    clean_username = username.lstrip("@").strip().lower()
    return (
        db.query(BandArtistProfile)
        .options(
            joinedload(BandArtistProfile.genres),
            joinedload(BandArtistProfile.languages),
            joinedload(BandArtistProfile.account),
        )
        .filter(
            BandArtistProfile.username.ilike(clean_username),
            BandArtistProfile.deleted_at.is_(None),
        )
        .first()
    )


def get_featured_artists(db: Session, limit: int = 6) -> List[BandArtistProfile]:
    return (
        db.query(BandArtistProfile)
        .options(
            joinedload(BandArtistProfile.genres),
            joinedload(BandArtistProfile.languages),
            joinedload(BandArtistProfile.account),
        )
        .filter(
            BandArtistProfile.verification_status == "approved",
            BandArtistProfile.deleted_at.is_(None),
        )
        .order_by(desc(BandArtistProfile.rating), desc(BandArtistProfile.id))
        .limit(limit)
        .all()
    )


def get_artist_by_account_id(db: Session, account_id: int) -> Optional[BandArtistProfile]:
    return (
        db.query(BandArtistProfile)
        .options(
            joinedload(BandArtistProfile.genres),
            joinedload(BandArtistProfile.languages),
            joinedload(BandArtistProfile.account),
        )
        .filter(BandArtistProfile.account_id == account_id, BandArtistProfile.deleted_at.is_(None))
        .first()
    )


def sync_artist_categories(
    db: Session,
    artist: BandArtistProfile,
    genres: Optional[List[str]] = None,
    languages: Optional[List[str]] = None,
):
    """Associate taxonomy categories with artist profile."""
    if genres is not None:
        matched_genres = []
        for g_name in genres:
            clean_g = g_name.strip()
            if not clean_g:
                continue
            cat = (
                db.query(BandCategory)
                .filter(
                    BandCategory.name.ilike(clean_g),
                    BandCategory.type.in_(["music_genre", "genre"]),
                    BandCategory.is_active == True,
                )
                .first()
            )
            if not cat:
                cat = BandCategory(name=clean_g, type="music_genre", is_active=True)
                db.add(cat)
                db.flush()
            if cat not in matched_genres:
                matched_genres.append(cat)
        artist.genres = matched_genres

    if languages is not None:
        matched_langs = []
        for l_name in languages:
            clean_l = l_name.strip()
            if not clean_l:
                continue
            cat = (
                db.query(BandCategory)
                .filter(
                    BandCategory.name.ilike(clean_l),
                    BandCategory.type == "language",
                    BandCategory.is_active == True,
                )
                .first()
            )
            if not cat:
                cat = BandCategory(name=clean_l, type="language", is_active=True)
                db.add(cat)
                db.flush()
            if cat not in matched_langs:
                matched_langs.append(cat)
        artist.languages = matched_langs


def update_artist_profile(
    db: Session,
    artist: BandArtistProfile,
    fields: dict,
    genres: Optional[List[str]] = None,
    languages: Optional[List[str]] = None,
) -> BandArtistProfile:
    for key, value in fields.items():
        if hasattr(artist, key) and value is not None:
            setattr(artist, key, value)

    sync_artist_categories(db, artist, genres=genres, languages=languages)
    db.commit()
    db.refresh(artist)
    return artist
