"""
Database Base Model configuration.
Defines base class models with standard UUID keys and automatic auditing fields.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.core.database import Base

class BaseModel(Base):
    """
    Abstract Base Class for all database entities.
    Inherits from core SQLAlchemy Base declarative.
    """
    __abstract__ = True

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
    
    deleted_at = Column(
        DateTime(timezone=True),
        nullable=True,
        default=None
    )

    def soft_delete(self) -> None:
        """Flags record with deletion timestamp instead of physically removing it."""
        self.deleted_at = datetime.now()
