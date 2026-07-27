from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from uuid import UUID
from datetime import datetime
from typing import List, Tuple, Optional
from app.features.bookings.models import Booking
from app.features.auth.models import User
from app.common.repositories.base import BaseRepository

class BookingCRUD(BaseRepository[Booking]):
    def __init__(self):
        super().__init__(Booking)

    def get(self, db: Session, id: UUID) -> Optional[Booking]:
        return db.query(Booking).options(
            joinedload(Booking.artist_profile),
            joinedload(Booking.venue),
            joinedload(Booking.client)
        ).filter(
            Booking.id == id,
            Booking.deleted_at.is_(None)
        ).first()

    def get_by_artist(
        self,
        db: Session,
        artist_id: UUID,
        status: Optional[str] = None,
        search: Optional[str] = None,
        offset: int = 0,
        limit: int = 10
    ) -> Tuple[List[Booking], int]:
        query = db.query(Booking).options(
            joinedload(Booking.client),
            joinedload(Booking.artist_profile),
            joinedload(Booking.venue)
        ).filter(
            Booking.artist_profile_id == artist_id,
            Booking.deleted_at.is_(None)
        )

        if status:
            query = query.filter(Booking.status == status)

        if search:
            search_clause = or_(
                Booking.event_name.ilike(f"%{search}%"),
                Booking.location.ilike(f"%{search}%")
            )
            # Link check for client name search
            query = query.join(Booking.client).filter(
                or_(search_clause, User.name.ilike(f"%{search}%"))
            )

        total = query.count()
        results = query.order_by(Booking.created_at.desc()).offset(offset).limit(limit).all()
        return results, total

    def create(self, db: Session, client_id: UUID, artist_profile_id: UUID, data: dict) -> Booking:
        # Convert date and time strings if necessary
        ev_date = data["event_date"]
        if isinstance(ev_date, str):
            ev_date = datetime.strptime(ev_date, "%Y-%m-%d").date()
            
        st_time = data["start_time"]
        if isinstance(st_time, str):
            st_time = datetime.strptime(st_time, "%H:%M").time()

        et_time = data["end_time"]
        if isinstance(et_time, str):
            et_time = datetime.strptime(et_time, "%H:%M").time()

        now_str = datetime.utcnow().isoformat()
        initial_timeline = [{
            "status": "pending",
            "timestamp": now_str,
            "by": "client",
            "message": "Booking request initialized by event host client."
        }]

        booking = Booking(
            artist_profile_id=artist_profile_id,
            client_id=client_id,
            event_name=data["event_name"],
            event_date=ev_date,
            start_time=st_time,
            end_time=et_time,
            location=data["location"],
            proposed_price=data["proposed_price"],
            notes=data.get("notes"),
            status="pending",
            timeline=initial_timeline
        )
        db.add(booking)
        db.commit()
        db.refresh(booking)
        return booking

    def get_by_venue(
        self,
        db: Session,
        venue_id: UUID,
        status: Optional[str] = None,
        search: Optional[str] = None,
        offset: int = 0,
        limit: int = 10
    ) -> Tuple[List[Booking], int]:
        query = db.query(Booking).options(
            joinedload(Booking.client),
            joinedload(Booking.artist_profile),
            joinedload(Booking.venue)
        ).filter(
            Booking.venue_id == venue_id,
            Booking.deleted_at.is_(None)
        )

        if status:
            query = query.filter(Booking.status == status)

        if search:
            search_clause = or_(
                Booking.event_name.ilike(f"%{search}%"),
                Booking.location.ilike(f"%{search}%")
            )
            # Link check for client name search
            query = query.join(Booking.client).filter(
                or_(search_clause, User.name.ilike(f"%{search}%"))
            )

        total = query.count()
        results = query.order_by(Booking.created_at.desc()).offset(offset).limit(limit).all()
        return results, total

    def create_venue_booking(self, db: Session, client_id: UUID, venue_id: UUID, data: dict) -> Booking:
        ev_date = data["event_date"]
        if isinstance(ev_date, str):
            ev_date = datetime.strptime(ev_date, "%Y-%m-%d").date()
            
        st_time = data["start_time"]
        if isinstance(st_time, str):
            st_time = datetime.strptime(st_time, "%H:%M").time()

        et_time = data["end_time"]
        if isinstance(et_time, str):
            et_time = datetime.strptime(et_time, "%H:%M").time()

        now_str = datetime.utcnow().isoformat()
        initial_timeline = [{
            "status": "pending",
            "timestamp": now_str,
            "by": "client",
            "message": "Booking request initialized for venue."
        }]

        booking = Booking(
            venue_id=venue_id,
            client_id=client_id,
            event_name=data["event_name"],
            event_date=ev_date,
            start_time=st_time,
            end_time=et_time,
            location=data["location"],
            proposed_price=data["proposed_price"],
            notes=data.get("notes"),
            status="pending",
            timeline=initial_timeline
        )
        db.add(booking)
        db.commit()
        db.refresh(booking)
        return booking

    def get_by_client(
        self,
        db: Session,
        client_id: UUID,
        status: Optional[str] = None,
        search: Optional[str] = None,
        offset: int = 0,
        limit: int = 10
    ) -> Tuple[List[Booking], int]:
        query = db.query(Booking).options(
            joinedload(Booking.artist_profile),
            joinedload(Booking.venue)
        ).filter(
            Booking.client_id == client_id,
            Booking.deleted_at.is_(None)
        )

        if status:
            query = query.filter(Booking.status == status)

        if search:
            search_clause = or_(
                Booking.event_name.ilike(f"%{search}%"),
                Booking.location.ilike(f"%{search}%")
            )
            query = query.filter(search_clause)

        total = query.count()
        results = query.order_by(Booking.created_at.desc()).offset(offset).limit(limit).all()
        return results, total

    def get_all_bookings(
        self,
        db: Session,
        status: Optional[str] = None,
        search: Optional[str] = None,
        offset: int = 0,
        limit: int = 10
    ) -> Tuple[List[Booking], int]:
        query = db.query(Booking).options(
            joinedload(Booking.client),
            joinedload(Booking.artist_profile),
            joinedload(Booking.venue)
        ).filter(
            Booking.deleted_at.is_(None)
        )

        if status:
            query = query.filter(Booking.status == status)

        if search:
            search_clause = or_(
                Booking.event_name.ilike(f"%{search}%"),
                Booking.location.ilike(f"%{search}%")
            )
            query = query.join(Booking.client).filter(
                or_(search_clause, User.name.ilike(f"%{search}%"), User.email.ilike(f"%{search}%"))
            )

        total = query.count()
        results = query.order_by(Booking.created_at.desc()).offset(offset).limit(limit).all()
        return results, total

booking_crud = BookingCRUD()

