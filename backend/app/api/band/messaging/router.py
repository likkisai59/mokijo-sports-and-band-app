from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.band.common.deps import get_band_db, get_current_band_account
from app.api.band.messaging.service import MessagingService
from app.models.band_models import BandAccount

router = APIRouter(prefix="/messaging", tags=["Band Messaging"])


class MessageCreateRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    attachment_url: Optional[str] = None
    offer_amount: Optional[float] = None


class OfferRespondRequest(BaseModel):
    decision: str = Field(..., pattern="^(accepted|declined)$")


class StartChatRequest(BaseModel):
    booking_id: int
    artist_profile_id: Optional[int] = None
    venue_id: Optional[int] = None


@router.post("/start")
def start_or_get_chat(
    req: StartChatRequest,
    db: Session = Depends(get_band_db),
    current_user: BandAccount = Depends(get_current_band_account),
):
    """Retrieve or initiate a conversation attached to a specific booking."""
    conv = MessagingService.get_or_start_chat(
        db=db,
        booking_id=req.booking_id,
        client_id=current_user.id,
        artist_profile_id=req.artist_profile_id,
        venue_id=req.venue_id,
    )
    return {
        "success": True,
        "data": {
            "conversation_id": conv.id,
            "booking_id": conv.booking_id,
            "status": conv.status,
        },
    }


@router.get("/conversations")
def list_conversations(
    db: Session = Depends(get_band_db),
    current_user: BandAccount = Depends(get_current_band_account),
):
    """Fetch active chat threads for current authenticated user."""
    threads = MessagingService.list_user_inbox(db=db, account_id=current_user.id)
    return {"success": True, "data": threads}


@router.get("/conversations/{conversation_id}/messages")
def get_thread_messages(
    conversation_id: int,
    db: Session = Depends(get_band_db),
    current_user: BandAccount = Depends(get_current_band_account),
):
    """Fetch chat history for a specific conversation."""
    msgs = MessagingService.fetch_thread(db=db, conversation_id=conversation_id)
    return {"success": True, "data": msgs}


@router.post("/conversations/{conversation_id}/messages")
def send_message(
    conversation_id: int,
    req: MessageCreateRequest,
    db: Session = Depends(get_band_db),
    current_user: BandAccount = Depends(get_current_band_account),
):
    """Post a text message, sound rider attachment, or custom price proposal."""
    msg = MessagingService.post_message(
        db=db,
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=req.content,
        attachment_url=req.attachment_url,
        offer_amount=req.offer_amount,
    )
    return {"success": True, "data": msg}


@router.post("/offers/{message_id}/respond")
def answer_price_offer(
    message_id: int,
    req: OfferRespondRequest,
    db: Session = Depends(get_band_db),
    current_user: BandAccount = Depends(get_current_band_account),
):
    """Accept or decline an in-chat custom counter-offer proposal."""
    res = MessagingService.answer_offer(
        db=db, message_id=message_id, decision=req.decision
    )
    return {"success": True, "data": res}
