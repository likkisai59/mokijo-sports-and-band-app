from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.features.bookings.models import Booking
from app.features.messaging.conversation.models import Conversation
from app.features.messaging.conversation.repository import conversation_repository

class ConversationService:
    def create_conversation(self, db: Session, booking_id: UUID, current_user_id: UUID) -> Conversation:
        booking = (
            db.query(Booking)
            .filter(Booking.id == booking_id, Booking.deleted_at.is_(None))
            .first()
        )
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )

        client_id = booking.client_id
        
        if not booking.artist_profile or not booking.artist_profile.user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Booking does not have an associated performer user account"
            )
        band_id = booking.artist_profile.user_id
        venue_owner_id = booking.venue.user_id if booking.venue else None

        # Participant Authorization Check
        participants = [client_id, band_id]
        if venue_owner_id:
            participants.append(venue_owner_id)

        if current_user_id not in participants:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a participant in this booking"
            )

        # Duplicate Prevention
        existing = conversation_repository.get_by_booking_id(db, booking_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Conversation already exists for this booking"
            )

        conversation = Conversation(
            booking_id=booking_id,
            client_id=client_id,
            band_id=band_id,
            venue_owner_id=venue_owner_id,
            status="ACTIVE",
            last_message_at=None
        )
        return conversation_repository.create(db, conversation)

    def get_conversation(self, db: Session, conversation_id: UUID, current_user_id: UUID) -> Conversation:
        conversation = conversation_repository.get_by_id(db, conversation_id)
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )

        participants = [conversation.client_id, conversation.band_id]
        if conversation.venue_owner_id:
            participants.append(conversation.venue_owner_id)

        if current_user_id not in participants:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this conversation"
            )

        return conversation

    def list_user_conversations(self, db: Session, user_id: UUID) -> list[Conversation]:
        return conversation_repository.list_by_user_id(db, user_id)

conversation_service = ConversationService()
