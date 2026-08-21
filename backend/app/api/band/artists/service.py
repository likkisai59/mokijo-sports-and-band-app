"""
Service layer for Band Artists discovery and profiles.
"""
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.api.band.artists import crud
from app.models.band_models import BandArtistProfile, BandAccount


def format_artist_dict(artist: BandArtistProfile) -> Dict[str, Any]:
    genres_list = [g.name for g in (artist.genres or [])]
    languages_list = [l.name for l in (artist.languages or [])]
    account_name = artist.account.name if artist.account else ""
    
    # Fallback images if null
    profile_img = artist.profile_image or "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80"
    cover_img = artist.cover_image or "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80"

    # Audio & video demos
    audio_demo = ""
    if isinstance(artist.social_links, dict):
        audio_demo = artist.social_links.get("demo_audio_url") or artist.social_links.get("audio_demo", "")
    
    video_demo = ""
    if artist.youtube_links and len(artist.youtube_links) > 0:
        video_demo = artist.youtube_links[0]

    pricing_dict = artist.pricing_details if isinstance(artist.pricing_details, dict) else {}
    hourly_rate_val = pricing_dict.get("hourly_rate", artist.base_rate * 0.35 if artist.base_rate else 15000.0)
    perf_mins = pricing_dict.get("performance_duration_mins", 120)

    equipment_str = ""
    if isinstance(artist.equipment, list):
        equipment_str = ", ".join([str(e) for e in artist.equipment])
    elif isinstance(artist.equipment, str):
        equipment_str = artist.equipment

    return {
        "id": artist.id,
        "account_id": artist.account_id,
        "display_name": artist.display_name or account_name or "Performer",
        "name": artist.display_name or account_name or "Performer",
        "username": artist.username or f"artist_{artist.id}",
        "bio": artist.bio or "Professional musical performer and live artist.",
        "base_rate": artist.base_rate,
        "base_price": artist.base_rate,
        "rating": artist.rating,
        "verification_status": artist.verification_status,
        "verification_notes": artist.verification_notes or "",
        "band_type": artist.band_type or "Solo",
        "total_members": artist.total_members or 1,
        "years_of_experience": artist.years_of_experience or 0,
        "profile_image": profile_img,
        "cover_image": cover_img,
        "currency": artist.currency or "INR",
        "travel_radius": artist.travel_radius or 50.0,
        "travel_radius_km": artist.travel_radius or 50.0,
        "travel_charges": artist.travel_charges or 0.0,
        "min_booking_hours": artist.min_booking_hours or 1.0,
        "max_booking_hours": artist.max_booking_hours or 6.0,
        "genres": genres_list or ["Rock", "Acoustic"],
        "genre": genres_list[0] if genres_list else "Live Music",
        "languages": languages_list or ["English", "Hindi", "Telugu"],
        "equipment": artist.equipment or ["Microphone", "Acoustic Guitar", "PA System"],
        "equipment_details": equipment_str or "6-channel mixer, 2 vocal wireless mics, 1 acoustic guitar",
        "social_links": artist.social_links or {},
        "demo_audio_url": audio_demo,
        "demo_video_url": video_demo,
        "gallery": artist.gallery or [
            profile_img,
            cover_img,
            "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80"
        ],
        "videos": artist.videos or [],
        "youtube_links": artist.youtube_links or ([video_demo] if video_demo else ["https://youtube.com"]),
        "pricing_details": {
            "hourly_rate": hourly_rate_val,
            "performance_duration_mins": perf_mins,
            "advance_percentage": pricing_dict.get("advance_percentage", 20),
            "cancellation_policy": pricing_dict.get("cancellation_policy", "Full refund before 48 hours."),
        },
        "hourly_rate": hourly_rate_val,
        "performance_duration_mins": perf_mins,
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


def get_my_artist_profile(db: Session, account: BandAccount) -> Dict[str, Any]:
    artist = crud.get_artist_by_account_id(db, account.id)
    if not artist:
        clean_username = f"{account.name.lower().replace(' ', '_')}_{account.id}"
        artist = BandArtistProfile(
            account_id=account.id,
            display_name=account.name,
            username=clean_username,
            verification_status="approved",
            base_rate=25000.0,
            rating=5.0,
            band_type="Band",
        )
        db.add(artist)
        db.commit()
        db.refresh(artist)
    return format_artist_dict(artist)


def update_my_artist_profile(db: Session, account: BandAccount, payload: Dict[str, Any]) -> Dict[str, Any]:
    artist = crud.get_artist_by_account_id(db, account.id)
    if not artist:
        clean_username = f"{account.name.lower().replace(' ', '_')}_{account.id}"
        artist = BandArtistProfile(
            account_id=account.id,
            display_name=account.name,
            username=clean_username,
            verification_status="approved",
            base_rate=25000.0,
            rating=5.0,
            band_type="Band",
        )
        db.add(artist)
        db.commit()
        db.refresh(artist)

    fields_to_update = {}

    # Display name & Account name sync
    if "display_name" in payload and payload["display_name"]:
        fields_to_update["display_name"] = str(payload["display_name"]).strip()
        account.name = fields_to_update["display_name"]
    elif "name" in payload and payload["name"]:
        fields_to_update["display_name"] = str(payload["name"]).strip()
        account.name = fields_to_update["display_name"]

    # Username validation & uniqueness
    if "username" in payload and payload["username"]:
        clean_u = str(payload["username"]).lstrip("@").strip().lower()
        if clean_u and clean_u != (artist.username or "").lower():
            existing = (
                db.query(BandArtistProfile)
                .filter(
                    BandArtistProfile.username.ilike(clean_u),
                    BandArtistProfile.id != artist.id,
                )
                .first()
            )
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This username handle is already taken. Please choose another.",
                )
            fields_to_update["username"] = clean_u

    if "bio" in payload:
        fields_to_update["bio"] = payload["bio"]

    if "band_type" in payload and payload["band_type"]:
        fields_to_update["band_type"] = payload["band_type"]

    # Base rate / Base price (Crucial!)
    if "base_rate" in payload and payload["base_rate"] is not None:
        try:
            fields_to_update["base_rate"] = float(payload["base_rate"])
        except (ValueError, TypeError):
            pass
    elif "base_price" in payload and payload["base_price"] is not None:
        try:
            fields_to_update["base_rate"] = float(payload["base_price"])
        except (ValueError, TypeError):
            pass

    if "profile_image" in payload and payload["profile_image"]:
        fields_to_update["profile_image"] = payload["profile_image"]

    if "cover_image" in payload and payload["cover_image"]:
        fields_to_update["cover_image"] = payload["cover_image"]

    if "travel_radius" in payload and payload["travel_radius"] is not None:
        try:
            fields_to_update["travel_radius"] = float(payload["travel_radius"])
        except (ValueError, TypeError):
            pass
    elif "travel_radius_km" in payload and payload["travel_radius_km"] is not None:
        try:
            fields_to_update["travel_radius"] = float(payload["travel_radius_km"])
        except (ValueError, TypeError):
            pass

    # Equipment
    if "equipment" in payload:
        if isinstance(payload["equipment"], list):
            fields_to_update["equipment"] = payload["equipment"]
        elif isinstance(payload["equipment"], str):
            fields_to_update["equipment"] = [
                item.strip() for item in payload["equipment"].split(",") if item.strip()
            ]
    elif "equipment_details" in payload:
        if isinstance(payload["equipment_details"], list):
            fields_to_update["equipment"] = payload["equipment_details"]
        elif isinstance(payload["equipment_details"], str):
            fields_to_update["equipment"] = [
                item.strip() for item in payload["equipment_details"].split(",") if item.strip()
            ]

    # Social links & audio demos
    social_dict = dict(artist.social_links) if isinstance(artist.social_links, dict) else {}
    if "social_links" in payload and isinstance(payload["social_links"], dict):
        social_dict.update(payload["social_links"])
    if "demo_audio_url" in payload:
        social_dict["demo_audio_url"] = payload["demo_audio_url"]
        social_dict["audio_demo"] = payload["demo_audio_url"]
    fields_to_update["social_links"] = social_dict

    # Video links
    if "demo_video_url" in payload and payload["demo_video_url"]:
        v_list = [payload["demo_video_url"]]
        fields_to_update["youtube_links"] = v_list
    elif "youtube_links" in payload and isinstance(payload["youtube_links"], list):
        fields_to_update["youtube_links"] = payload["youtube_links"]

    # Pricing details (hourly rate, duration, etc.)
    p_details = dict(artist.pricing_details) if isinstance(artist.pricing_details, dict) else {}
    if "hourly_rate" in payload and payload["hourly_rate"] is not None:
        try:
            p_details["hourly_rate"] = float(payload["hourly_rate"])
        except (ValueError, TypeError):
            pass
    if "performance_duration_mins" in payload and payload["performance_duration_mins"] is not None:
        try:
            p_details["performance_duration_mins"] = int(payload["performance_duration_mins"])
        except (ValueError, TypeError):
            pass
    if "base_rate" in fields_to_update:
        p_details["base_rate"] = fields_to_update["base_rate"]
    fields_to_update["pricing_details"] = p_details

    # Genres and Languages
    genres_input = payload.get("genres")
    if genres_input and isinstance(genres_input, str):
        genres_input = [g.strip() for g in genres_input.split(",") if g.strip()]

    languages_input = payload.get("languages")
    if languages_input and isinstance(languages_input, str):
        languages_input = [l.strip() for l in languages_input.split(",") if l.strip()]

    updated_artist = crud.update_artist_profile(
        db=db,
        artist=artist,
        fields=fields_to_update,
        genres=genres_input,
        languages=languages_input,
    )
    return format_artist_dict(updated_artist)


def submit_for_verification(db: Session, account: BandAccount) -> Dict[str, Any]:
    artist = crud.get_artist_by_account_id(db, account.id)
    if not artist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artist profile not found",
        )
    artist.verification_status = "pending"
    db.commit()
    db.refresh(artist)
    return {
        "status": "pending",
        "message": "Artist profile submitted for admin verification successfully.",
    }
