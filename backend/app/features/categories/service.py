"""
Business logic service layers for Category Taxonomy management.
"""

from sqlalchemy.orm import Session
from loguru import logger

from app.features.categories.crud import CategoryCRUD
from app.features.categories.models import Category
from app.features.categories.schemas import CategoryCreate, CategoryUpdate
from app.core.exceptions import ConflictException, NotFoundException


class CategoryService:
    """Business operations for managing system categories."""

    def __init__(self):
        self.crud = CategoryCRUD()

    def create_category(self, db: Session, data: CategoryCreate) -> Category:
        """Create a new taxonomy category. Prevents duplicate category name under same type."""
        existing = db.query(Category).filter(
            Category.name.ilike(data.name),
            Category.type == data.type,
            Category.deleted_at.is_(None)
        ).first()

        if existing:
            raise ConflictException(f"Category '{data.name}' already exists for type '{data.type}'.")

        category = self.crud.create(
            db,
            obj_in={
                "name": data.name,
                "type": data.type,
                "description": data.description,
                "is_active": data.is_active
            }
        )
        logger.info(f"Category taxonomy created: {data.type} -> {data.name}")
        return category

    def update_category(self, db: Session, category_id: str, data: CategoryUpdate) -> Category:
        """Updates category name, description, or activity flags."""
        category = self.crud.get(db, category_id)
        if not category or category.deleted_at is not None:
            raise NotFoundException("Category not found.")

        # Check name uniqueness if changed
        if data.name and data.name.lower() != category.name.lower():
            duplicate = db.query(Category).filter(
                Category.name.ilike(data.name),
                Category.type == category.type,
                Category.deleted_at.is_(None)
            ).first()
            if duplicate:
                raise ConflictException(f"Category name '{data.name}' conflicts with existing items.")

        update_dict = data.model_dump(exclude_unset=True)
        updated = self.crud.update(db, db_obj=category, obj_in=update_dict)
        logger.info(f"Category taxonomy updated: ID {category_id}")
        return updated

    def soft_delete_category(self, db: Session, category_id: str) -> None:
        """Soft-deletes a category taxonomy item."""
        category = self.crud.get(db, category_id)
        if not category or category.deleted_at is not None:
            raise NotFoundException("Category not found.")
        
        self.crud.remove(db, id=category_id)
        logger.info(f"Category taxonomy soft-deleted: ID {category_id}")
