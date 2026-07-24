"""CRUD + business helpers for Band categories (unified taxonomy)."""

from sqlalchemy.orm import Session

from app.models.band_models import BandCategory


def list_categories(
    db: Session,
    search: str | None = None,
    type_filter: str | None = None,
    is_active: bool | None = None,
    limit: int = 100,
    offset: int = 0,
):
    q = db.query(BandCategory)
    if search:
        like = f"%{search.lower()}%"
        q = q.filter(BandCategory.name.ilike(like))
    if type_filter:
        q = q.filter(BandCategory.type == type_filter)
    if is_active is not None:
        q = q.filter(BandCategory.is_active == is_active)
    total = q.count()
    items = q.order_by(BandCategory.name.asc()).offset(offset).limit(limit).all()
    return items, total


def get_category(db: Session, category_id: int) -> BandCategory | None:
    return db.query(BandCategory).filter(BandCategory.id == category_id).first()


def create_category(db: Session, name: str, type_: str, description: str | None = None, is_active: bool = True) -> BandCategory:
    # Dedup by (name, type) case-insensitive — preserve reference behavior.
    existing = (
        db.query(BandCategory)
        .filter(BandCategory.name.ilike(name))
        .filter(BandCategory.type == type_)
        .first()
    )
    if existing:
        return existing
    cat = BandCategory(name=name, type=type_, description=description, is_active=is_active)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


def update_category(db: Session, cat: BandCategory, data: dict) -> BandCategory:
    for k, v in data.items():
        setattr(cat, k, v)
    db.commit()
    db.refresh(cat)
    return cat


def soft_delete_category(db: Session, cat: BandCategory) -> None:
    cat.is_active = False
    db.commit()
