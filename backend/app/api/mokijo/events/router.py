from fastapi import APIRouter, Depends, Request, Query
from typing import List, Optional

from app.models import schemas
from app.api.mokijo.events import service
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.auth.authorization import check_user_authorization

# Request Models are kept in service or imported, wait, let's keep them in service or here.
# They were in events.py. I'll import them from service.py.
from app.api.mokijo.events.service import (
    EventInviteRequest,
    EventResponseRequest,
    GuestRegisterRequest,
    AttendanceMarkRequest,
    MessageParticipantsRequest
)

router = APIRouter()

@router.post("/groups/{group_id}/events", response_model=schemas.EventResponse, summary="Create a new event within a specific group/team with optional fees, documents, and rules.", tags=["Events"])
async def create_event(
    request: Request,
    group_id: int,
    owner_id: int,
    event: schemas.EventCreate,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.create_event(request, db, group_id, owner_id, event, current_user)

@router.get("/groups/{group_id}/events", summary="Retrieve all events associated with a specific group/team.", tags=["Events"])
async def get_group_events(
    request: Request,
    group_id: str,
    owner_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_group_events(request, db, group_id, owner_id, current_user)

@router.get("/events", summary="Retrieve all events owned by the club administrator or their groups, optionally filtered by member email.", tags=["Events"])
async def get_all_events(
    request: Request,
    owner_id: int,
    member_email: Optional[str] = None,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_all_events(request, db, owner_id, member_email, current_user)

@router.get("/events/{event_id}", summary="Retrieve details of a specific event.", tags=["Events"])
async def get_event(
    request: Request,
    event_id: int,
    owner_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_event(request, db, event_id, owner_id, current_user)

@router.put("/events/{event_id}", response_model=schemas.EventResponse, summary="Update details of an existing event.", tags=["Events"])
async def update_event(
    request: Request,
    event_id: int,
    owner_id: int,
    event_update: schemas.EventUpdate,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.update_event(request, db, event_id, owner_id, event_update, current_user)

@router.delete("/events/{event_id}", summary="Delete an existing event from the system.", tags=["Events"])
async def delete_event(
    request: Request,
    event_id: int,
    owner_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.delete_event(request, db, event_id, owner_id, current_user)

@router.post("/events/{event_id}/invite", summary="Invite members, coaches, parents, or groups to an event, creating pending registrations.", tags=["Events"])
async def invite_to_event(
    request: Request,
    event_id: int,
    req: EventInviteRequest,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.invite_to_event(request, db, event_id, req, current_user)

@router.post("/events/{event_id}/respond", summary="Submit a participant's response (accepted, declined, maybe) to an event invitation.", tags=["Events"])
async def respond_to_event(
    request: Request,
    event_id: int,
    req: EventResponseRequest,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.respond_to_event(request, db, event_id, req, current_user)

@router.post("/events/{event_id}/register-guest", summary="Register a guest participant for an event with capacity checks.", tags=["Events"])
async def register_guest_to_event(
    request: Request,
    event_id: int,
    req: GuestRegisterRequest,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.register_guest_to_event(request, db, event_id, req, current_user)

@router.post("/events/{event_id}/attendance", summary="Mark event attendance (present, absent, late, not_marked) for a registration.", tags=["Events"])
async def mark_attendance(
    request: Request,
    event_id: int,
    req: AttendanceMarkRequest,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.mark_attendance(request, db, event_id, req, current_user)

@router.get("/events/{event_id}/participants", summary="Retrieve list of invited and registered participants for a specific event.", tags=["Events"])
async def get_event_participants(
    request: Request,
    event_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_event_participants(request, db, event_id, current_user)

@router.post("/events/{event_id}/message", summary="Send an email or message to event participants filtered by attendance response status.", tags=["Events"])
async def message_participants(
    request: Request,
    event_id: int,
    req: MessageParticipantsRequest,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.message_participants(request, db, event_id, req, current_user)

@router.post("/events/{event_id}/send-reminder", summary="Send an automatic event reminder email to all accepted and pending participants.", tags=["Events"])
async def send_reminder(
    request: Request,
    event_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.send_reminder(request, db, event_id, current_user)

@router.get("/members/registrations", summary="Retrieve all event registrations for a specific member by their email.", tags=["Events"])
async def get_member_registrations(
    request: Request,
    member_email: Optional[str] = Query(None),
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_member_registrations(request, db, member_email, current_user)
