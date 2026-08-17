"""Band Auth CRUD layer — database operations for BandAccount."""

from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.band_models import BandAccount
from app.core.security import get_password_hash


def get_account_by_email(db: Session, email: str) -> Optional[BandAccount]:
    """Retrieve an active BandAccount by email address."""
    return (
        db.query(BandAccount)
        .filter(BandAccount.email.ilike(email.strip()))
        .filter(BandAccount.deleted_at.is_(None))
        .first()
    )


def get_account_by_id(db: Session, account_id: int) -> Optional[BandAccount]:
    """Retrieve an active BandAccount by ID."""
    return (
        db.query(BandAccount)
        .filter(BandAccount.id == account_id)
        .filter(BandAccount.deleted_at.is_(None))
        .first()
    )


def create_account(
    db: Session,
    email: str,
    password: str,
    name: str,
    role: str = "client",
    phone: Optional[str] = None,
    is_verified: bool = True,
) -> BandAccount:
    """Create and persist a new BandAccount with direct password hashing."""
    hashed_pwd = get_password_hash(password)
    account = BandAccount(
        email=email.strip().lower(),
        password_hash=hashed_pwd,
        name=name.strip(),
        role=role,
        phone=phone.strip() if phone else None,
        is_active=True,
        is_verified=is_verified,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


def update_password(db: Session, account: BandAccount, new_password: str) -> BandAccount:
    """Update password hash for a BandAccount."""
    account.password_hash = get_password_hash(new_password)
    account.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(account)
    return account


def soft_delete_account(db: Session, account: BandAccount) -> None:
    """Soft-delete a BandAccount."""
    account.deleted_at = datetime.utcnow()
    account.is_active = False
    db.commit()


def list_accounts(
    db: Session,
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    limit: int = 50,
    offset: int = 0,
) -> Tuple[List[BandAccount], int]:
    """List accounts for administrative governance with search and filters."""
    query = db.query(BandAccount).filter(BandAccount.deleted_at.is_(None))
    if search:
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            (BandAccount.name.ilike(term)) | (BandAccount.email.ilike(term))
        )
    if role:
        query = query.filter(BandAccount.role == role)
    if is_active is not None:
        query = query.filter(BandAccount.is_active == is_active)

    total = query.count()
    items = query.order_by(BandAccount.created_at.desc()).offset(offset).limit(limit).all()
    return items, total
