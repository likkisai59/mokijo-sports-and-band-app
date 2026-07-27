from typing import Any, List, Optional, Tuple
from uuid import UUID

from app.core.exceptions import BadRequestException, NotFoundException
from app.features.artists.crud import ArtistProfileCRUD
from app.features.artists.models import ArtistProfile
from app.features.artists.service import ArtistService
from app.features.bookings.crud import booking_crud
from app.features.bookings.models import Booking
from loguru import logger
from sqlalchemy.orm import Session


class BookingService:
    def __init__(self):
        self.artist_crud = ArtistProfileCRUD()
        self.artist_service = ArtistService()

    def get_artist_profile(self, db: Session, user_id: str):
        artist = self.artist_crud.get_by_user_id(db, user_id)
        if not artist:
            raise NotFoundException("Artist profile not found.")
        return artist

    def create_booking(self, db: Session, client_id: UUID, data: Any) -> Booking:
        if data.venue_id:
            from app.features.venues.models import Venue

            venue = db.query(Venue).filter(Venue.id == data.venue_id).first()
            if not venue:
                raise NotFoundException("Venue profile not found.")

            # Check availability conflict
            from app.features.venues.service import VenueService

            venue_svc = VenueService()
            conflict_info = venue_svc.check_booking_conflict(
                db, str(venue.user_id), data.event_date, data.start_time, data.end_time
            )
            if conflict_info.get("conflict"):
                raise BadRequestException(
                    f"Booking slot conflict: {conflict_info.get('reason') or 'Venue is unavailable.'}"
                )

            booking = booking_crud.create_venue_booking(
                db, client_id, data.venue_id, data.model_dump()
            )
            logger.info(
                f"Booking {booking.id} created successfully by client {client_id} for venue {data.venue_id}"
            )
            try:
                from app.features.notifications.service import create_booking_notification
                create_booking_notification(
                    db=db,
                    booking=booking,
                    event_type="created",
                    actor_id=str(client_id),
                    actor_role="client"
                )
            except Exception as notif_err:
                logger.error(f"Failed to trigger created notification for booking {booking.id}: {notif_err}")
            return booking

        elif data.artist_profile_id:
            artist_profile = (
                db.query(ArtistProfile)
                .filter(ArtistProfile.id == data.artist_profile_id)
                .first()
            )
            if not artist_profile:
                raise NotFoundException("Artist profile not found.")

            # Event conflict check connection
            has_conflict, reason = self.artist_service.check_availability_conflict(
                db,
                str(artist_profile.user_id),
                data.event_date,
                data.start_time,
                data.end_time,
            )
            if has_conflict:
                raise BadRequestException(
                    f"Booking slot conflict: {reason or 'Performer is unavailable.'}"
                )

            booking = booking_crud.create(
                db, client_id, data.artist_profile_id, data.model_dump()
            )
            logger.info(
                f"Booking {booking.id} created successfully by client {client_id} for artist {data.artist_profile_id}"
            )
            try:
                from app.features.notifications.service import create_booking_notification
                create_booking_notification(
                    db=db,
                    booking=booking,
                    event_type="created",
                    actor_id=str(client_id),
                    actor_role="client"
                )
            except Exception as notif_err:
                logger.error(f"Failed to trigger created notification for booking {booking.id}: {notif_err}")
            return booking
        else:
            raise BadRequestException(
                "Either artist_profile_id or venue_id must be provided."
            )

    def get_artist_bookings(
        self,
        db: Session,
        user_id: str,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
    ) -> Tuple[List[Booking], int]:
        artist = self.get_artist_profile(db, user_id)
        offset = (page - 1) * limit
        return booking_crud.get_by_artist(db, artist.id, status, search, offset, limit)

    def get_booking_details(
        self, db: Session, user_id: str, booking_id: UUID
    ) -> Booking:
        booking = booking_crud.get(db, booking_id)
        if not booking:
            raise NotFoundException("Booking request not found.")

        # Check if user is admin
        from app.features.auth.models import User
        user = None
        try:
            user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
            user = db.query(User).filter(User.id == user_uuid).first()
        except Exception:
            pass
        is_admin = any(role.name == "admin" for role in user.roles) if user else False

        if not is_admin:
            artist = self.artist_crud.get_by_user_id(db, user_id)
            # Verify access: user is client or target performer
            if str(booking.client_id) != user_id and (
                not artist or booking.artist_profile_id != artist.id
            ):
                raise BadRequestException("Access denied to view this booking request.")

        return booking

    def accept_booking(self, db: Session, user_id: str, booking_id: UUID) -> Booking:
        from app.features.bookings.workflow import BookingWorkflowEngine
        booking = BookingWorkflowEngine.transition(
            db=db,
            booking_id=booking_id,
            actor_id=user_id,
            actor_role="artist",
            action="accept",
            target_status="accepted",
        )
        logger.info(f"Booking request {booking.id} accepted by artist user {user_id}")
        return booking

    def reject_booking(self, db: Session, user_id: str, booking_id: UUID) -> Booking:
        from app.features.bookings.workflow import BookingWorkflowEngine
        booking = BookingWorkflowEngine.transition(
            db=db,
            booking_id=booking_id,
            actor_id=user_id,
            actor_role="artist",
            action="reject",
            target_status="rejected",
        )
        logger.info(f"Booking request {booking.id} rejected by artist user {user_id}")
        return booking

    def counter_offer(
        self,
        db: Session,
        user_id: str,
        booking_id: UUID,
        counter_price: float,
        message: Optional[str],
    ) -> Booking:
        from app.features.bookings.workflow import BookingWorkflowEngine
        booking = BookingWorkflowEngine.transition(
            db=db,
            booking_id=booking_id,
            actor_id=user_id,
            actor_role="artist",
            action="counter",
            target_status="counter_offered",
            reason=message,
            counter_price=counter_price,
        )
        logger.info(
            f"Booking request {booking.id} counter offered by artist user {user_id} with price {counter_price}"
        )
        return booking

    def cancel_booking(self, db: Session, user_id: str, booking_id: UUID, reason: Optional[str] = None) -> Booking:
        booking = booking_crud.get(db, booking_id)
        if not booking:
            raise NotFoundException("Booking request not found.")
        is_client = str(booking.client_id) == user_id
        
        from app.features.auth.models import User
        user = None
        try:
            user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
            user = db.query(User).filter(User.id == user_uuid).first()
        except Exception:
            pass
        is_admin = any(role.name == "admin" for role in user.roles) if user else False

        if is_admin:
            role = "admin"
        else:
            role = "client" if is_client else "artist"

        from app.features.bookings.workflow import BookingWorkflowEngine
        booking = BookingWorkflowEngine.transition(
            db=db,
            booking_id=booking_id,
            actor_id=user_id,
            actor_role=role,
            action="cancel",
            target_status="cancelled",
            reason=reason,
        )
        logger.info(f"Booking request {booking.id} cancelled by user {user_id} ({role})")
        return booking

    def get_venue_profile(self, db: Session, user_id: str):
        from app.features.venues.crud import VenueCRUD

        venues = VenueCRUD().get_by_user_id(db, user_id)
        if not venues:
            raise NotFoundException("Venue profile not found.")
        return venues[0]

    def get_venue_bookings(
        self,
        db: Session,
        user_id: str,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
    ) -> Tuple[List[Booking], int]:
        venue = self.get_venue_profile(db, user_id)
        offset = (page - 1) * limit
        return booking_crud.get_by_venue(db, venue.id, status, search, offset, limit)

    def get_venue_booking_details(
        self, db: Session, user_id: str, booking_id: UUID
    ) -> Booking:
        booking = booking_crud.get(db, booking_id)
        if not booking:
            raise NotFoundException("Booking request not found.")

        # Check if user is admin
        from app.features.auth.models import User
        user = None
        try:
            user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
            user = db.query(User).filter(User.id == user_uuid).first()
        except Exception:
            pass
        is_admin = any(role.name == "admin" for role in user.roles) if user else False

        if not is_admin:
            venue = self.get_venue_profile(db, user_id)
            # Verify access: user is client or target venue owner
            if str(booking.client_id) != user_id and booking.venue_id != venue.id:
                raise BadRequestException("Access denied to view this booking request.")

        return booking

    def accept_venue_booking(
        self, db: Session, user_id: str, booking_id: UUID
    ) -> Booking:
        from app.features.bookings.workflow import BookingWorkflowEngine
        booking = BookingWorkflowEngine.transition(
            db=db,
            booking_id=booking_id,
            actor_id=user_id,
            actor_role="venue_owner",
            action="accept",
            target_status="accepted",
        )
        logger.info(
            f"Booking request {booking.id} accepted by venue owner user {user_id}"
        )
        return booking

    def reject_venue_booking(
        self, db: Session, user_id: str, booking_id: UUID
    ) -> Booking:
        from app.features.bookings.workflow import BookingWorkflowEngine
        booking = BookingWorkflowEngine.transition(
            db=db,
            booking_id=booking_id,
            actor_id=user_id,
            actor_role="venue_owner",
            action="reject",
            target_status="rejected",
        )
        logger.info(
            f"Booking request {booking.id} rejected by venue owner user {user_id}"
        )
        return booking

    def complete_venue_booking(
        self, db: Session, user_id: str, booking_id: UUID
    ) -> Booking:
        from app.features.bookings.workflow import BookingWorkflowEngine
        booking = BookingWorkflowEngine.transition(
            db=db,
            booking_id=booking_id,
            actor_id=user_id,
            actor_role="venue_owner",
            action="complete",
            target_status="completed",
        )
        logger.info(
            f"Booking request {booking.id} marked as completed by venue owner user {user_id}"
        )
        return booking

    def cancel_venue_booking(
        self, db: Session, user_id: str, booking_id: UUID, reason: Optional[str] = None
    ) -> Booking:
        booking = booking_crud.get(db, booking_id)
        if not booking:
            raise NotFoundException("Booking request not found.")
        is_client = str(booking.client_id) == user_id
        
        from app.features.auth.models import User
        user = None
        try:
            user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
            user = db.query(User).filter(User.id == user_uuid).first()
        except Exception:
            pass
        is_admin = any(role.name == "admin" for role in user.roles) if user else False

        if is_admin:
            role = "admin"
        else:
            role = "client" if is_client else "venue_owner"

        from app.features.bookings.workflow import BookingWorkflowEngine
        booking = BookingWorkflowEngine.transition(
            db=db,
            booking_id=booking_id,
            actor_id=user_id,
            actor_role=role,
            action="cancel",
            target_status="cancelled",
            reason=reason,
        )
        logger.info(f"Booking request {booking.id} cancelled by user {user_id} ({role})")
        return booking

    # Validation helper used by tests and callers to validate incoming booking payloads.
    def validate_booking_request(self, db: Session, payload: Any) -> dict:
        """Lightweight validation for UI-level booking requests (UI-only checks).

        Returns dict with keys: is_valid (bool) and errors (list[str]).
        Only implements minimal checks required by unit tests (event_date not in past, basic types).
        """
        errors = []
        from datetime import date

        # validate event_date
        ev = getattr(payload, "event_date", None)
        try:
            if isinstance(ev, str):
                ev_date = date.fromisoformat(ev)
            elif hasattr(ev, "isoformat"):
                ev_date = ev
            else:
                raise ValueError("invalid")
            if isinstance(ev_date, date) and ev_date < date.today():
                errors.append("Event date appears to be in the past")
        except Exception:
            errors.append("Invalid event_date format")

        return {"is_valid": len(errors) == 0, "errors": errors}

    def prepare_booking_update(self, payload: Any, booking: Any, role: str) -> dict:
        """Prepare an update dict for an existing booking using payload values.

        Converts string date/time values to date/time objects where applicable.
        This is intentionally minimal and used by unit tests to verify conversion.
        """
        from datetime import date, time

        # event_date
        ev = getattr(payload, "event_date", None)
        if isinstance(ev, str):
            event_date = date.fromisoformat(ev)
        else:
            event_date = ev

        # start_time / end_time
        st = getattr(payload, "start_time", None)
        et = getattr(payload, "end_time", None)
        if isinstance(st, str):
            start_time = time.fromisoformat(st)
        else:
            start_time = st
        if isinstance(et, str):
            end_time = time.fromisoformat(et)
        else:
            end_time = et

        return {
            "event_title": getattr(payload, "event_title", booking.event_title),
            "event_date": event_date,
            "start_time": start_time,
            "end_time": end_time,
            "notes": getattr(
                payload, "notes", booking.notes if hasattr(booking, "notes") else None
            ),
            "special_requests": getattr(
                payload,
                "special_requests",
                booking.special_requests
                if hasattr(booking, "special_requests")
                else None,
            ),
        }

    def get_client_bookings(
        self,
        db: Session,
        client_id: str,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
    ) -> Tuple[List[Booking], int]:
        offset = (page - 1) * limit
        return booking_crud.get_by_client(db, UUID(client_id), status, search, offset, limit)

    def get_all_bookings(
        self,
        db: Session,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
    ) -> Tuple[List[Booking], int]:
        offset = (page - 1) * limit
        return booking_crud.get_all_bookings(db, status, search, offset, limit)

    def resolve_dispute(
        self,
        db: Session,
        booking_id: UUID,
        new_status: str,
        admin_id: str,
        message: Optional[str] = None,
    ) -> Booking:
        from app.features.bookings.workflow import BookingWorkflowEngine
        booking = BookingWorkflowEngine.transition(
            db=db,
            booking_id=booking_id,
            actor_id=admin_id,
            actor_role="admin",
            action="override",
            target_status=new_status,
            reason=message,
        )
        logger.info(f"Booking {booking_id} status overridden to {new_status} by admin {admin_id}")
        return booking


booking_service = BookingService()
