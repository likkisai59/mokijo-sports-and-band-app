from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models import band_schemas as schemas
from app.api.band.locations import crud

# ── Countries ─────────────────────────────────────────────────────────────────

def get_countries(db: Session):
    return crud.list_countries(db)

def create_country(db: Session, payload: schemas.BandCountryCreate):
    return crud.create_country(db, payload.name, payload.code)

# ── States ────────────────────────────────────────────────────────────────────

def get_states(db: Session, country_id: int):
    return crud.list_states(db, country_id)

def create_state(db: Session, payload: schemas.BandStateCreate):
    try:
        return crud.create_state(db, payload.name, payload.country_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ── Cities ────────────────────────────────────────────────────────────────────

def get_cities(db: Session, state_id: int):
    return crud.list_cities(db, state_id)

def create_city(db: Session, payload: schemas.BandCityCreate):
    try:
        return crud.create_city(db, payload.name, payload.state_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ── Areas ─────────────────────────────────────────────────────────────────────

def get_areas(db: Session, search: str | None = None, city_id: int | None = None, limit: int = 100, offset: int = 0):
    items, total = crud.list_areas(db, search, city_id, limit, offset)
    return {"items": items, "total": total}

def create_area(db: Session, payload: schemas.BandAreaCreate):
    try:
        return crud.create_area(db, payload.name, payload.pincode, payload.city_id,
                                payload.latitude, payload.longitude, payload.service_radius)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

def update_area(db: Session, area_id: int, payload: schemas.BandAreaUpdate):
    area = crud.get_area(db, area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")
    return crud.update_area(db, area, payload.model_dump(exclude_unset=True))

def delete_area(db: Session, area_id: int):
    area = crud.get_area(db, area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")
    crud.soft_delete_area(db, area)
    return {"message": "Area deleted"}
