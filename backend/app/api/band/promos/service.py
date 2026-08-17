from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime
from fastapi import HTTPException, status

from app.api.band.promos import crud
from app.models.band_models import BandPromoCode


class PromoService:
    @staticmethod
    def validate_and_apply(
        db: Session, code: str, booking_amount: float
    ) -> Dict[str, Any]:
        promo = crud.get_promo_by_code(db, code)
        if not promo or not promo.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Coupon code is invalid or no longer active.",
            )

        if promo.expires_at and promo.expires_at < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This promotional code has expired.",
            )

        if promo.max_uses and promo.used_count >= promo.max_uses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This coupon has reached its maximum redemption limit.",
            )

        if booking_amount < promo.min_order_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Minimum booking amount of ₹{promo.min_order_amount:,.2f} required to apply this coupon.",
            )

        # Compute discount
        if promo.discount_type == "percentage":
            calculated_discount = (booking_amount * promo.discount_value) / 100.0
            if promo.max_discount_cap:
                calculated_discount = min(calculated_discount, promo.max_discount_cap)
        else:
            calculated_discount = min(promo.discount_value, booking_amount)

        final_amount = max(0.0, booking_amount - calculated_discount)
        gst_amount = round(final_amount * 0.18, 2)
        total_payable = round(final_amount + gst_amount, 2)
        advance_20_percent = round(total_payable * 0.20, 2)

        return {
            "valid": True,
            "code": promo.code,
            "discount_type": promo.discount_type,
            "discount_value": promo.discount_value,
            "discount_amount": round(calculated_discount, 2),
            "original_amount": booking_amount,
            "discounted_amount": round(final_amount, 2),
            "gst_18_percent": gst_amount,
            "total_payable": total_payable,
            "advance_escrow_deposit": advance_20_percent,
        }

    @staticmethod
    def list_all(db: Session) -> List[Dict[str, Any]]:
        promos = crud.list_promos(db)
        return [
            {
                "id": p.id,
                "code": p.code,
                "description": p.description,
                "discount_type": p.discount_type,
                "discount_value": p.discount_value,
                "min_order_amount": p.min_order_amount,
                "max_discount_cap": p.max_discount_cap,
                "max_uses": p.max_uses,
                "used_count": p.used_count,
                "is_active": p.is_active,
                "expires_at": p.expires_at.isoformat() if p.expires_at else None,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in promos
        ]

    @staticmethod
    def add_promo(
        db: Session,
        code: str,
        discount_type: str,
        discount_value: float,
        min_order_amount: float = 0.0,
        max_discount_cap: Optional[float] = None,
        max_uses: int = 100,
        description: Optional[str] = None,
        expires_at: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        existing = crud.get_promo_by_code(db, code)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Promo code '{code}' already exists.",
            )

        promo = crud.create_promo(
            db=db,
            code=code,
            discount_type=discount_type,
            discount_value=discount_value,
            min_order_amount=min_order_amount,
            max_discount_cap=max_discount_cap,
            max_uses=max_uses,
            description=description,
            expires_at=expires_at,
        )
        return {
            "id": promo.id,
            "code": promo.code,
            "discount_value": promo.discount_value,
            "message": f"Promo code '{promo.code}' created successfully.",
        }
