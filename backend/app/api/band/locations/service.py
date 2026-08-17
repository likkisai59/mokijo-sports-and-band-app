"""
Service for Band Locations.
"""
from typing import List
from sqlalchemy.orm import Session
from app.api.band.locations import crud


def get_popular_cities(db: Session) -> List[dict]:
    return crud.get_popular_locations(db)
