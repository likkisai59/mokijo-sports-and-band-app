"""
FastAPI Router for Band Locations.
"""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.band.locations import service

router = APIRouter(prefix="/band/locations", tags=["Band Locations"])


@router.get("/cities", response_model=List[Dict[str, Any]], summary="Get popular cities for discovery search")
def get_cities(db: Session = Depends(get_db)):
    return service.get_popular_cities(db)
