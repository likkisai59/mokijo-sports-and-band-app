"""
Generic SQLAlchemy Repository Base Class.
Provides standard CRUD methods out-of-the-box for domain entities.
"""

from typing import Any, Generic, List, Optional, Tuple, Type, TypeVar
from uuid import UUID
from sqlalchemy.orm import Session
from app.common.models.base import BaseModel

ModelType = TypeVar("ModelType", bound=BaseModel)

class BaseRepository(Generic[ModelType]):
    """
    Base Repository class containing default CRUD db operations.
    Acts as standard wrapper for database tables.
    """
    def __init__(self, model: Type[ModelType]):
        self.model = model

    def get(self, db: Session, id: Any) -> Optional[ModelType]:
        """
        Fetch a record by its UUID key, ignoring soft-deleted entries.
        Normalizes the id to either a UUID object (PostgreSQL) or string (SQLite)
        so that tests using an in-memory SQLite database work correctly.
        """
        import uuid as _uuid
        from sqlalchemy.dialects.postgresql import UUID as PG_UUID

        # If id is already a UUID object, preserve it for PostgreSQL.
        # For SQLite (which stores UUIDs as VARCHAR), we must use str().
        col_type = self.model.__table__.c["id"].type if hasattr(self.model, "__table__") else None
        if isinstance(col_type, PG_UUID):
            # PostgreSQL native UUID — keep as UUID object
            if isinstance(id, str):
                try:
                    id = _uuid.UUID(id)
                except (ValueError, AttributeError):
                    pass
        else:
            # SQLite or any other dialect — use plain string
            id = str(id)

        return db.query(self.model).filter(
            self.model.id == id,
            self.model.deleted_at.is_(None)
        ).first()


    def get_all(self, db: Session) -> List[ModelType]:
        """Fetch all records that are not soft-deleted."""
        return db.query(self.model).filter(self.model.deleted_at.is_(None)).all()

    def get_multi(
        self, db: Session, *, offset: int = 0, limit: int = 100
    ) -> Tuple[List[ModelType], int]:
        """Fetch paginated records list and total count metadata."""
        query = db.query(self.model).filter(self.model.deleted_at.is_(None))
        total = query.count()
        items = query.order_by(self.model.created_at.desc()).offset(offset).limit(limit).all()
        return items, total

    def create(self, db: Session, *, obj_in: Any) -> ModelType:
        """Saves a new object schema entry in database."""
        obj_data = obj_in.model_dump() if hasattr(obj_in, "model_dump") else dict(obj_in)
        db_obj = self.model(**obj_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, *, db_obj: ModelType, obj_in: Any) -> ModelType:
        """Updates fields of an existing database record object."""
        update_data = obj_in.model_dump(exclude_unset=True) if hasattr(obj_in, "model_dump") else dict(obj_in)
        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, id: UUID) -> Optional[ModelType]:
        """Soft-deletes a record from database by mapping timestamp."""
        obj = db.query(self.model).filter(self.model.id == id).first()
        if obj:
            obj.soft_delete()
            db.add(obj)
            db.commit()
            db.refresh(obj)
        return obj

    def hard_remove(self, db: Session, *, id: UUID) -> Optional[ModelType]:
        """Physically removes a record from database."""
        obj = db.query(self.model).filter(self.model.id == id).first()
        if obj:
            db.delete(obj)
            db.commit()
        return obj
