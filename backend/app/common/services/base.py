"""
Base Service Layer Class.
Acts as a bridge between Routers and Repositories, managing business validation rules.
"""

from typing import Any, Generic, List, Tuple, TypeVar
from uuid import UUID
from sqlalchemy.orm import Session
from app.common.repositories.base import BaseRepository
from app.common.models.base import BaseModel
from app.core.exceptions import NotFoundException

ModelType = TypeVar("ModelType", bound=BaseModel)
RepoType = TypeVar("RepoType", bound=BaseRepository)

class BaseService(Generic[ModelType, RepoType]):
    """
    Generic Service class mapping typical CRUD methods to repositories.
    Subclasses should override these or add domain-specific business validation rules.
    """
    def __init__(self, repository: RepoType):
        self.repository = repository

    def get_by_id(self, db: Session, id: UUID) -> ModelType:
        """Fetches a single record, raising NotFoundException if missing."""
        obj = self.repository.get(db, id)
        if not obj:
            raise NotFoundException(f"Resource with ID {id} not found.")
        return obj

    def list_all(self, db: Session) -> List[ModelType]:
        """Fetches all non-deleted records."""
        return self.repository.get_all(db)

    def list_paginated(
        self, db: Session, *, page: int = 1, page_size: int = 10
    ) -> Tuple[List[ModelType], int]:
        """Fetches paginated list based on offsets calculation."""
        offset = (page - 1) * page_size
        return self.repository.get_multi(db, offset=offset, limit=page_size)

    def create_record(self, db: Session, *, obj_in: Any) -> ModelType:
        """Processes and saves a new record."""
        return self.repository.create(db, obj_in=obj_in)

    def update_record(self, db: Session, *, id: UUID, obj_in: Any) -> ModelType:
        """Fetches and updates fields of an existing record."""
        db_obj = self.get_by_id(db, id)
        return self.repository.update(db, db_obj=db_obj, obj_in=obj_in)

    def delete_record(self, db: Session, *, id: UUID) -> ModelType:
        """Soft-deletes a record, returning the modified record object."""
        _db_obj = self.get_by_id(db, id)
        return self.repository.remove(db, id=id)
