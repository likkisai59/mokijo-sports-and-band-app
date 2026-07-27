"""
Database CRUD operations for Categories taxonomy.
"""

from typing import Optional, Tuple, List
from sqlalchemy.orm import Session
from app.common.repositories.base import BaseRepository
from app.features.categories.models import Category


class CategoryCRUD(BaseRepository[Category]):
    """Repository operations for Category taxonomies."""

    def __init__(self):
        super().__init__(Category)

    def get_filtered_categories(
        self,
        db: Session,
        search: Optional[str] = None,
        type_filter: Optional[str] = None,
        is_active: Optional[bool] = None,
        limit: int = 10,
        offset: int = 0
    ) -> Tuple[List[Category], int]:
        """Fetch categories matching search criteria, type discriminator, active toggle, and offsets pagination."""
        query = db.query(Category).filter(Category.deleted_at.is_(None))

        if search:
            query = query.filter(
                (Category.name.ilike(f"%{search}%")) |
                (Category.description.ilike(f"%{search}%"))
            )

        if type_filter and type_filter != "all":
            query = query.filter(Category.type == type_filter)

        if is_active is not None:
            query = query.filter(Category.is_active == is_active)

        total_count = query.count()
        results = query.order_by(Category.name.asc()).offset(offset).limit(limit).all()
        return results, total_count
