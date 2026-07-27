"""
Database models for geographical Location Management.
Maps countries, states, cities, areas, service radius limits, and pincodes.
"""

from sqlalchemy import Column, String, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.common.models.base import BaseModel


class Country(BaseModel):
    """Country entity (e.g. India)."""
    __tablename__ = "countries"

    name = Column(String(100), unique=True, nullable=False, index=True)
    code = Column(String(10), unique=True, nullable=False, index=True)  # IN, US

    states = relationship("State", back_populates="country", cascade="all, delete-orphan")


class State(BaseModel):
    """State entity (e.g. Karnataka)."""
    __tablename__ = "states"

    name = Column(String(100), nullable=False, index=True)
    country_id = Column(UUID(as_uuid=True), ForeignKey("countries.id", ondelete="CASCADE"), nullable=False, index=True)

    country = relationship("Country", back_populates="states")
    cities = relationship("City", back_populates="state", cascade="all, delete-orphan")


class City(BaseModel):
    """City entity (e.g. Bengaluru)."""
    __tablename__ = "cities"

    name = Column(String(100), nullable=False, index=True)
    state_id = Column(UUID(as_uuid=True), ForeignKey("states.id", ondelete="CASCADE"), nullable=False, index=True)

    state = relationship("State", back_populates="cities")
    areas = relationship("Area", back_populates="city", cascade="all, delete-orphan")


class Area(BaseModel):
    """Granular area within a city (e.g. Indiranagar), including service radius and pincodes."""
    __tablename__ = "areas"

    name = Column(String(100), nullable=False, index=True)
    pincode = Column(String(20), nullable=False, index=True)
    city_id = Column(UUID(as_uuid=True), ForeignKey("cities.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Coordinate parameters for mapping and search radius calculations
    latitude = Column(Numeric(10, 8), nullable=True)
    longitude = Column(Numeric(11, 8), nullable=True)
    service_radius = Column(Numeric(10, 2), default=50.0, nullable=False)  # in km

    city = relationship("City", back_populates="areas")
