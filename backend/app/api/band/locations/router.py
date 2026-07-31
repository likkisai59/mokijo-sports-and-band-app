"""Band location router — hierarchical geography (read public, write admin)."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import band_schemas as schemas
from app.api.band.common.deps import require_band_admin
from app.api.band.locations import service

router = APIRouter()

# ── Countries ─────────────────────────────────────────────────────────────────

@router.get("/band/locations/countries", response_model=list[schemas.BandCountryResponse], tags=["Band Locations"])
def get_countries(db: Session = Depends(get_db)):
    return service.get_countries(db)

@router.post("/band/locations/countries", response_model=schemas.BandCountryResponse, status_code=status.HTTP_201_CREATED, tags=["Band Locations"])
def post_country(payload: schemas.BandCountryCreate, db: Session = Depends(get_db), _admin=Depends(require_band_admin)):
    return service.create_country(db, payload)

# ── States ────────────────────────────────────────────────────────────────────

@router.get("/band/locations/states", response_model=list[schemas.BandStateResponse], tags=["Band Locations"])
def get_states(country_id: int = Query(...), db: Session = Depends(get_db)):
    return service.get_states(db, country_id)

@router.post("/band/locations/states", response_model=schemas.BandStateResponse, status_code=status.HTTP_201_CREATED, tags=["Band Locations"])
def post_state(payload: schemas.BandStateCreate, db: Session = Depends(get_db), _admin=Depends(require_band_admin)):
    return service.create_state(db, payload)

# ── Cities ────────────────────────────────────────────────────────────────────

@router.get("/band/locations/cities", response_model=list[schemas.BandCityResponse], tags=["Band Locations"])
def get_cities(state_id: int = Query(...), db: Session = Depends(get_db)):
    return service.get_cities(db, state_id)

@router.post("/band/locations/cities", response_model=schemas.BandCityResponse, status_code=status.HTTP_201_CREATED, tags=["Band Locations"])
def post_city(payload: schemas.BandCityCreate, db: Session = Depends(get_db), _admin=Depends(require_band_admin)):
    return service.create_city(db, payload)

# ── Areas ─────────────────────────────────────────────────────────────────────

@router.get("/band/locations/areas", response_model=schemas.BandPaginatedAreaList, tags=["Band Locations"])
def get_areas(search: str | None = None, city_id: int | None = None,
              limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0),
              db: Session = Depends(get_db)):
    return service.get_areas(db, search, city_id, limit, offset)

@router.post("/band/locations/areas", response_model=schemas.BandAreaResponse, status_code=status.HTTP_201_CREATED, tags=["Band Locations"])
def post_area(payload: schemas.BandAreaCreate, db: Session = Depends(get_db), _admin=Depends(require_band_admin)):
    return service.create_area(db, payload)

@router.put("/band/locations/areas/{area_id}", response_model=schemas.BandAreaResponse, tags=["Band Locations"])
def put_area(area_id: int, payload: schemas.BandAreaUpdate, db: Session = Depends(get_db), _admin=Depends(require_band_admin)):
    return service.update_area(db, area_id, payload)

@router.delete("/band/locations/areas/{area_id}", tags=["Band Locations"])
def delete_area(area_id: int, db: Session = Depends(get_db), _admin=Depends(require_band_admin)):
    return service.delete_area(db, area_id)
