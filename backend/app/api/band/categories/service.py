"""
Service layer for Band categories.
"""
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from app.api.band.categories import crud
from app.models.band_schemas import BandCategoryCreate, BandCategoryResponse, BandPaginatedCategoryList


def list_categories(
    db: Session,
    type_: Optional[str] = None,
    is_active: Optional[bool] = True,
    skip: int = 0,
    limit: int = 100,
) -> BandPaginatedCategoryList:
    items = crud.get_categories(db, type_=type_, is_active=is_active, skip=skip, limit=limit)
    total = crud.count_categories(db, type_=type_, is_active=is_active)
    return BandPaginatedCategoryList(
        items=[BandCategoryResponse.model_validate(item) for item in items],
        total=total,
    )


def get_taxonomy_map(db: Session) -> Dict[str, List[str]]:
    """Returns grouped taxonomy terms for discovery filters (genres, languages, venue_categories)."""
    all_categories = crud.get_categories(db, is_active=True, skip=0, limit=500)
    taxonomy: Dict[str, List[str]] = {}
    for cat in all_categories:
        taxonomy.setdefault(cat.type, []).append(cat.name)
    return taxonomy
