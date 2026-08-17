"""
FastAPI Router for Band Venues Discovery & Profiles.
"""
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.band.venues import service

router = APIRouter(prefix="/band/venues", tags=["Band Venues"])


@router.get("", summary="Browse & search verified performance venues")
def get_venues(
    q: Optional[str] = Query(None, description="Search by venue name, description, address"),
    city: Optional[str] = Query(None, description="Filter by city name"),
    venue_type: Optional[str] = Query(None, description="Filter by venue type"),
    min_capacity: Optional[int] = Query(None, ge=0),
    max_capacity: Optional[int] = Query(None, ge=0),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    sort: str = Query("recommended", description="recommended | price_asc | price_desc | capacity_desc"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return service.list_venues(
        db,
        query=q,
        city=city,
        venue_type=venue_type,
        min_capacity=min_capacity,
        max_capacity=max_capacity,
        min_price=min_price,
        max_price=max_price,
        sort_by=sort,
        skip=skip,
        limit=limit,
    )


@router.get("/{identifier}", summary="Get detailed venue profile by ID or BCV venue code")
def get_venue_detail(identifier: str, db: Session = Depends(get_db)):
    venue = service.get_venue_detail(db, identifier)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    return venue
