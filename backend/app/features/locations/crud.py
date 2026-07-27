"""
Database CRUD repository operations for locations hierarchy.
"""

from typing import Optional, Tuple, List
from sqlalchemy.orm import Session
from app.common.repositories.base import BaseRepository
from app.features.locations.models import Country, State, City, Area


class CountryCRUD(BaseRepository[Country]):
    def __init__(self):
        super().__init__(Country)

    def get_by_code(self, db: Session, code: str) -> Optional[Country]:
        return db.query(Country).filter(Country.code.ilike(code)).first()


class StateCRUD(BaseRepository[State]):
    def __init__(self):
        super().__init__(State)

    def get_states_by_country(self, db: Session, country_id: str) -> List[State]:
        return db.query(State).filter(State.country_id == country_id).order_by(State.name.asc()).all()


class CityCRUD(BaseRepository[City]):
    def __init__(self):
        super().__init__(City)

    def get_cities_by_state(self, db: Session, state_id: str) -> List[City]:
        return db.query(City).filter(City.state_id == state_id).order_by(City.name.asc()).all()


class AreaCRUD(BaseRepository[Area]):
    def __init__(self):
        super().__init__(Area)

    def get_filtered_areas(
        self,
        db: Session,
        search: Optional[str] = None,
        city_id: Optional[str] = None,
        limit: int = 10,
        offset: int = 0
    ) -> Tuple[List[Area], int]:
        """Fetch areas joining City, State, and Country tables for display grids."""
        query = db.query(Area).join(Area.city).join(City.state).join(State.country).filter(Area.deleted_at.is_(None))

        if search:
            query = query.filter(
                (Area.name.ilike(f"%{search}%")) |
                (Area.pincode.ilike(f"%{search}%")) |
                (City.name.ilike(f"%{search}%"))
            )

        if city_id and city_id != "all":
            query = query.filter(Area.city_id == city_id)

        total_count = query.count()
        results = query.order_by(Area.name.asc()).offset(offset).limit(limit).all()
        return results, total_count
