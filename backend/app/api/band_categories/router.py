"""Band category router — unified taxonomy for genres, languages, event types, etc."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import band_schemas as schemas
from app.api.band_common.deps import require_band_admin
from app.api.band_categories import crud

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
    items, total = crud.list_categories(db, search, type, is_active, limit, offset)
    return {"items": items, "total": total}


@router.post("/band/categories", response_model=schemas.BandCategoryResponse, status_code=status.HTTP_201_CREATED, tags=["Band Categories"])
def create_category(
    payload: schemas.BandCategoryCreate,
    db: Session = Depends(get_db),
    _admin=Depends(require_band_admin),
):
    return crud.create_category(db, payload.name, payload.type, payload.description, payload.is_active)


@router.put("/band/categories/{category_id}", response_model=schemas.BandCategoryResponse, tags=["Band Categories"])
def update_category(
    category_id: int,
    payload: schemas.BandCategoryUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(require_band_admin),
):
    cat = crud.get_category(db, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    data = payload.model_dump(exclude_unset=True)
    if "name" in data and data["name"]:
        conflict = (
            db.query(crud.BandCategory)
            .filter(crud.BandCategory.name.ilike(data["name"]))
            .filter(crud.BandCategory.type == cat.type)
            .filter(crud.BandCategory.id != category_id)
            .first()
        )
        if conflict:
            raise HTTPException(status_code=409, detail="Category name already exists for this type")
    return crud.update_category(db, cat, data)


@router.delete("/band/categories/{category_id}", tags=["Band Categories"])
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_band_admin),
):
    cat = crud.get_category(db, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    crud.soft_delete_category(db, cat)
    return {"message": "Category deactivated"}
