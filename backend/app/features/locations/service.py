"""
Business logic service layers for Location Management.
"""

from sqlalchemy.orm import Session
from loguru import logger
from app.features.locations.crud import CountryCRUD, StateCRUD, CityCRUD, AreaCRUD
from app.features.locations.models import Country, State, City, Area
from app.features.locations.schemas import CountryCreate, StateCreate, CityCreate, AreaCreate, AreaUpdate
from app.core.exceptions import ConflictException, NotFoundException


class LocationService:
    """Service class for managing geographical location parameters."""

    def __init__(self):
        self.country_crud = CountryCRUD()
        self.state_crud = StateCRUD()
        self.city_crud = CityCRUD()
        self.area_crud = AreaCRUD()

    def create_country(self, db: Session, data: CountryCreate) -> Country:
        existing = self.country_crud.get_by_code(db, data.code)
        if existing:
            raise ConflictException(f"Country code {data.code} already exists.")
        
        country = self.country_crud.create(db, obj_in=data.model_dump())
        logger.info(f"Geographical Country registered: {country.name}")
        return country

    def create_state(self, db: Session, data: StateCreate) -> State:
        country = self.country_crud.get(db, data.country_id)
        if not country:
            raise NotFoundException("Country not found.")
            
        state = self.state_crud.create(db, obj_in=data.model_dump())
        logger.info(f"Geographical State registered: {state.name}")
        return state

    def create_city(self, db: Session, data: CityCreate) -> City:
        state = self.state_crud.get(db, data.state_id)
        if not state:
            raise NotFoundException("State not found.")
            
        city = self.city_crud.create(db, obj_in=data.model_dump())
        logger.info(f"Geographical City registered: {city.name}")
        return city

    def create_area(self, db: Session, data: AreaCreate) -> Area:
        city = self.city_crud.get(db, data.city_id)
        if not city:
            raise NotFoundException("City not found.")
            
        # Check area name and pincode combo uniqueness
        existing = db.query(Area).filter(
            Area.name.ilike(data.name),
            Area.pincode == data.pincode,
            Area.city_id == data.city_id,
            Area.deleted_at.is_(None)
        ).first()

        if existing:
            raise ConflictException(f"Area with name {data.name} and pincode {data.pincode} already exists in this city.")

        area = self.area_crud.create(db, obj_in=data.model_dump())
        logger.info(f"Geographical Area registered: {area.name} ({area.pincode})")
        return area

    def update_area(self, db: Session, area_id: str, data: AreaUpdate) -> Area:
        area = self.area_crud.get(db, area_id)
        if not area or area.deleted_at is not None:
            raise NotFoundException("Area not found.")

        update_dict = data.model_dump(exclude_unset=True)
        updated = self.area_crud.update(db, db_obj=area, obj_in=update_dict)
        logger.info(f"Area details updated: ID {area_id}")
        return updated

    def soft_delete_area(self, db: Session, area_id: str) -> None:
        area = self.area_crud.get(db, area_id)
        if not area or area.deleted_at is not None:
            raise NotFoundException("Area not found.")
            
        self.area_crud.remove(db, id=area_id)
        logger.info(f"Geographical Area soft-deleted: ID {area_id}")
