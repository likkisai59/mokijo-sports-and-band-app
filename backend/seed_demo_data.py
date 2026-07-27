import uuid
import sys
from loguru import logger
from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.features.auth.models import User, Role
from app.features.locations.models import Country, State, City
from app.features.artists.models import ArtistProfile
from app.features.venues.models import Venue

def seed():
    if settings.ENVIRONMENT == "production":
        logger.error("Seeding is blocked in production environment!")
        sys.exit(1)

    db = SessionLocal()
    try:
        # Seed Roles
        role_names = ["client", "artist", "venue_owner", "admin"]
        roles = {}
        for rname in role_names:
            role = db.query(Role).filter(Role.name == rname).first()
            if not role:
                role = Role(id=uuid.uuid4(), name=rname, description=f"{rname.capitalize()} role")
                db.add(role)
                db.commit()
                db.refresh(role)
                logger.info(f"Seeded role: {rname}")
            roles[rname] = role

        # Seed Locations
        country = db.query(Country).filter(Country.code == "IN").first()
        if not country:
            country = Country(id=uuid.uuid4(), name="India", code="IN")
            db.add(country)
            db.commit()
            db.refresh(country)
            logger.info("Seeded Country: India")

        states = {}
        for sname in ["Tamil Nadu", "Karnataka", "Telangana"]:
            state = db.query(State).filter(State.name == sname).first()
            if not state:
                state = State(id=uuid.uuid4(), name=sname, country_id=country.id)
                db.add(state)
                db.commit()
                db.refresh(state)
                logger.info(f"Seeded State: {sname}")
            states[sname] = state

        cities = {}
        city_mappings = [
            ("Chennai", "Tamil Nadu"),
            ("Bengaluru", "Karnataka"),
            ("Hyderabad", "Telangana")
        ]
        for cname, sname in city_mappings:
            city = db.query(City).filter(City.name == cname).first()
            if not city:
                city = City(id=uuid.uuid4(), name=cname, state_id=states[sname].id)
                db.add(city)
                db.commit()
                db.refresh(city)
                logger.info(f"Seeded City: {cname}")
            cities[cname] = city

        # Seed Demo Users
        users = {}
        demo_users = [
            ("client@example.com", "client", "John Client"),
            ("artist@example.com", "artist", "Rhythm Collective Owner"),
            ("venue_owner@example.com", "venue_owner", "Skyline Owner"),
            ("admin@example.com", "admin", "System Admin")
        ]
        for email, rname, name in demo_users:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    id=uuid.uuid4(),
                    email=email,
                    password_hash=get_password_hash("password123"),
                    name=name,
                    is_active=True,
                    is_verified=True,
                    roles=[roles[rname]]
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                logger.info(f"Seeded User: {email} with role {rname}")
            users[email] = user

        # Seed Approved Artists
        artists_data = [
            ("Rhythm Collective", "artist@example.com", "rhythmcollective", "Energetic rock & pop band playing covers.", 25000.0, "Hyderabad", "Telangana", "5+ Members", 5),
            ("Arjun Acoustic", "arjun@example.com", "arjunacoustic", "Mellow acoustic melodies for quiet corporate/private spaces.", 12000.0, "Chennai", "Tamil Nadu", "Solo", 1),
            ("Neon Pulse", "neon@example.com", "neonpulse", "Synthwave and DJ live fusion performance.", 18000.0, "Bengaluru", "Karnataka", "Duo", 2)
        ]
        for name, email, display_name, bio, rate, city, state, band_type, members in artists_data:
            # Get or create user
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    id=uuid.uuid4(),
                    email=email,
                    password_hash=get_password_hash("password123"),
                    name=name,
                    is_active=True,
                    is_verified=True,
                    roles=[roles["artist"]]
                )
                db.add(user)
                db.commit()
                db.refresh(user)

            # Get or create artist profile
            profile = db.query(ArtistProfile).filter(ArtistProfile.user_id == user.id).first()
            if not profile:
                profile = ArtistProfile(
                    id=uuid.uuid4(),
                    user_id=user.id,
                    display_name=display_name,
                    bio=bio,
                    base_rate=rate,
                    rating=4.8,
                    verification_status="approved",
                    mobile_number="+919999988888",
                    years_of_experience=4,
                    band_type=band_type,
                    total_members=members,
                    city=city,
                    state=state,
                    currency="INR",
                    travel_radius=150.0,
                    travel_charges=2000.0,
                    min_booking_hours=2.0,
                    max_booking_hours=6.0,
                    equipment={"mic": True, "own_speaker": True},
                    gallery=["https://images.unsplash.com/photo-1501386761578-eac5c94b800a"],
                    videos=[],
                    youtube_links=["https://youtube.com/watch?v=demo"],
                    pricing_details={"hourly_rate": rate, "travel_charge": 2000.0}
                )
                db.add(profile)
                db.commit()
                logger.info(f"Seeded Artist Profile: {name} in {city}")

        # Seed Approved Venues
        venues_data = [
            ("Skyline Convention Hall", "venue_owner@example.com", "Grand banquet space for up to 800 people.", "100 Skyline Rd, OMR", "Chennai", 60000.0, 800, "Banquet Hall"),
            ("Garden Arena", "garden@example.com", "Lush outdoor open-air theater.", "22 Green Valley, Whitefield", "Bengaluru", 45000.0, 500, "Resort"),
            ("Urban Beat Studio", "urban@example.com", "Acoustically treated concert hall.", "5 High Street, Gachibowli", "Hyderabad", 35000.0, 250, "Concert Arena")
        ]
        for name, email, bio, address, city_name, base_price, cap, vtype in venues_data:
            # Get or create user
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    id=uuid.uuid4(),
                    email=email,
                    password_hash=get_password_hash("password123"),
                    name=name + " Owner",
                    is_active=True,
                    is_verified=True,
                    roles=[roles["venue_owner"]]
                )
                db.add(user)
                db.commit()
                db.refresh(user)

            # Get or create venue profile
            venue = db.query(Venue).filter(Venue.user_id == user.id).first()
            if not venue:
                venue = Venue(
                    id=uuid.uuid4(),
                    user_id=user.id,
                    name=name,
                    description=bio,
                    address=address,
                    city_id=cities[city_name].id,
                    base_price=base_price,
                    capacity=cap,
                    min_capacity=50,
                    venue_type=vtype,
                    business_name=name + " Ltd",
                    pincode="600001",
                    state=cities[city_name].state.name,
                    country="India",
                    verification_status="approved",
                    facilities=["sound_system", "parking", "green_room"],
                    gallery=["https://images.unsplash.com/photo-1519167758481-83f550bb49b3"],
                    pricing_details={"hourly_price": base_price / 10},
                    availability_rules={"weekdays": "9am-10pm", "weekend": "9am-12pm"}
                )
                db.add(venue)
                db.commit()
                logger.info(f"Seeded Venue Profile: {name} in {city_name}")

        logger.info("Demo database seeding completed successfully.")

    except Exception as e:
        db.rollback()
        logger.exception("Error seeding demo database")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed()
