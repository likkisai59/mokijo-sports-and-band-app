"""
Business logic service layers for Artist Profile management.
"""

from sqlalchemy.orm import Session
from loguru import logger
from app.features.artists.crud import ArtistProfileCRUD
from app.features.artists.models import ArtistProfile
from app.features.artists.schemas import ArtistVerificationUpdate, ArtistRegisterRequest, ArtistProfileUpdate, ArtistProfileCreateRequest
from app.features.auth.crud import UserCRUD, RoleCRUD
from app.features.categories.models import Category
from app.core.exceptions import NotFoundException, ConflictException
from app.core.security import get_password_hash


class ArtistService:
    """Service class for managing platform performer profiles verification pipelines."""

    def __init__(self):
        self.crud = ArtistProfileCRUD()
        self.user_crud = UserCRUD()
        self.role_crud = RoleCRUD()

    def register_artist(self, db: Session, data: ArtistRegisterRequest) -> ArtistProfile:
        """Atomically registers a new user with 'artist' role and constructs their complete profile."""
        # 1. Check if user already exists
        existing_user = self.user_crud.get_by_email(db, data.email)
        if existing_user:
            raise ConflictException(f"User with email {data.email} already exists.")

        # 2. Get or create artist role
        role = self.role_crud.get_by_name(db, "artist")
        if not role:
            role = self.role_crud.create(db, obj_in={"name": "artist", "description": "Artist role"})

        # 3. Create User account
        hashed_password = get_password_hash(data.password)
        user = self.user_crud.create(
            db,
            obj_in={
                "email": data.email,
                "password_hash": hashed_password,
                "name": data.name,
                "is_active": True,
                "is_verified": False
            }
        )
        user.roles.append(role)
        db.flush()  # Generate user.id

        # 4. Create Artist Profile
        artist = self.crud.create(
            db,
            obj_in={
                "user_id": user.id,
                "bio": data.description,
                "base_rate": data.base_rate,
                "rating": 5.0,
                "verification_status": "pending",
                "display_name": data.display_name,
                "mobile_number": data.mobile_number,
                "years_of_experience": data.years_of_experience,
                "profile_image": data.profile_image,
                "cover_image": data.cover_image,
                "band_type": data.band_type,
                "total_members": data.total_members,
                "currency": data.currency,
                "travel_radius": data.travel_radius,
                "travel_charges": data.travel_charges,
                "min_booking_hours": data.min_booking_hours,
                "max_booking_hours": data.max_booking_hours,
                "equipment": data.equipment,
                "availability": data.availability,
                "gallery": data.gallery,
                "videos": data.videos,
                "youtube_links": data.youtube_links,
                "documents": [],
                "pricing_details": {
                    "hourly_rate": data.base_rate,
                    "travel_charge": data.travel_charges
                }
            }
        )

        # 5. Resolve Genres
        for genre_name in data.genres:
            genre = db.query(Category).filter(
                Category.name.ilike(genre_name),
                Category.type == "music_genre",
                Category.deleted_at.is_(None)
            ).first()
            if not genre:
                genre = Category(name=genre_name, type="music_genre", is_active=True)
                db.add(genre)
                db.flush()
            artist.genres.append(genre)

        # 6. Resolve Languages
        for lang_name in data.languages:
            lang = db.query(Category).filter(
                Category.name.ilike(lang_name),
                Category.type == "language",
                Category.deleted_at.is_(None)
            ).first()
            if not lang:
                lang = Category(name=lang_name, type="language", is_active=True)
                db.add(lang)
                db.flush()
            artist.languages.append(lang)

        db.commit()
        db.refresh(artist)
        logger.info(f"Artist/Band onboarding completed successfully for user {user.email}")
        return artist

    def create_artist_profile_for_user(
        self,
        db: Session,
        user_id: str,
        data: ArtistProfileCreateRequest
    ) -> ArtistProfile:
        """
        Creates an Artist/Band profile for an already-authenticated user who was registered
        via the standard /auth/register endpoint (role=artist). The User account already
        exists — we only create the ArtistProfile domain record.
        """
        from app.core.exceptions import ConflictException
        from uuid import UUID as PyUUID

        # Convert JWT sub (string) to UUID for repository calls
        try:
            user_uuid = PyUUID(user_id)
        except (ValueError, AttributeError):
            raise NotFoundException("Invalid user ID format.")

        # 1. Guard: profile must not already exist
        existing = self.crud.get_by_user_id(db, user_uuid)
        if existing:
            raise ConflictException("Artist profile already exists for this user.")

        # 2. Verify the user exists
        user = self.user_crud.get(db, user_uuid)
        if not user:
            raise NotFoundException("User account not found.")


        # 3. Create Artist Profile
        artist = self.crud.create(
            db,
            obj_in={
                "user_id": user.id,
                "bio": data.bio,
                "base_rate": data.base_rate,
                "rating": 5.0,
                "verification_status": "pending",
                "display_name": data.display_name,
                "mobile_number": data.mobile_number,
                "years_of_experience": data.years_of_experience,
                "profile_image": data.profile_image,
                "cover_image": data.cover_image,
                "city": data.city,
                "state": data.state,
                "band_type": data.band_type,
                "total_members": data.total_members,
                "currency": data.currency,
                "travel_radius": data.travel_radius,
                "travel_charges": data.travel_charges,
                "min_booking_hours": data.min_booking_hours,
                "max_booking_hours": data.max_booking_hours,
                "equipment": data.equipment,
                "availability": data.availability,
                "gallery": data.gallery,
                "videos": data.videos,
                "youtube_links": data.youtube_links,
                "documents": data.documents or {},
                "pricing_details": {
                    "hourly_rate": data.base_rate,
                    "travel_charge": data.travel_charges
                }
            }
        )

        # 4. Resolve Genres
        for genre_name in data.genres:
            genre = db.query(Category).filter(
                Category.name.ilike(genre_name),
                Category.type == "music_genre",
                Category.deleted_at.is_(None)
            ).first()
            if not genre:
                genre = Category(name=genre_name, type="music_genre", is_active=True)
                db.add(genre)
                db.flush()
            artist.genres.append(genre)

        # 5. Resolve Languages
        for lang_name in data.languages:
            lang = db.query(Category).filter(
                Category.name.ilike(lang_name),
                Category.type == "language",
                Category.deleted_at.is_(None)
            ).first()
            if not lang:
                lang = Category(name=lang_name, type="language", is_active=True)
                db.add(lang)
                db.flush()
            artist.languages.append(lang)

        db.commit()
        db.refresh(artist)
        logger.info(f"Artist profile created for existing user {user.email} (id={user_id})")
        return artist

    def update_verification_status(
        self,
        db: Session,
        artist_id: str,
        data: ArtistVerificationUpdate
    ) -> ArtistProfile:
        """Approves, rejects, or flags a performer's profile details verification request."""

        artist = self.crud.get(db, artist_id)
        if not artist or artist.deleted_at is not None:
            raise NotFoundException("Artist profile not found.")

        # Update verify status
        artist.verification_status = data.verification_status
        artist.verification_notes = data.verification_notes
        
        # If approved, flag user verification flag to True
        if data.verification_status == "approved":
            user = self.user_crud.get(db, artist.user_id)
            if user:
                user.is_verified = True
                db.add(user)

        db.add(artist)
        db.commit()
        db.refresh(artist)
        logger.info(f"Artist profile {artist_id} verification updated to: {data.verification_status}")
        return artist

    def suspend_artist(self, db: Session, artist_id: str) -> ArtistProfile:
        """Suspends the underlying user login credentials linked to the performer profile."""
        artist = self.crud.get(db, artist_id)
        if not artist or artist.deleted_at is not None:
            raise NotFoundException("Artist profile not found.")
            
        user = self.user_crud.get(db, artist.user_id)
        if not user:
            raise NotFoundException("Linked user account not found.")

        user.is_active = False
        db.add(user)
        db.commit()
        db.refresh(artist)
        logger.info(f"Suspended performer credentials session access: User ID {user.id}")
        return artist

    def activate_artist(self, db: Session, artist_id: str) -> ArtistProfile:
        """Activates the underlying user login credentials linked to the performer profile."""
        artist = self.crud.get(db, artist_id)
        if not artist or artist.deleted_at is not None:
            raise NotFoundException("Artist profile not found.")
            
        user = self.user_crud.get(db, artist.user_id)
        if not user:
            raise NotFoundException("Linked user account not found.")

        user.is_active = True
        db.add(user)
        db.commit()
        db.refresh(artist)
        logger.info(f"Activated performer credentials session access: User ID {user.id}")
        return artist

    def get_artist_by_user_id(self, db: Session, user_id: str) -> ArtistProfile:
        """Retrieves existing artist profile for user_id. Raises NotFoundException if missing."""
        from uuid import UUID as PyUUID
        user_uuid = PyUUID(str(user_id)) if not isinstance(user_id, PyUUID) else user_id
        artist = self.crud.get_by_user_id(db, user_uuid)
        if not artist:
            logger.error(f"Artist profile missing for user {user_id}")
            raise NotFoundException("Artist profile not found.")
        return artist

    def get_or_create_draft_artist(self, db: Session, user_id: str) -> ArtistProfile:
        """Utility helper for migration/testing. Production GET handlers use get_artist_by_user_id."""
        from uuid import UUID as PyUUID
        user_uuid = PyUUID(str(user_id)) if not isinstance(user_id, PyUUID) else user_id
        artist = self.crud.get_by_user_id(db, user_uuid)
        if not artist:
            user = self.user_crud.get(db, user_uuid)
            user_name = user.name if user else "Performer"
            artist = ArtistProfile(
                user_id=user_uuid,
                display_name=user_name,
                verification_status="pending"
            )
            db.add(artist)
            db.commit()
            db.refresh(artist)
            logger.info(f"Created draft ArtistProfile for user {user_id}")
        return artist

    def get_dashboard_stats(self, db: Session, user_id: str) -> dict:
        """Fetches and prepares stats, notifications, and events for the artist dashboard (Read-Only)."""
        artist = self.get_artist_by_user_id(db, user_id)

        # In production we would query actual bookings/reviews/notifications tables.
        # Currently we populate realistic mock metrics conforming to the specs.
        import uuid
        
        # Calculate a mock completion percentage based on profile fields filled
        completion = 50
        if artist.bio:
            completion += 10
        if artist.profile_image:
            completion += 10
        if artist.cover_image:
            completion += 10
        if artist.gallery:
            completion += 10
        if artist.videos:
            completion += 10

        return {
            "total_bookings": 12,
            "upcoming_events_count": 3,
            "pending_requests_count": 2,
            "monthly_revenue": 45000.0,
            "total_earnings": 180000.0,
            "average_rating": float(artist.rating) if artist.rating else 4.8,
            "profile_completion": min(completion, 100),
            "profile_views": 340,
            "upcoming_events": [
                {
                    "id": uuid.uuid4(),
                    "client_name": "Priya Sharma",
                    "event_name": "Wedding Reception",
                    "date": "2026-07-20",
                    "time": "19:00 - 22:00",
                    "location": "Grand Ballroom, Palace Hotel, Bangalore",
                    "status": "Confirmed",
                    "amount": 25000.0
                },
                {
                    "id": uuid.uuid4(),
                    "client_name": "TechCorp India",
                    "event_name": "Corporate Annual Bash",
                    "date": "2026-07-28",
                    "time": "18:30 - 21:30",
                    "location": "Marriott Hotel, Outer Ring Road, Bangalore",
                    "status": "Confirmed",
                    "amount": 40000.0
                },
                {
                    "id": uuid.uuid4(),
                    "client_name": "Rajesh Kumar",
                    "event_name": "Birthday Party",
                    "date": "2026-08-05",
                    "time": "20:00 - 23:00",
                    "location": "Rooftop Lounge, Indiranagar, Bangalore",
                    "status": "Confirmed",
                    "amount": 15000.0
                }
            ],
            "recent_booking_requests": [
                {
                    "id": uuid.uuid4(),
                    "client_name": "RV College of Engineering",
                    "event_name": "8th Mile College Fest",
                    "date": "2026-08-15",
                    "amount": 60000.0,
                    "status": "Pending"
                },
                {
                    "id": uuid.uuid4(),
                    "client_name": "High Ultra Lounge",
                    "event_name": "Private Club Gig",
                    "date": "2026-08-20",
                    "amount": 30000.0,
                    "status": "Pending"
                }
            ],
            "recent_reviews": [
                {
                    "id": uuid.uuid4(),
                    "client_name": "Priya Sharma",
                    "rating": 5.0,
                    "comment": "Absolutely phenomenal! The band made our wedding reception unforgettable. Highly recommended!",
                    "date": "2026-06-15"
                },
                {
                    "id": uuid.uuid4(),
                    "client_name": "TechCorp India",
                    "rating": 4.5,
                    "comment": "Great performance, very professional and punctual. The crowd loved the energy.",
                    "date": "2026-06-01"
                }
            ],
            "notifications": [
                {
                    "id": uuid.uuid4(),
                    "title": "New Booking Request",
                    "message": "RV College has requested a booking for August 15th.",
                    "created_at": "2 hours ago",
                    "is_read": False
                },
                {
                    "id": uuid.uuid4(),
                    "title": "Profile Approved",
                    "message": "Congratulations! Your band profile verification has been approved by admin.",
                    "created_at": "1 day ago",
                    "is_read": True
                }
            ],
            "revenue_chart": [
                {"month": "Jan", "revenue": 30000.0, "bookings": 2},
                {"month": "Feb", "revenue": 45000.0, "bookings": 3},
                {"month": "Mar", "revenue": 25000.0, "bookings": 1},
                {"month": "Apr", "revenue": 50000.0, "bookings": 4},
                {"month": "May", "revenue": 60000.0, "bookings": 4},
                {"month": "Jun", "revenue": 45000.0, "bookings": 3}
            ]
        }

    def update_profile(self, db: Session, user_id: str, data: ArtistProfileUpdate) -> ArtistProfile:
        """Updates performer profile details, resolves taxonomy categories, and links user name updates."""
        artist = self.crud.get_by_user_id(db, user_id)
        if not artist:
            raise NotFoundException("Artist profile not found.")

        # 1. Update User table name if passed
        if data.name is not None:
            user = self.user_crud.get(db, artist.user_id)
            if user:
                user.name = data.name
                db.add(user)

        # 2. Update basic fields
        if data.bio is not None:
            artist.bio = data.bio
        if data.display_name is not None:
            artist.display_name = data.display_name
        if data.mobile_number is not None:
            artist.mobile_number = data.mobile_number
        if data.years_of_experience is not None:
            artist.years_of_experience = data.years_of_experience
        if data.profile_image is not None:
            artist.profile_image = data.profile_image
        if data.cover_image is not None:
            artist.cover_image = data.cover_image
        if data.city is not None:
            artist.city = data.city
        if data.state is not None:
            artist.state = data.state
        
        # Band type / members
        if data.band_type is not None:
            artist.band_type = data.band_type
        if data.total_members is not None:
            artist.total_members = data.total_members
        
        # Pricing / Rate limits
        if data.base_rate is not None:
            artist.base_rate = data.base_rate
            if not artist.pricing_details:
                artist.pricing_details = {}
            artist.pricing_details = {**artist.pricing_details, "hourly_rate": data.base_rate}
        if data.currency is not None:
            artist.currency = data.currency
        if data.travel_radius is not None:
            artist.travel_radius = data.travel_radius
        if data.travel_charges is not None:
            artist.travel_charges = data.travel_charges
            if not artist.pricing_details:
                artist.pricing_details = {}
            artist.pricing_details = {**artist.pricing_details, "travel_charge": data.travel_charges}
        if data.min_booking_hours is not None:
            artist.min_booking_hours = data.min_booking_hours
        if data.max_booking_hours is not None:
            artist.max_booking_hours = data.max_booking_hours
        
        # Equipment & Social & Achievements & Documents
        if data.equipment is not None:
            artist.equipment = data.equipment
        if data.social_links is not None:
            artist.social_links = data.social_links
        if data.achievements is not None:
            artist.achievements = data.achievements
        if data.documents is not None:
            artist.documents = data.documents

        # 3. Resolve & update genres if passed
        if data.genres is not None:
            artist.genres.clear()
            for genre_name in data.genres:
                genre = db.query(Category).filter(
                    Category.name.ilike(genre_name),
                    Category.type == "music_genre",
                    Category.deleted_at.is_(None)
                ).first()
                if not genre:
                    genre = Category(name=genre_name, type="music_genre", is_active=True)
                    db.add(genre)
                    db.flush()
                artist.genres.append(genre)

        # 4. Resolve & update languages if passed
        if data.languages is not None:
            artist.languages.clear()
            for lang_name in data.languages:
                lang = db.query(Category).filter(
                    Category.name.ilike(lang_name),
                    Category.type == "language",
                    Category.deleted_at.is_(None)
                ).first()
                if not lang:
                    lang = Category(name=lang_name, type="language", is_active=True)
                    db.add(lang)
                    db.flush()
                artist.languages.append(lang)

        db.commit()
        db.refresh(artist)
        logger.info(f"Artist profile {artist.id} updated successfully by user {user_id}")
        return artist

    def get_availability(self, db: Session, user_id: str) -> dict:
        """Fetches availability schedule configuration for the performer."""
        artist = self.crud.get_by_user_id(db, user_id)
        if not artist:
            raise NotFoundException("Artist profile not found.")
        
        # Fallback to default schedule if empty
        if not artist.availability or "weekly_schedule" not in artist.availability:
            artist.availability = {
                "weekly_schedule": {
                    "Monday": {"available": True, "start": "09:00", "end": "22:00"},
                    "Tuesday": {"available": True, "start": "09:00", "end": "22:00"},
                    "Wednesday": {"available": True, "start": "09:00", "end": "22:00"},
                    "Thursday": {"available": True, "start": "09:00", "end": "22:00"},
                    "Friday": {"available": True, "start": "09:00", "end": "23:00"},
                    "Saturday": {"available": True, "start": "09:00", "end": "23:00"},
                    "Sunday": {"available": True, "start": "09:00", "end": "22:00"}
                },
                "break_time": {"start": "13:00", "end": "14:00"},
                "blocked_dates": [],
                "holidays": []
            }
            db.add(artist)
            db.commit()
            db.refresh(artist)
            
        return artist.availability

    def update_availability(self, db: Session, user_id: str, data: dict) -> dict:
        """Saves availability schedule configurations for the performer."""
        artist = self.crud.get_by_user_id(db, user_id)
        if not artist:
            raise NotFoundException("Artist profile not found.")

        artist.availability = data
        db.add(artist)
        db.commit()
        logger.info(f"Artist profile {artist.id} updated availability schedule configurations.")
        return artist.availability

    def check_availability_conflict(self, db: Session, user_id: str, date_str: str, start_time: str, end_time: str) -> tuple[bool, str | None]:
        """Detects if a requested date and time has schedule conflicts (holidays, blocked, working hours, break, events)."""
        artist = self.crud.get_by_user_id(db, user_id)
        if not artist:
            raise NotFoundException("Artist profile not found.")
            
        # Parse inputs
        from datetime import datetime
        try:
            req_date = datetime.strptime(date_str, "%Y-%m-%d")
            req_start = datetime.strptime(start_time, "%H:%M").time()
            req_end = datetime.strptime(end_time, "%H:%M").time()
        except ValueError:
            return True, "Invalid date or time formats. Required: YYYY-MM-DD, HH:MM"

        avail = artist.availability or {}
        
        # 1. Check Blocked Dates
        if date_str in avail.get("blocked_dates", []):
            return True, "Date is marked blocked by performer."
            
        # 2. Check Holidays
        if date_str in avail.get("holidays", []):
            return True, "Date is marked as a holiday."

        # 3. Check Weekly Work Schedule
        day_of_week = req_date.strftime("%A")
        weekly = avail.get("weekly_schedule", {})
        day_config = weekly.get(day_of_week, {})
        
        if not day_config or not day_config.get("available", False):
            return True, f"Performer does not work on {day_of_week}s."
            
        # Parse work hours limits
        try:
            work_start = datetime.strptime(day_config.get("start", "09:00"), "%H:%M").time()
            work_end = datetime.strptime(day_config.get("end", "22:00"), "%H:%M").time()
        except ValueError:
            work_start = datetime.strptime("09:00", "%H:%M").time()
            work_end = datetime.strptime("22:00", "%H:%M").time()

        if req_start < work_start or req_end > work_end:
            return True, f"Requested times fall outside performer working hours ({day_config.get('start', '09:00')} - {day_config.get('end', '22:00')})."

        # 4. Check Break Times
        break_config = avail.get("break_time", {"start": "13:00", "end": "14:00"})
        try:
            break_start = datetime.strptime(break_config.get("start", "13:00"), "%H:%M").time()
            break_end = datetime.strptime(break_config.get("end", "14:00"), "%H:%M").time()
        except ValueError:
            break_start = datetime.strptime("13:00", "%H:%M").time()
            break_end = datetime.strptime("14:00", "%H:%M").time()

        # Check if overlaps with break: req starts before break ends, and req ends after break starts
        if req_start < break_end and req_end > break_start:
            return True, f"Requested times conflict with performer break hours ({break_config.get('start', '13:00')} - {break_config.get('end', '14:00')})."

        # 5. Check Confirmed Event Gigs (mock database query)
        # Mock events list for verification
        mock_events = [
            {"date": "2026-07-20", "start": "19:00", "end": "22:00"},
            {"date": "2026-07-28", "start": "18:30", "end": "21:30"},
            {"date": "2026-08-05", "start": "20:00", "end": "23:00"}
        ]
        
        for event in mock_events:
            if event["date"] == date_str:
                ev_start = datetime.strptime(event["start"], "%H:%M").time()
                ev_end = datetime.strptime(event["end"], "%H:%M").time()
                # Overlap: req start before event end, req end after event start
                if req_start < ev_end and req_end > ev_start:
                    return True, "Performer has an event conflict at the requested times."

        return False, None

    def get_media(self, db: Session, user_id: str) -> dict:
        """Fetches gallery images, files/youtube videos, and reels of the performer."""
        artist = self.crud.get_by_user_id(db, user_id)
        if not artist:
            raise NotFoundException("Artist profile not found.")
            
        return {
            "gallery": artist.gallery or [],
            "videos": artist.videos or [],
            "youtube_links": artist.youtube_links or [],
            "instagram_reels": artist.instagram_reels or []
        }

    def update_media(self, db: Session, user_id: str, data: dict) -> dict:
        """Saves gallery images, files/youtube videos, and reels of the performer."""
        artist = self.crud.get_by_user_id(db, user_id)
        if not artist:
            raise NotFoundException("Artist profile not found.")

        artist.gallery = data.get("gallery", [])
        artist.videos = data.get("videos", [])
        artist.youtube_links = data.get("youtube_links", [])
        artist.instagram_reels = data.get("instagram_reels", [])
        
        db.add(artist)
        db.commit()
        logger.info(f"Artist profile {artist.id} media gallery updated.")
        
        return {
            "gallery": artist.gallery,
            "videos": artist.videos,
            "youtube_links": artist.youtube_links,
            "instagram_reels": artist.instagram_reels
        }

    def get_pricing(self, db: Session, user_id: str) -> dict:
        """Fetches base rate, package details, weekend/holiday surcharges and offers of the performer."""
        artist = self.crud.get_by_user_id(db, user_id)
        if not artist:
            raise NotFoundException("Artist profile not found.")
            
        details = artist.pricing_details or {}
        return {
            "base_rate": float(artist.base_rate),
            "currency": artist.currency or "INR",
            "travel_radius": float(artist.travel_radius) if artist.travel_radius is not None else 0.0,
            "travel_charges": float(artist.travel_charges),
            "min_booking_hours": float(artist.min_booking_hours),
            "max_booking_hours": float(artist.max_booking_hours),
            "weekend_surcharge": float(details.get("weekend_surcharge", 0.0)),
            "holiday_surcharge": float(details.get("holiday_surcharge", 0.0)),
            "packages": details.get("packages", []),
            "special_offers": details.get("special_offers", [])
        }

    def update_pricing(self, db: Session, user_id: str, data: dict) -> dict:
        """Saves base rate, package details, weekend/holiday surcharges and offers of the performer."""
        artist = self.crud.get_by_user_id(db, user_id)
        if not artist:
            raise NotFoundException("Artist profile not found.")

        artist.base_rate = data.get("base_rate", 0.0)
        artist.currency = data.get("currency", "INR")
        if "travel_radius" in data:
            artist.travel_radius = data["travel_radius"]
        artist.travel_charges = data.get("travel_charges", 0.0)
        artist.min_booking_hours = data.get("min_booking_hours", 0.0)
        artist.max_booking_hours = data.get("max_booking_hours", 0.0)

        # Merge with existing details dict
        details = artist.pricing_details or {}
        artist.pricing_details = {
            **details,
            "hourly_rate": data.get("base_rate", 0.0),
            "travel_charge": data.get("travel_charges", 0.0),
            "weekend_surcharge": data.get("weekend_surcharge", 0.0),
            "holiday_surcharge": data.get("holiday_surcharge", 0.0),
            "packages": data.get("packages", []),
            "special_offers": data.get("special_offers", [])
        }
        
        db.add(artist)
        db.commit()
        db.refresh(artist)
        logger.info(f"Artist profile {artist.id} pricing details updated.")
        
        return self.get_pricing(db, user_id)

    def get_analytics(self, db: Session, user_id: str) -> dict:
        """Calculates performance growth, conversion rates, popular events, and rating trend analytics."""
        artist = self.crud.get_by_user_id(db, user_id)
        if not artist:
            raise NotFoundException("Artist profile not found.")

        # Aggregate counts from Bookings table
        # We query the bookings of the artist profile ID
        from app.features.bookings.models import Booking
        from app.features.reviews.models import Review
        
        # 1. Total bookings count
        total_bookings = db.query(Booking).filter(Booking.artist_profile_id == artist.id).count()
        
        # 2. Popular event types mock calculation based on event names or descriptions
        # We parse event names to categorize them dynamically
        event_types = {"Weddings": 0, "Corporate Events": 0, "Club Gigs": 0, "Private Parties": 0}
        bookings = db.query(Booking).filter(Booking.artist_profile_id == artist.id).all()
        for b in bookings:
            name_lower = b.event_name.lower()
            if "wedding" in name_lower or "marriage" in name_lower:
                event_types["Weddings"] += 1
            elif "corporate" in name_lower or "techcorp" in name_lower or "company" in name_lower:
                event_types["Corporate Events"] += 1
            elif "pub" in name_lower or "club" in name_lower or "bar" in name_lower:
                event_types["Club Gigs"] += 1
            else:
                event_types["Private Parties"] += 1
                
        # Default seeding if empty
        if total_bookings == 0:
            event_types = {"Weddings": 8, "Corporate Events": 5, "Club Gigs": 4, "Private Parties": 2}
            total_bookings = 19

        popular_events = [{"name": k, "value": float(v)} for k, v in event_types.items()]

        # 3. Top cities
        city_counts = {}
        for b in bookings:
            # simple city resolver (e.g. split address or location string)
            loc = b.location.split(",")[-1].strip() if "," in b.location else b.location.strip()
            if loc:
                city_counts[loc] = city_counts.get(loc, 0) + 1
        
        if not city_counts:
            city_counts = {"Chennai": 10, "Bangalore": 6, "Mumbai": 3}
            
        top_cities = [{"name": k, "value": float(v)} for k, v in sorted(city_counts.items(), key=lambda x: x[1], reverse=True)]

        # 4. Rating trends
        reviews = db.query(Review).filter(Review.artist_profile_id == artist.id).order_by(Review.created_at.asc()).limit(10).all()
        rating_trends = []
        for r in reviews:
            rating_trends.append({
                "date": r.created_at.strftime("%Y-%m-%d"),
                "rating": float(r.rating)
            })
        if not rating_trends:
            # fallback
            rating_trends = [
                {"date": "2026-06-01", "rating": 4.5},
                {"date": "2026-06-15", "rating": 4.8},
                {"date": "2026-07-01", "rating": 4.7},
                {"date": "2026-07-08", "rating": 4.9}
            ]

        # 5. Peak Booking Times
        time_slots = {"Morning (9am - 12pm)": 0, "Afternoon (12pm - 4pm)": 0, "Evening (4pm - 8pm)": 0, "Night (8pm - 12am)": 0}
        for b in bookings:
            hr = b.start_time.hour
            if 9 <= hr < 12:
                time_slots["Morning (9am - 12pm)"] += 1
            elif 12 <= hr < 16:
                time_slots["Afternoon (12pm - 4pm)"] += 1
            elif 16 <= hr < 20:
                time_slots["Evening (4pm - 8pm)"] += 1
            else:
                time_slots["Night (8pm - 12am)"] += 1
        if sum(time_slots.values()) == 0:
            time_slots = {"Morning (9am - 12pm)": 2, "Afternoon (12pm - 4pm)": 3, "Evening (4pm - 8pm)": 11, "Night (8pm - 12am)": 5}
            
        peak_times = [{"time_slot": k, "count": v} for k, v in time_slots.items()]

        # 6. Monthly performance stats (reused from dashboard stats)
        dashboard_stats = self.get_dashboard_stats(db, user_id)
        monthly_performance = dashboard_stats["revenue_chart"]

        profile_views = 480
        booking_conversion = (total_bookings / profile_views) * 100

        return {
            "booking_growth": 14.5,  # mock percentage
            "revenue_growth": 21.2,  # mock percentage
            "profile_views": profile_views,
            "booking_conversion": float(round(booking_conversion, 1)),
            "popular_event_types": popular_events,
            "top_cities": top_cities,
            "monthly_performance": monthly_performance,
            "peak_booking_times": peak_times,
            "rating_trends": rating_trends
        }
