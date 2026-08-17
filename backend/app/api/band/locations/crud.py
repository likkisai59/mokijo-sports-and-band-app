"""
CRUD operations for Band Locations (Cities, States, Areas).
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.band_models import BandCity, BandState, BandArea


def get_cities(db: Session, skip: int = 0, limit: int = 100) -> List[BandCity]:
    return db.query(BandCity).offset(skip).limit(limit).all()


def get_popular_locations(db: Session) -> List[dict]:
    cities = db.query(BandCity).limit(20).all()
    if not cities:
        # Return fallback cities for discovery
        return [
            {"id": 1, "name": "Hyderabad", "state": "Telangana"},
            {"id": 2, "name": "Bengaluru", "state": "Karnataka"},
            {"id": 3, "name": "Mumbai", "state": "Maharashtra"},
            {"id": 4, "name": "Delhi NCR", "state": "Delhi"},
            {"id": 5, "name": "Chennai", "state": "Tamil Nadu"},
            {"id": 6, "name": "Goa", "state": "Goa"},
        ]
    return [{"id": c.id, "name": c.name, "state_id": c.state_id} for c in cities]
