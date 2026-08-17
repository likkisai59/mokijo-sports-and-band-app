"""
FastAPI Router for Band Artists Discovery & Profiles.
"""
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.band.artists import service

router = APIRouter(prefix="/band/artists", tags=["Band Artists"])


@router.get("", summary="Browse & search verified musical artists and bands")
def get_artists(
    q: Optional[str] = Query(None, description="Search by artist name, bio, or username"),
    genre: Optional[str] = Query(None, description="Filter by music genre"),
    language: Optional[str] = Query(None, description="Filter by performance language"),
    band_type: Optional[str] = Query(None, description="Filter by Solo | Duo | Band"),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    min_rating: Optional[float] = Query(None, ge=0, le=5),
    sort: str = Query("rating_desc", description="rating_desc | price_asc | price_desc"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return service.list_artists(
        db,
        query=q,
        genre=genre,
        language=language,
        band_type=band_type,
        min_price=min_price,
        max_price=max_price,
        min_rating=min_rating,
        sort_by=sort,
        skip=skip,
        limit=limit,
    )


@router.get("/{identifier}", summary="Get detailed artist profile by ID or public username")
def get_artist_detail(identifier: str, db: Session = Depends(get_db)):
    artist = service.get_artist_detail(db, identifier)
    if not artist:
        raise HTTPException(status_code=404, detail="Artist profile not found")
    return artist
