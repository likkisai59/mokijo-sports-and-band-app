from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from datetime import datetime

from app.models.band_models import BandConversation, BandMessage, BandBooking, BandAccount


def get_or_create_conversation(
    db: Session,
    booking_id: int,
    client_id: int,
    artist_profile_id: Optional[int] = None,
    venue_id: Optional[int] = None,
) -> BandConversation:
    """Find existing booking conversation or instantiate a new one."""
    conv = db.query(BandConversation).filter(BandConversation.booking_id == booking_id).first()
    if not conv:
        conv = BandConversation(
            booking_id=booking_id,
            client_id=client_id,
            artist_profile_id=artist_profile_id,
            venue_id=venue_id,
            status="ACTIVE",
            created_at=datetime.utcnow(),
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
    return conv


def get_conversation_by_id(db: Session, conversation_id: int) -> Optional[BandConversation]:
    return db.query(BandConversation).filter(BandConversation.id == conversation_id).first()


def get_user_conversations(db: Session, account_id: int) -> List[Dict[str, Any]]:
    """Retrieve all conversations accessible by a specific user account."""
    convs = (
        db.query(BandConversation)
        .filter(
            or_(
                BandConversation.client_id == account_id,
                BandConversation.booking.has(BandBooking.artist_profile_id == account_id),
                BandConversation.booking.has(BandBooking.venue_id == account_id),
            )
        )
        .order_by(desc(BandConversation.last_message_at))
        .all()
    )

    results = []
    for c in convs:
        last_msg = (
            db.query(BandMessage)
            .filter(BandMessage.conversation_id == c.id)
            .order_by(desc(BandMessage.created_at))
            .first()
        )
        booking = db.query(BandBooking).filter(BandBooking.id == c.booking_id).first()
        results.append({
            "id": c.id,
            "booking_id": c.booking_id,
            "booking_status": booking.status if booking else "CONFIRMED",
            "last_message": last_msg.content if last_msg else "Booking inquiry opened.",
            "last_message_at": c.last_message_at.isoformat() if c.last_message_at else c.created_at.isoformat(),
            "status": c.status,
        })
    return results


def get_messages(db: Session, conversation_id: int) -> List[BandMessage]:
    return (
        db.query(BandMessage)
        .filter(BandMessage.conversation_id == conversation_id)
        .order_by(BandMessage.created_at.asc())
        .all()
    )


def create_message(
    db: Session,
    conversation_id: int,
    sender_id: int,
    content: str,
    attachment_url: Optional[str] = None,
    offer_amount: Optional[float] = None,
    offer_status: Optional[str] = None,
) -> BandMessage:
    msg = BandMessage(
        conversation_id=conversation_id,
        sender_id=sender_id,
        content=content,
        attachment_url=attachment_url,
        offer_amount=offer_amount,
        offer_status=offer_status or ("pending" if offer_amount else None),
        created_at=datetime.utcnow(),
    )
    db.add(msg)

    # Update conversation last message timestamp
    conv = db.query(BandConversation).filter(BandConversation.id == conversation_id).first()
    if conv:
        conv.last_message_at = datetime.utcnow()

    db.commit()
    db.refresh(msg)
    return msg


def respond_to_offer(db: Session, message_id: int, offer_status: str) -> Optional[BandMessage]:
    msg = db.query(BandMessage).filter(BandMessage.id == message_id).first()
    if not msg or not msg.offer_amount:
        return None
    msg.offer_status = offer_status
    db.commit()
    db.refresh(msg)
    return msg
