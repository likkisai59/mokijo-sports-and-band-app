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
    """Retrieve all conversations accessible by a specific user account with rich partner metadata."""
    from app.models.band_models import BandArtistProfile, BandVenue, BandAccount

    account = db.query(BandAccount).filter(BandAccount.id == account_id).first()
    user_role = account.role if account else "client"

    artist_profile = db.query(BandArtistProfile).filter(BandArtistProfile.account_id == account_id).first()
    artist_id = artist_profile.id if artist_profile else None

    venue_profile = db.query(BandVenue).filter(BandVenue.account_id == account_id).first()
    venue_id = venue_profile.id if venue_profile else None

    conditions = [BandConversation.client_id == account_id]
    if artist_id:
        conditions.append(BandConversation.artist_profile_id == artist_id)
    if venue_id:
        conditions.append(BandConversation.venue_id == venue_id)

    convs = (
        db.query(BandConversation)
        .filter(or_(*conditions))
        .order_by(desc(BandConversation.last_message_at), desc(BandConversation.id))
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

        # Partner and context resolution
        partner_name = "User"
        partner_role = "Client"
        if user_role == "artist":
            if booking and booking.client:
                partner_name = booking.client.name or booking.client.email
                partner_role = "Client"
        else:
            if booking and booking.artist:
                partner_name = booking.artist.display_name or booking.artist.name
                partner_role = "Artist"
            elif booking and booking.venue:
                partner_name = booking.venue.name
                partner_role = "Venue"

        results.append({
            "id": c.id,
            "booking_id": c.booking_id,
            "event_name": booking.event_name if booking else "Booking Discussion",
            "event_date": booking.event_date.isoformat() if (booking and booking.event_date) else None,
            "booking_status": booking.status if booking else "accepted",
            "partner_name": partner_name,
            "partner_role": partner_role,
            "last_message": last_msg.content if last_msg else "Booking accepted. You can now chat directly.",
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
