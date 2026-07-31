"""Band category router — unified taxonomy for genres, languages, event types, etc."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import band_schemas as schemas
from app.api.band.common.deps import require_band_admin
from app.api.band.categories import service

router = APIRouter()


@router.get("/band/categories", response_model=schemas.BandPaginatedCategoryList, tags=["Band Categories"])
def list_categories(
    search: str | None = None,
    type: str | None = None,
    is_active: bool | None = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    return service.list_categories(db, search, type, is_active, limit, offset)


@router.post("/band/categories", response_model=schemas.BandCategoryResponse, status_code=status.HTTP_201_CREATED, tags=["Band Categories"])
def create_category(
    payload: schemas.BandCategoryCreate,
    db: Session = Depends(get_db),
    _admin=Depends(require_band_admin),
):
    return service.create_category(db, payload)


@router.put("/band/categories/{category_id}", response_model=schemas.BandCategoryResponse, tags=["Band Categories"])
def update_category(
    category_id: int,
    payload: schemas.BandCategoryUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(require_band_admin),
):
    return service.update_category(db, category_id, payload)


@router.delete("/band/categories/{category_id}", tags=["Band Categories"])
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_band_admin),
):
    return service.delete_category(db, category_id)
