from fastapi import APIRouter, Depends, Request
from typing import List, Optional

from app.models import schemas
from app.api.mokijo.messages import service
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.auth.authorization import check_user_authorization

router = APIRouter()

@router.post("/messages", response_model=schemas.MessageResponse, summary="Send a new message to a group/team chat or as a direct message (DM).", tags=["Messages"])
async def send_message(
    request: Request,
    message: schemas.MessageCreate,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.send_message(request, db, message, current_user)

@router.get("/messages/group/{group_id}", response_model=List[schemas.MessageResponse], summary="Retrieve chat history transcripts for a group/team chat channel.", tags=["Messages"])
async def get_group_messages(
    request: Request,
    group_id: int,
    channel: Optional[str] = "general",
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_group_messages(request, db, group_id, channel, current_user)

@router.get("/messages/dm/{recipient_id}", response_model=List[schemas.MessageResponse], summary="Retrieve 1-on-1 chat history between two participants.", tags=["Messages"])
async def get_direct_messages(
    request: Request,
    recipient_id: int,
    recipient_type: str,
    sender_id: int,
    sender_type: str,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_direct_messages(request, db, recipient_id, recipient_type, sender_id, sender_type, current_user)

@router.get("/messages/partners", summary="Retrieve potential chat partners (admins and members) for a club.", tags=["Messages"])
async def get_chat_partners(
    request: Request,
    club_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_chat_partners(request, db, club_id, current_user)
