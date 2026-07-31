"""CRUD + helpers for Band geography (country/state/city/area hierarchy)."""

from sqlalchemy.orm import Session

from app.models.band_models import BandArea, BandCity, BandCountry, BandState


# ── Countries ──────────────────────────────────────────────────────────────────

def list_countries(db: Session):
    return db.query(BandCountry).order_by(BandCountry.name.asc()).all()


def create_country(db: Session, name: str, code: str) -> BandCountry:
    existing = db.query(BandCountry).filter(
        (BandCountry.code.ilike(code)) | (BandCountry.name.ilike(name))
    ).first()
    if existing:
        return existing
    country = BandCountry(name=name, code=code)
    db.add(country)
    db.commit()
    db.refresh(country)
    return country


# ── States ────────────────────────────────────────────────────────────────────

def list_states(db: Session, country_id: int):
    return db.query(BandState).filter(BandState.country_id == country_id).order_by(BandState.name.asc()).all()


def create_state(db: Session, name: str, country_id: int) -> BandState:
    country = db.query(BandCountry).filter(BandCountry.id == country_id).first()
    if not country:
        raise ValueError("Country not found")
    state = BandState(name=name, country_id=country_id)
    db.add(state)
    db.commit()
    db.refresh(state)
    return state


# ── Cities ────────────────────────────────────────────────────────────────────

def list_cities(db: Session, state_id: int):
    return db.query(BandCity).filter(BandCity.state_id == state_id).order_by(BandCity.name.asc()).all()


def create_city(db: Session, name: str, state_id: int) -> BandCity:
    state = db.query(BandState).filter(BandState.id == state_id).first()
    if not state:
        raise ValueError("State not found")
    city = BandCity(name=name, state_id=state_id)
    db.add(city)
    db.commit()
    db.refresh(city)
    return city


# ── Areas ─────────────────────────────────────────────────────────────────────

def list_areas(db: Session, search: str | None = None, city_id: int | None = None, limit: int = 100, offset: int = 0):
    q = db.query(BandArea)
    if city_id:
        q = q.filter(BandArea.city_id == city_id)
    if search:
        like = f"%{search.lower()}%"
        q = q.filter(BandArea.name.ilike(like) | BandArea.pincode.ilike(like))
    total = q.count()
    items = q.order_by(BandArea.name.asc()).offset(offset).limit(limit).all()
    return items, total


def get_area(db: Session, area_id: int) -> BandArea | None:
    return db.query(BandArea).filter(BandArea.id == area_id).first()


def create_area(db: Session, name: str, pincode: str, city_id: int, latitude: float | None = None,
                longitude: float | None = None, service_radius: float = 50.0) -> BandArea:
    city = db.query(BandCity).filter(BandCity.id == city_id).first()
    if not city:
        raise ValueError("City not found")
    existing = db.query(BandArea).filter(
        BandArea.name.ilike(name), BandArea.pincode == pincode, BandArea.city_id == city_id
    ).first()
    if existing:
        return existing
    area = BandArea(name=name, pincode=pincode, city_id=city_id, latitude=latitude,
                    longitude=longitude, service_radius=service_radius)
    db.add(area)
    db.commit()
    db.refresh(area)
    return area


def update_area(db: Session, area: BandArea, data: dict) -> BandArea:
    for k, v in data.items():
        setattr(area, k, v)
    db.commit()
    db.refresh(area)
    return area


def soft_delete_area(db: Session, area: BandArea) -> None:
    db.delete(area)
    db.commit()
