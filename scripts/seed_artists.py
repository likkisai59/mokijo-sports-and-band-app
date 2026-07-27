#!/usr/bin/env python3
"""
Seed dummy approved performer profiles for marketplace demo.

Creates:
  1. Arjun Kumar  — Solo Singer, Pop/Melody,  Chennai,    ₹3,500/hr, rating 4.8
  2. Thunder Beats — Band (5 members), Rock,  Bengaluru, ₹15,000/hr, rating 4.9
  3. Melody Crew  — Band (6 members), Bollywood/Fusion, Hyderabad, ₹12,000/hr, rating 4.7

All three are created with:
  - verification_status = 'approved'
  - user.is_active = True
  - user.is_verified = True

Usage (from repo root with backend venv activated):
    python scripts/seed_artists.py

Idempotent: skips creation if the artist email already exists.
"""

import os
import sys

# Ensure backend modules are importable from the repo root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.features.auth.crud import UserCRUD, RoleCRUD
from app.features.artists.models import ArtistProfile
from app.features.categories.models import Category

user_crud = UserCRUD()
role_crud = RoleCRUD()


PERFORMERS = [
    {
        "email": "arjun.kumar@demo.bandconnect.dev",
        "password": "Demo@1234!",
        "name": "Arjun Kumar",
        "display_name": "Arjun Kumar",
        "bio": (
            "Professional solo singer with 5 years of stage experience across "
            "Chennai and Tamil Nadu. Specialises in Pop and Melody, performing at "
            "weddings, corporate events, and private parties."
        ),
        "band_type": "Solo",
        "total_members": 1,
        "city": "Chennai",
        "state": "Tamil Nadu",
        "base_rate": 3500.0,
        "rating": 4.8,
        "years_of_experience": 5,
        "genres": ["Pop", "Melody"],
        "languages": ["Tamil", "English"],
        "username": "arjun_kumar_music",
    },
    {
        "email": "thunder.beats@demo.bandconnect.dev",
        "password": "Demo@1234!",
        "name": "Thunder Beats",
        "display_name": "Thunder Beats",
        "bio": (
            "A high-energy 5-member Rock band from Bengaluru delivering electrifying "
            "performances for 8 years. Known for powerful stage presence and versatile "
            "Rock repertoire at concerts, festivals, and corporate gigs."
        ),
        "band_type": "5+ Members",
        "total_members": 5,
        "city": "Bengaluru",
        "state": "Karnataka",
        "base_rate": 15000.0,
        "rating": 4.9,
        "years_of_experience": 8,
        "genres": ["Rock"],
        "languages": ["English", "Kannada"],
        "username": "thunder_beats_band",
    },
    {
        "email": "melody.crew@demo.bandconnect.dev",
        "password": "Demo@1234!",
        "name": "Melody Crew",
        "display_name": "Melody Crew",
        "bio": (
            "A vibrant 6-member ensemble from Hyderabad blending Bollywood chartbusters "
            "with Fusion sounds for 6 years. Perfect for weddings, sangeet nights, "
            "and cultural celebrations."
        ),
        "band_type": "5+ Members",
        "total_members": 6,
        "city": "Hyderabad",
        "state": "Telangana",
        "base_rate": 12000.0,
        "rating": 4.7,
        "years_of_experience": 6,
        "genres": ["Bollywood", "Fusion"],
        "languages": ["Hindi", "Telugu", "English"],
        "username": "melody_crew_official",
    },
]


def get_or_create_genre(db, name: str) -> Category:
    """Return an existing music_genre category or create a new one."""
    cat = db.query(Category).filter(
        Category.name == name,
        Category.type == "music_genre",
    ).first()
    if not cat:
        cat = Category(name=name, type="music_genre", is_active=True)
        db.add(cat)
        db.flush()
        print(f"  [+] Created genre category: {name}")
    return cat


def get_or_create_language(db, name: str) -> Category:
    """Return an existing language category or create a new one."""
    cat = db.query(Category).filter(
        Category.name == name,
        Category.type == "language",
    ).first()
    if not cat:
        cat = Category(name=name, type="language", is_active=True)
        db.add(cat)
        db.flush()
        print(f"  [+] Created language category: {name}")
    return cat


def seed_performers() -> None:
    db = SessionLocal()
    try:
        # Ensure 'artist' role exists
        role = role_crud.get_by_name(db, "artist")
        if not role:
            role = role_crud.create(
                db,
                obj_in={"name": "artist", "description": "Performer / Band role"},
            )
            print("[+] Created role: artist")
        else:
            print("[i] Role 'artist' already exists.")

        for p in PERFORMERS:
            print(f"\n--- Processing: {p['name']} ---")

            # Idempotency check
            existing_user = user_crud.get_by_email(db, p["email"])
            if existing_user:
                print(f"[i] User {p['email']} already exists — skipping.")
                continue

            # 1. Create User
            hashed_pw = get_password_hash(p["password"])
            user = user_crud.create(
                db,
                obj_in={
                    "email": p["email"],
                    "password_hash": hashed_pw,
                    "name": p["name"],
                    "is_active": True,
                    "is_verified": True,
                },
            )
            user.roles.append(role)
            db.flush()
            print(f"[+] Created user: {user.email} (id={user.id})")

            # 2. Resolve genre categories
            genre_objs = [get_or_create_genre(db, g) for g in p["genres"]]

            # 3. Resolve language categories
            lang_objs = [get_or_create_language(db, l) for l in p["languages"]]

            # 4. Create ArtistProfile directly (approved status)
            artist = ArtistProfile(
                user_id=user.id,
                display_name=p["display_name"],
                bio=p["bio"],
                band_type=p["band_type"],
                total_members=p["total_members"],
                city=p["city"],
                state=p["state"],
                base_rate=p["base_rate"],
                rating=p["rating"],
                years_of_experience=p["years_of_experience"],
                currency="INR",
                verification_status="approved",
                username=p["username"],
                travel_radius=0.0,
                travel_charges=0.0,
                min_booking_hours=2.0,
                max_booking_hours=8.0,
                equipment={},
                availability={},
                social_links={},
                achievements=[],
                gallery=[],
                videos=[],
                youtube_links=[],
                instagram_reels=[],
                documents=[],
                pricing_details={
                    "hourly_rate": p["base_rate"],
                    "travel_charge": 0.0,
                },
            )
            artist.genres = genre_objs
            artist.languages = lang_objs
            db.add(artist)
            db.flush()
            print(
                f"[+] Created artist profile: {p['display_name']} "
                f"({p['band_type']}, {p['city']}, INR {p['base_rate']}/hr, "
                f"status=approved, rating={p['rating']})"
            )

        db.commit()
        print("\n[OK] All performers seeded successfully.")

    except Exception as exc:
        db.rollback()
        print(f"\n[ERROR] Seeding failed - rolled back. Detail: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_performers()
