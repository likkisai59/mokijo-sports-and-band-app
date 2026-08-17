from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.api.band.messaging import crud
from app.models.band_models import BandConversation, BandMessage, BandBooking


class MessagingService:
    @staticmethod
    def get_or_start_chat(
        db: Session,
        booking_id: int,
        client_id: int,
        artist_profile_id: Optional[int] = None,
        venue_id: Optional[int] = None,
    ) -> BandConversation:
        return crud.get_or_create_conversation(
            db=db,
            booking_id=booking_id,
            client_id=client_id,
            artist_profile_id=artist_profile_id,
            venue_id=venue_id,
        )

    @staticmethod
    def list_user_inbox(db: Session, account_id: int) -> List[Dict[str, Any]]:
        return crud.get_user_conversations(db=db, account_id=account_id)

    @staticmethod
    def fetch_thread(db: Session, conversation_id: int) -> List[Dict[str, Any]]:
        conv = crud.get_conversation_by_id(db, conversation_id)
        if not conv:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation thread not found.",
            )
        messages = crud.get_messages(db, conversation_id)
        return [
            {
                "id": m.id,
                "conversation_id": m.conversation_id,
                "sender_id": m.sender_id,
                "content": m.content,
                "attachment_url": m.attachment_url,
                "offer_amount": m.offer_amount,
                "offer_status": m.offer_status,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in messages
        ]

    @staticmethod
    def post_message(
        db: Session,
        conversation_id: int,
        sender_id: int,
        content: str,
        attachment_url: Optional[str] = None,
        offer_amount: Optional[float] = None,
    ) -> Dict[str, Any]:
        conv = crud.get_conversation_by_id(db, conversation_id)
        if not conv:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation does not exist.",
            )

        msg = crud.create_message(
            db=db,
            conversation_id=conversation_id,
            sender_id=sender_id,
            content=content,
            attachment_url=attachment_url,
            offer_amount=offer_amount,
        )
        return {
            "id": msg.id,
            "conversation_id": msg.conversation_id,
            "sender_id": msg.sender_id,
            "content": msg.content,
            "attachment_url": msg.attachment_url,
            "offer_amount": msg.offer_amount,
            "offer_status": msg.offer_status,
            "created_at": msg.created_at.isoformat() if msg.created_at else None,
        }

    @staticmethod
    def answer_offer(
        db: Session, message_id: int, decision: str
    ) -> Dict[str, Any]:
        if decision not in ("accepted", "declined"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Decision must be 'accepted' or 'declined'.",
            )
        msg = crud.respond_to_offer(db, message_id, decision)
        if not msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Custom offer message not found.",
            )

        # If offer accepted, update booking total_price
        if decision == "accepted":
            conv = crud.get_conversation_by_id(db, msg.conversation_id)
            if conv and conv.booking_id:
                booking = db.query(BandBooking).filter(BandBooking.id == conv.booking_id).first()
                if booking:
                    booking.total_price = msg.offer_amount
                    booking.advance_amount = round(msg.offer_amount * 0.20, 2)
                    booking.remaining_amount = round(msg.offer_amount * 0.80, 2)
                    db.commit()

        return {
            "id": msg.id,
            "offer_amount": msg.offer_amount,
            "offer_status": msg.offer_status,
            "message": f"Offer has been successfully {decision}.",
        }
