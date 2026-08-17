"""
Service layer for Band Venues discovery and profiles.
"""
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.api.band.venues import crud
from app.models.band_models import BandVenue


def format_venue_dict(venue: BandVenue) -> Dict[str, Any]:
    categories_list = [c.name for c in (venue.categories or [])]
    city_name = venue.city.name if venue.city else (venue.state or "Hyderabad")
    venue_code = f"BCV-{venue.id:06d}"
    
    gallery_list = venue.gallery if (venue.gallery and len(venue.gallery) > 0) else [
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80"
    ]

    return {
        "id": venue.id,
        "venue_number": venue_code,
        "name": venue.name,
        "business_name": venue.business_name or venue.name,
        "description": venue.description or "Premier live performance, concert, and acoustic venue.",
        "address": venue.address,
        "city": city_name,
        "state": venue.state or "Telangana",
        "pincode": venue.pincode or "500081",
        "google_map_location": venue.google_map_location or "https://maps.google.com",
        "venue_type": venue.venue_type or "Concert Hall",
        "capacity": venue.capacity or 250,
        "min_capacity": venue.min_capacity or 50,
        "base_price": venue.base_price or 35000.0,
        "rating": 4.8,
        "verification_status": venue.verification_status,
        "facilities": venue.facilities or ["Pro Sound PA", "Stage Lighting", "Green Room", "Acoustic Walls", "Valet Parking", "Air Conditioning"],
        "gallery": gallery_list,
        "cover_image": gallery_list[0],
        "categories": categories_list or ["Auditorium", "Lounge", "Live Club"],
        "contact_details": venue.contact_details or "venue@bandconnect.in",
        "pricing_details": venue.pricing_details or {
            "per_slot_rate": venue.base_price,
            "security_deposit": 10000.0,
            "cleaning_fee": 2500.0
        },
        "availability_rules": venue.availability_rules or {
            "operating_hours": "10:00 AM - 11:30 PM",
            "sound_curfew": "10:00 PM"
        }
    }


def list_venues(
    db: Session,
    query: Optional[str] = None,
    city: Optional[str] = None,
    venue_type: Optional[str] = None,
    min_capacity: Optional[int] = None,
    max_capacity: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: str = "recommended",
    skip: int = 0,
    limit: int = 50,
) -> Dict[str, Any]:
    items, total = crud.get_venues(
        db,
        query=query,
        city=city,
        venue_type=venue_type,
        min_capacity=min_capacity,
        max_capacity=max_capacity,
        min_price=min_price,
        max_price=max_price,
        verification_status="approved",
        sort_by=sort_by,
        skip=skip,
        limit=limit,
    )

    if total == 0:
        mock_venues = [
            {
                "id": 201,
                "venue_number": "BCV-000201",
                "name": "The Velvet Amphitheater",
                "business_name": "Velvet Hospitality Spaces",
                "description": "State-of-the-art live performance auditorium with concert acoustics, moving head stage lighting, and VIP hospitality lounge.",
                "address": "Road No. 36, Jubilee Hills",
                "city": "Hyderabad",
                "state": "Telangana",
                "pincode": "500033",
                "google_map_location": "https://maps.google.com",
                "venue_type": "Amphitheater",
                "capacity": 450,
                "min_capacity": 100,
                "base_price": 55000.0,
                "rating": 4.9,
                "verification_status": "approved",
                "facilities": ["Pro Sound System", "Motorized Stage Rigging", "2 VIP Green Rooms", "Full Backline Amps", "Central Air Conditioning", "Dedicated Parking (150 Cars)"],
                "gallery": [
                    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80"
                ],
                "cover_image": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
                "categories": ["Concert Hall", "Auditorium", "Live Music Club"],
                "pricing_details": {"per_slot_rate": 55000.0, "security_deposit": 15000.0}
            },
            {
                "id": 202,
                "venue_number": "BCV-000202",
                "name": "Skyline Rooftop Lounge",
                "business_name": "Skyline Urban Spaces",
                "description": "Open-air panoramic rooftop arena tailored for sunset unplugged sessions, jazz evenings, and boutique brand launches.",
                "address": "Financial District, Gachibowli",
                "city": "Hyderabad",
                "state": "Telangana",
                "pincode": "500032",
                "google_map_location": "https://maps.google.com",
                "venue_type": "Rooftop Lounge",
                "capacity": 200,
                "min_capacity": 40,
                "base_price": 38000.0,
                "rating": 4.7,
                "verification_status": "approved",
                "facilities": ["Ambient LED Warm Lighting", "Bose Array Sound System", "Cocktail Bar", "Valet Service", "Elevator Access"],
                "gallery": [
                    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80"
                ],
                "cover_image": "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80",
                "categories": ["Rooftop", "Lounge", "Acoustic Hub"],
                "pricing_details": {"per_slot_rate": 38000.0, "security_deposit": 10000.0}
            },
            {
                "id": 203,
                "venue_number": "BCV-000203",
                "name": "Echo Underground Club",
                "business_name": "Echo Nightlife Ventures",
                "description": "Underground indie & rock sanctuary equipped with heavy subwoofers, dark industrial aesthetics, and specialized stage isolation.",
                "address": "Indiranagar 100ft Road",
                "city": "Bengaluru",
                "state": "Karnataka",
                "pincode": "560038",
                "google_map_location": "https://maps.google.com",
                "venue_type": "Club & Bar",
                "capacity": 300,
                "min_capacity": 60,
                "base_price": 42000.0,
                "rating": 4.8,
                "verification_status": "approved",
                "facilities": ["Heavy Bass Acoustic Setup", "DMX Strobe Rig", "Artist Dressing Suite", "Bar Catering Setup"],
                "gallery": [
                    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80"
                ],
                "cover_image": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80",
                "categories": ["Club", "Indie Rock Hub"],
                "pricing_details": {"per_slot_rate": 42000.0, "security_deposit": 12000.0}
            }
        ]
        return {"items": mock_venues, "total": len(mock_venues)}

    return {
        "items": [format_venue_dict(v) for v in items],
        "total": total,
    }


def get_venue_detail(db: Session, identifier: str) -> Optional[Dict[str, Any]]:
    clean_id = identifier.replace("BCV-", "").replace("bcv-", "").lstrip("0")
    if clean_id.isdigit():
        venue = crud.get_venue_by_id(db, int(clean_id))
        if venue:
            return format_venue_dict(venue)

    if identifier in ("201", "BCV-000201"):
        res = list_venues(db)
        for item in res["items"]:
            if item["id"] == 201:
                return item
    elif identifier in ("202", "BCV-000202"):
        res = list_venues(db)
        for item in res["items"]:
            if item["id"] == 202:
                return item
    elif identifier in ("203", "BCV-000203"):
        res = list_venues(db)
        for item in res["items"]:
            if item["id"] == 203:
                return item

    return None
