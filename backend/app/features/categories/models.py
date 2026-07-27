"""
Database models for unified Category / Taxonomy management.
Supports music genres, languages, event types, band types, equipments, and venue categories.
"""

from sqlalchemy import Column, String, Boolean
from app.common.models.base import BaseModel


class Category(BaseModel):
    """Unified categories taxonomy entity."""
    __tablename__ = "categories"

    name = Column(String(100), nullable=False, index=True)
    type = Column(String(50), nullable=False, index=True)  # music_genre, language, event_type, etc.
    description = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
