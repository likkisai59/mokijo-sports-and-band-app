import logging
from datetime import datetime, date
from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.core.exceptions import BadRequestException, NotFoundException
from app.features.bookings.models import Booking, BookingAuditLog
from app.features.artists.crud import ArtistProfileCRUD
from app.features.venues.models import Venue

logger = logging.getLogger(__name__)

class BookingWorkflowEngine:
    VALID_TRANSITIONS = {
        "pending": ["accepted", "rejected", "counter_offered", "cancelled"],
        "counter_offered": ["accepted", "rejected", "counter_offered", "cancelled"],
        "accepted": ["confirmed", "cancelled", "completed"],
        "confirmed": ["completed", "cancelled"],
        "under_review": ["pending", "accepted", "rejected", "cancelled"],
        "completed": [],
        "rejected": [],
        "cancelled": [],
    }

    @classmethod
    def transition(
        cls,
        db: Session,
        booking_id: UUID,
        actor_id: str,
        actor_role: str,  # "client", "artist", "venue", "venue_owner", "admin"
        action: str,      # "accept", "reject", "counter", "cancel", "complete", "override", "confirm"
        target_status: str,
        reason: Optional[str] = None,
        counter_price: Optional[float] = None,
    ) -> Booking:
        try:
            # locking row for concurrency protection
            booking = db.query(Booking).filter(Booking.id == booking_id).with_for_update().first()
            if not booking:
                raise NotFoundException("Booking request not found.")

            current_status = booking.status

            # 1. Concurrency Protection & Duplicate checks
            if current_status == target_status:
                raise BadRequestException(f"Booking is already in {target_status} status.")

            # RBAC Check: Ensure actor is client, artist, venue owner or admin
            is_client = str(booking.client_id) == actor_id
            
            # Resolve artist
            artist_crud = ArtistProfileCRUD()
            artist = artist_crud.get_by_user_id(db, actor_id)
            is_artist = artist and booking.artist_profile_id == artist.id

            # Resolve venue
            venue = None
            if booking.venue_id:
                venue = db.query(Venue).filter(Venue.id == booking.venue_id).first()
            is_venue = venue and str(venue.user_id) == actor_id

            is_admin = actor_role == "admin"

            # Explicit role-based checks
            if actor_role == "client" and not is_client:
                raise BadRequestException("Access denied: Clients can only modify their own bookings.")
            if actor_role == "artist" and not is_artist:
                raise BadRequestException("Access denied: Artists can only modify their assigned bookings.")
            if actor_role in ["venue", "venue_owner"] and not is_venue:
                raise BadRequestException("Access denied: Venue Owners can only modify their assigned bookings.")
            if actor_role == "admin" and not is_admin:
                raise BadRequestException("Access denied: Admin role required.")

            # Validate authorization permissions
            if not (is_client or is_artist or is_venue or is_admin):
                raise BadRequestException("Access denied: You are not authorized to perform workflow actions on this booking request.")

            # Hardened Business rules (apply to all, including admin to maintain integrity)
            if current_status == "completed":
                raise BadRequestException("Completed bookings cannot be modified.")
            if current_status == "cancelled":
                raise BadRequestException("Cancelled bookings cannot be modified.")
            if current_status == "rejected" and target_status == "accepted":
                raise BadRequestException("Rejected bookings cannot be accepted.")
            if current_status == "accepted" and target_status == "pending":
                raise BadRequestException("Accepted bookings cannot return to Pending.")

            # State transition validation (unless admin is overriding)
            if not is_admin:
                # Transition matrix validation
                allowed = cls.VALID_TRANSITIONS.get(current_status, [])
                if target_status not in allowed:
                    raise BadRequestException(f"Invalid booking transition: Cannot change status from {current_status} to {target_status}.")

                # Event date validation before confirmation
                if target_status == "confirmed" and booking.event_date < date.today():
                    raise BadRequestException("Cannot confirm a booking for a past event date.")

                # Permitted actions validation based on actor roles
                if action in ["accept", "reject", "counter"] and actor_role == "client" and target_status != "accepted":
                    raise BadRequestException("Access denied: Clients cannot perform this action.")
                
                if action == "complete" and actor_role == "client":
                    raise BadRequestException("Access denied: Clients cannot complete bookings.")

            # Wrap modifications, timeline and audit log in a database transaction
            try:
                with db.begin_nested():
                    # Apply changes
                    booking.status = target_status
                    if counter_price is not None:
                        booking.counter_price = counter_price

                    # Append timeline entry automatically
                    now_str = datetime.utcnow().isoformat()
                    timeline = list(booking.timeline or [])
                    
                    # Dynamic context-based timeline message
                    if action == "accept" and actor_role == "artist":
                        timeline_msg = "Booking request approved by performer! Get ready for the gig."
                    elif action == "reject" and actor_role == "artist":
                        timeline_msg = "Booking request rejected by performer."
                    elif action == "counter" and actor_role == "artist":
                        timeline_msg = f"Counter offer placed by performer: {counter_price}. Note: {reason or 'No message'}"
                    elif action == "cancel":
                        timeline_msg = f"Booking request cancelled. Reason: {reason}" if reason else "Booking request cancelled."
                    elif action == "accept" and actor_role in ["venue", "venue_owner"]:
                        timeline_msg = "Booking request accepted by venue owner!"
                    elif action == "reject" and actor_role in ["venue", "venue_owner"]:
                        timeline_msg = "Booking request rejected by venue owner."
                    elif action == "complete" and actor_role in ["venue", "venue_owner"]:
                        timeline_msg = "Event concluded and booking marked as completed!"
                    elif action == "override" and actor_role == "admin":
                        timeline_msg = f"Status overridden by administrator. Resolution: {reason or 'No message'}"
                    elif action == "confirm":
                        timeline_msg = "Payment verified. Booking confirmed."
                    elif reason:
                        timeline_msg = reason
                    else:
                        timeline_msg = f"Booking status updated to {target_status} via {action} action."

                    timeline.append({
                        "status": target_status,
                        "timestamp": now_str,
                        "by": actor_role,
                        "message": timeline_msg
                    })
                    booking.timeline = timeline

                    # Create Immutable Audit Log entry
                    actor_uuid = None
                    try:
                        actor_uuid = UUID(actor_id)
                    except Exception:
                        actor_uuid = booking.client_id

                    audit = BookingAuditLog(
                        booking_id=booking.id,
                        user_id=actor_uuid,
                        role=actor_role,
                        action=action,
                        previous_status=current_status,
                        new_status=target_status,
                        reason=reason
                    )
                    db.add(audit)
                    db.add(booking)
            except Exception as e:
                logger.error(f"Failed to perform booking transition for booking {booking_id}: {str(e)}")
                raise e

            # Commit database transaction changes
            db.commit()
            db.refresh(booking)

            # Trigger successful workflow notification
            try:
                from app.features.notifications.service import create_booking_notification
                notif_event = target_status
                if action == "accept" and current_status == "counter_offered":
                    notif_event = "counter_accepted"
                elif action == "reject" and current_status == "counter_offered":
                    notif_event = "counter_rejected"
                elif action == "counter":
                    notif_event = "counter"
                elif action == "override":
                    notif_event = "dispute_resolved"

                create_booking_notification(
                    db=db,
                    booking=booking,
                    event_type=notif_event,
                    actor_id=actor_id,
                    actor_role=actor_role,
                    reason=reason
                )
            except Exception as notif_err:
                logger.error(f"Failed to generate notification for transition on booking {booking_id}: {notif_err}")

            return booking

        except Exception as e:
            # Persistent capture of failure audits for admins
            try:
                from app.features.notifications.service import create_failed_action_notification
                create_failed_action_notification(
                    booking_id=booking_id,
                    actor_id=actor_id,
                    actor_role=actor_role,
                    action=action,
                    error_message=str(e),
                    db=db
                )
            except Exception as failed_notif_err:
                logger.error(f"Failed to log failed action notification: {failed_notif_err}")
            
            raise e
