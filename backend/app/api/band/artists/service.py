"""
Service layer for Band Artists discovery and profiles.
"""
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.api.band.artists import crud
from app.models.band_models import BandArtistProfile


def format_artist_dict(artist: BandArtistProfile) -> Dict[str, Any]:
    genres_list = [g.name for g in (artist.genres or [])]
    languages_list = [l.name for l in (artist.languages or [])]
    account_name = artist.account.name if artist.account else ""
    
    # Fallback images if null
    profile_img = artist.profile_image or "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80"
    cover_img = artist.cover_image or "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80"

    return {
        "id": artist.id,
        "account_id": artist.account_id,
        "display_name": artist.display_name or account_name or "Performer",
        "username": artist.username or f"artist_{artist.id}",
        "bio": artist.bio or "Professional musical performer and live artist.",
        "base_rate": artist.base_rate,
        "rating": artist.rating,
        "verification_status": artist.verification_status,
        "band_type": artist.band_type or "Solo",
        "total_members": artist.total_members or 1,
        "years_of_experience": artist.years_of_experience or 0,
        "profile_image": profile_img,
        "cover_image": cover_img,
        "currency": artist.currency or "INR",
        "travel_radius": artist.travel_radius or 50.0,
        "travel_charges": artist.travel_charges or 0.0,
        "min_booking_hours": artist.min_booking_hours or 1.0,
        "max_booking_hours": artist.max_booking_hours or 6.0,
        "genres": genres_list or ["Rock", "Acoustic"],
        "languages": languages_list or ["English", "Hindi", "Telugu"],
        "equipment": artist.equipment or ["Microphone", "Acoustic Guitar", "PA System"],
        "social_links": artist.social_links or {},
        "gallery": artist.gallery or [
            profile_img,
            cover_img,
            "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80"
        ],
        "videos": artist.videos or [],
        "youtube_links": artist.youtube_links or ["https://youtube.com"],
        "pricing_details": artist.pricing_details or {
            "hourly_rate": artist.base_rate,
            "advance_percentage": 20,
            "cancellation_policy": "Full refund before 48 hours."
        }
    }


def list_artists(
    db: Session,
    query: Optional[str] = None,
    genre: Optional[str] = None,
    language: Optional[str] = None,
    band_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    sort_by: str = "rating_desc",
    skip: int = 0,
    limit: int = 50,
) -> Dict[str, Any]:
    items, total = crud.get_artists(
        db,
        query=query,
        genre=genre,
        language=language,
        band_type=band_type,
        min_price=min_price,
        max_price=max_price,
        min_rating=min_rating,
        verification_status="approved",
        sort_by=sort_by,
        skip=skip,
        limit=limit,
    )
    
    # If no artists in DB yet, provide realistic mock showcase
    if total == 0:
        mock_artists = [
            {
                "id": 101,
                "account_id": 1,
                "display_name": "The Deccan Strings",
                "username": "deccanstrings",
                "bio": "Premier acoustic & fusion band based in Hyderabad. Specializing in Telugu & Bollywood hits with acoustic cello and guitars.",
                "base_rate": 25000.0,
                "rating": 4.9,
                "verification_status": "approved",
                "band_type": "Band",
                "total_members": 4,
                "years_of_experience": 6,
                "profile_image": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
                "cover_image": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80",
                "currency": "INR",
                "travel_radius": 100.0,
                "travel_charges": 2000.0,
                "min_booking_hours": 2.0,
                "max_booking_hours": 5.0,
                "genres": ["Fusion", "Acoustic", "Pop"],
                "languages": ["Telugu", "Hindi", "English"],
                "equipment": ["Wireless Mics", "Acoustic Drumkit", "Guitar Amps", "Sound Console"],
                "social_links": {"instagram": "@deccanstrings", "youtube": "deccanstrings"},
                "gallery": [
                    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80"
                ],
                "pricing_details": {"hourly_rate": 25000.0, "advance_percentage": 25}
            },
            {
                "id": 102,
                "account_id": 2,
                "display_name": "Rhea Chakraborty Live",
                "username": "rheasings",
                "bio": "Soulful playback singer and indie-pop vocalist for weddings, club gigs, and corporate galas.",
                "base_rate": 18000.0,
                "rating": 4.8,
                "verification_status": "approved",
                "band_type": "Solo",
                "total_members": 1,
                "years_of_experience": 5,
                "profile_image": "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80",
                "cover_image": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80",
                "currency": "INR",
                "travel_radius": 75.0,
                "travel_charges": 1500.0,
                "min_booking_hours": 1.5,
                "max_booking_hours": 4.0,
                "genres": ["Bollywood", "Indie Pop", "Sufi"],
                "languages": ["Hindi", "English"],
                "equipment": ["Sennheiser Wireless Mic", "In-Ear Monitors"],
                "social_links": {"instagram": "@rheasings"},
                "gallery": [
                    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80"
                ],
                "pricing_details": {"hourly_rate": 18000.0, "advance_percentage": 20}
            },
            {
                "id": 103,
                "account_id": 3,
                "display_name": "Groove Syndicate",
                "username": "groovesyndicate",
                "bio": "High-energy 5-piece rock & funk ensemble delivering electrifying concert and arena performances.",
                "base_rate": 45000.0,
                "rating": 5.0,
                "verification_status": "approved",
                "band_type": "Band",
                "total_members": 5,
                "years_of_experience": 8,
                "profile_image": "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop&q=80",
                "cover_image": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80",
                "currency": "INR",
                "travel_radius": 200.0,
                "travel_charges": 5000.0,
                "min_booking_hours": 2.0,
                "max_booking_hours": 6.0,
                "genres": ["Rock", "Funk", "Classic Rock"],
                "languages": ["English", "Hindi"],
                "equipment": ["Full Drumkit", "Marshall Stacks", "Bass Rig", "Stage Lighting"],
                "social_links": {"instagram": "@groovesyndicate"},
                "gallery": [
                    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop&q=80"
                ],
                "pricing_details": {"hourly_rate": 45000.0, "advance_percentage": 30}
            }
        ]
        return {"items": mock_artists, "total": len(mock_artists)}

    return {
        "items": [format_artist_dict(a) for a in items],
        "total": total,
    }


def get_artist_detail(db: Session, identifier: str) -> Optional[Dict[str, Any]]:
    # Identifier can be integer ID or username string
    artist = None
    if identifier.isdigit():
        artist = crud.get_artist_by_id(db, int(identifier))
    if not artist:
        artist = crud.get_artist_by_username(db, identifier)
    
    if artist:
        return format_artist_dict(artist)
    
    # Fallback to mock item if searching mock ID
    if identifier in ("101", "deccanstrings"):
        all_res = list_artists(db)
        for item in all_res["items"]:
            if item["id"] == 101 or item["username"] == "deccanstrings":
                return item
    elif identifier in ("102", "rheasings"):
        all_res = list_artists(db)
        for item in all_res["items"]:
            if item["id"] == 102 or item["username"] == "rheasings":
                return item
    elif identifier in ("103", "groovesyndicate"):
        all_res = list_artists(db)
        for item in all_res["items"]:
            if item["id"] == 103 or item["username"] == "groovesyndicate":
                return item

    return None
