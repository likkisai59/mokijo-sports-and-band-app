"""
CRUD operations for Band categories taxonomy.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.band_models import BandCategory


def get_categories(
    db: Session,
    type_: Optional[str] = None,
    is_active: Optional[bool] = True,
    skip: int = 0,
    limit: int = 100,
) -> List[BandCategory]:
    query = db.query(BandCategory)
    if type_:
        query = query.filter(BandCategory.type == type_)
    if is_active is not None:
        query = query.filter(BandCategory.is_active == is_active)
    return query.offset(skip).limit(limit).all()


def count_categories(
    db: Session,
    type_: Optional[str] = None,
    is_active: Optional[bool] = True,
) -> int:
    query = db.query(BandCategory)
    if type_:
        query = query.filter(BandCategory.type == type_)
    if is_active is not None:
        query = query.filter(BandCategory.is_active == is_active)
    return query.count()


def get_category_by_id(db: Session, category_id: int) -> Optional[BandCategory]:
    return db.query(BandCategory).filter(BandCategory.id == category_id).first()


def create_category(db: Session, name: str, type_: str, description: Optional[str] = None) -> BandCategory:
    category = BandCategory(
        name=name,
        type=type_,
        description=description,
        is_active=True,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category
