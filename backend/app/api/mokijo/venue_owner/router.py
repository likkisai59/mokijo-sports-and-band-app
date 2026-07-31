from fastapi import APIRouter, Depends, Request
from typing import List

from app.models import schemas
from app.api.mokijo.venue_owner import service
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.auth.authorization import check_user_authorization

router = APIRouter()

@router.post("/venue-owner/register", summary="Register a new venue owner along with their venue(s).", tags=["Venue Owner"])
async def register_venue_owner(
    request: Request,
    payload: schemas.VenueOwnerRegister
,
    db: Session = Depends(get_db)
):
    return await service.register_venue_owner(request, db, payload)

@router.post("/venue-owner/login", summary="Authenticate a venue owner.", tags=["Venue Owner"])
async def login_venue_owner(
    request: Request,
    credentials: schemas.VenueOwnerLogin
,
    db: Session = Depends(get_db)
):
    return await service.login_venue_owner(request, db, credentials)

@router.get("/venue-owner/{owner_id}/venues", summary="Get all venues registered by a specific venue owner.", tags=["Venue Owner"])
async def get_owner_venues(
    request: Request,
    owner_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_owner_venues(request, db, owner_id, current_user)

@router.put("/venues/{venue_id}", summary="Update venue details. Requires owner_id for authorization.", tags=["Venue Owner"])
async def update_venue(
    request: Request,
    venue_id: int,
    data: schemas.VenueInput,
    owner_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.update_venue(request, db, venue_id, data, owner_id, current_user)

@router.get("/bookings/venue-owner/{owner_id}", summary="Get all bookings across all venues owned by this venue owner.", tags=["Venue Owner"])
async def get_bookings_for_venue_owner(
    request: Request,
    owner_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_bookings_for_venue_owner(request, db, owner_id, current_user)
