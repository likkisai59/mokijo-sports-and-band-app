from fastapi import APIRouter, Depends, Request, Header
from sqlalchemy.orm import Session
from typing import List, Optional

from app.models import schemas
from app.api.mokijo.activities import service
from app.auth.authorization import check_user_authorization
from app.core.database import get_db

router = APIRouter()

@router.post("/activities", response_model=schemas.ActivityResponse, summary="Create a new sports activity and auto-rsvp the creator as confirmed.", tags=["Activities"])
async def create_activity(
    request: Request,
    activity: schemas.ActivityCreate,
    x_is_member: Optional[str] = Header(None),
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.create_activity(request, db, activity, x_is_member, current_user)

@router.get("/activities", response_model=List[schemas.ActivityResponse], summary="Discover sports activities filtered by sport and location.", tags=["Activities"])
async def get_activities(
    request: Request,
    sport: Optional[str] = None,
    location: Optional[str] = None,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_activities(request, db, sport, location, current_user)

@router.post("/activities/{activity_id}/rsvp", response_model=schemas.ActivityRSVPResponse, summary="Join a sports game activity. Places user in waitlist if player limits are exceeded.", tags=["Activities"])
async def rsvp_activity(
    request: Request,
    activity_id: int,
    rsvp_data: schemas.ActivityRSVPCreate,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.rsvp_activity(request, db, activity_id, rsvp_data, current_user)

@router.post("/activities/{activity_id}/cancel-rsvp", summary="Cancel a player's RSVP. Auto-promotes the next waitlisted player if a confirmed player leaves.", tags=["Activities"])
async def cancel_rsvp(
    request: Request,
    activity_id: int,
    user_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.cancel_rsvp(request, db, activity_id, user_id, current_user)

@router.put("/activities/{activity_id}", response_model=schemas.ActivityResponse, summary="Reschedule or update details of a sports activity. Restricted to club admins only.", tags=["Activities"])
async def update_activity(
    request: Request,
    activity_id: int,
    activity_update: schemas.ActivityUpdate,
    x_is_member: Optional[str] = Header(None),
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.update_activity(request, db, activity_id, activity_update, x_is_member, current_user)

@router.post("/activities/{activity_id}/cancel", summary="Cancel a sports activity. Restricted to club admins only.", tags=["Activities"])
async def cancel_activity(
    request: Request,
    activity_id: int,
    x_is_member: Optional[str] = Header(None),
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.cancel_activity(request, db, activity_id, x_is_member, current_user)
