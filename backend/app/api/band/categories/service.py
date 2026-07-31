from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models import band_schemas as schemas
from app.api.band.categories import crud
from app.models.band_models import BandCategory

def list_categories(
    db: Session,
    search: str | None = None,
    type: str | None = None,
    is_active: bool | None = None,
    limit: int = 100,
    offset: int = 0,
):
    items, total = crud.list_categories(db, search, type, is_active, limit, offset)
    return {"items": items, "total": total}

def create_category(
    db: Session,
    payload: schemas.BandCategoryCreate,
):
    return crud.create_category(db, payload.name, payload.type, payload.description, payload.is_active)

def update_category(
    db: Session,
    category_id: int,
    payload: schemas.BandCategoryUpdate,
):
    cat = crud.get_category(db, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    data = payload.model_dump(exclude_unset=True)
    if "name" in data and data["name"]:
        conflict = (
            db.query(BandCategory)
            .filter(BandCategory.name.ilike(data["name"]))
            .filter(BandCategory.type == cat.type)
            .filter(BandCategory.id != category_id)
            .first()
        )
        if conflict:
            raise HTTPException(status_code=409, detail="Category name already exists for this type")
    return crud.update_category(db, cat, data)

def delete_category(
    db: Session,
    category_id: int,
):
    cat = crud.get_category(db, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    crud.soft_delete_category(db, cat)
    return {"message": "Category deactivated"}
