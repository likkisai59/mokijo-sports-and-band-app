from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.band_models import BandPromoCode


def get_promo_by_code(db: Session, code: str) -> Optional[BandPromoCode]:
    return db.query(BandPromoCode).filter(BandPromoCode.code == code.upper().strip()).first()


def list_promos(db: Session, active_only: bool = False) -> List[BandPromoCode]:
    query = db.query(BandPromoCode)
    if active_only:
        query = query.filter(BandPromoCode.is_active == True)
    return query.order_by(BandPromoCode.created_at.desc()).all()


def create_promo(
    db: Session,
    code: str,
    discount_type: str,
    discount_value: float,
    min_order_amount: float = 0.0,
    max_discount_cap: Optional[float] = None,
    max_uses: int = 100,
    description: Optional[str] = None,
    expires_at: Optional[datetime] = None,
) -> BandPromoCode:
    promo = BandPromoCode(
        code=code.upper().strip(),
        description=description,
        discount_type=discount_type,
        discount_value=discount_value,
        min_order_amount=min_order_amount,
        max_discount_cap=max_discount_cap,
        max_uses=max_uses,
        expires_at=expires_at,
        is_active=True,
        created_at=datetime.utcnow(),
    )
    db.add(promo)
    db.commit()
    db.refresh(promo)
    return promo


def toggle_promo_active(db: Session, promo_id: int) -> Optional[BandPromoCode]:
    promo = db.query(BandPromoCode).filter(BandPromoCode.id == promo_id).first()
    if promo:
        promo.is_active = not promo.is_active
        db.commit()
        db.refresh(promo)
    return promo


def delete_promo(db: Session, promo_id: int) -> bool:
    promo = db.query(BandPromoCode).filter(BandPromoCode.id == promo_id).first()
    if promo:
        db.delete(promo)
        db.commit()
        return True
    return False
