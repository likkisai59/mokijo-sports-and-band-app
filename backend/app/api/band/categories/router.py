"""
FastAPI Router for Band Categories taxonomy.
"""
from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.band_schemas import BandCategoryResponse, BandPaginatedCategoryList
from app.api.band.categories import service

router = APIRouter(prefix="/band/categories", tags=["Band Categories"])


@router.get("", response_model=BandPaginatedCategoryList, summary="List categories with optional type filter")
def get_categories(
    type: Optional[str] = Query(None, description="Category type e.g. music_genre, language, event_type"),
    is_active: Optional[bool] = Query(True),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return service.list_categories(db, type_=type, is_active=is_active, skip=skip, limit=limit)


@router.get("/taxonomy", response_model=Dict[str, List[str]], summary="Get grouped taxonomy mapping for discovery filters")
def get_taxonomy(db: Session = Depends(get_db)):
    return service.get_taxonomy_map(db)
