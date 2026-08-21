"""
FastAPI Router for Band Venues Discovery & Profiles.
"""
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.band_models import BandAccount
from app.api.band.common.deps import get_band_account
from app.api.band.venues import service

router = APIRouter(prefix="/band/venues", tags=["Band Venues"])


@router.get("/me", summary="Get authenticated venue host profile")
def get_my_venue_profile(
    db: Session = Depends(get_db),
    account: BandAccount = Depends(get_band_account),
):
    return service.get_my_venue_profile(db, account)


@router.put("/me", summary="Update authenticated venue host profile")
def update_my_venue_profile(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    account: BandAccount = Depends(get_band_account),
):
    return service.update_my_venue_profile(db, account, payload)


@router.get("/me/media", summary="Get authenticated venue media gallery")
def get_my_venue_media(
    db: Session = Depends(get_db),
    account: BandAccount = Depends(get_band_account),
):
    prof = service.get_my_venue_profile(db, account)
    return {
        "gallery": prof.get("gallery", []),
        "cover_image": prof.get("cover_image"),
        "youtube_links": prof.get("metadata_fields", {}).get("youtube_links", []),
        "virtual_tour": prof.get("metadata_fields", {}).get("virtual_tour")
    }


@router.put("/me/media", summary="Update authenticated venue media gallery")
def update_my_venue_media(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    account: BandAccount = Depends(get_band_account),
):
    return service.update_my_venue_media(db, account, payload)


@router.get("/me/facilities", summary="Get authenticated venue facilities")
def get_my_venue_facilities(
    db: Session = Depends(get_db),
    account: BandAccount = Depends(get_band_account),
):
    prof = service.get_my_venue_profile(db, account)
    return {"facilities": prof.get("facilities", [])}


@router.put("/me/facilities", summary="Update authenticated venue facilities")
def update_my_venue_facilities(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    account: BandAccount = Depends(get_band_account),
):
    return service.update_my_venue_facilities(db, account, payload)


@router.get("/me/pricing", summary="Get authenticated venue pricing details")
def get_my_venue_pricing(
    db: Session = Depends(get_db),
    account: BandAccount = Depends(get_band_account),
):
    prof = service.get_my_venue_profile(db, account)
    return prof.get("pricing_details", {})


@router.put("/me/pricing", summary="Update authenticated venue pricing details")
def update_my_venue_pricing(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    account: BandAccount = Depends(get_band_account),
):
    return service.update_my_venue_pricing(db, account, payload)


@router.get("/me/availability", summary="Get authenticated venue availability rules")
def get_my_venue_availability(
    db: Session = Depends(get_db),
    account: BandAccount = Depends(get_band_account),
):
    return service.get_my_venue_availability(db, account)


@router.put("/me/availability", summary="Update authenticated venue availability rules")
def update_my_venue_availability(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    account: BandAccount = Depends(get_band_account),
):
    return service.update_my_venue_availability(db, account, payload)


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
