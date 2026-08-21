from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.band.common.deps import get_band_db, get_current_band_account, get_current_admin_band_account
from app.api.band.promos.service import PromoService
from app.api.band.promos import crud
from app.models.band_models import BandAccount

router = APIRouter(prefix="/band/promos", tags=["Band Promo Discounts"])


class PromoValidateRequest(BaseModel):
    code: str = Field(..., min_length=2, max_length=50)
    booking_amount: float = Field(..., gt=0)


class PromoCreateRequest(BaseModel):
    code: str = Field(..., min_length=2, max_length=50)
    discount_type: str = Field("percentage", pattern="^(percentage|flat)$")
    discount_value: float = Field(..., gt=0)
    min_order_amount: float = Field(0.0, ge=0)
    max_discount_cap: Optional[float] = None
    max_uses: int = Field(100, gt=0)
    description: Optional[str] = None
    expires_at: Optional[datetime] = None


@router.post("/validate")
def validate_promo(
    req: PromoValidateRequest,
    db: Session = Depends(get_band_db),
    current_user: BandAccount = Depends(get_current_band_account),
):
    """Validate a promo code during checkout and calculate exact discounted advance escrow."""
    result = PromoService.validate_and_apply(
        db=db, code=req.code, booking_amount=req.booking_amount
    )
    return {"success": True, "data": result}


@router.get("")
def list_promos(
    db: Session = Depends(get_band_db),
    admin_user: BandAccount = Depends(get_current_admin_band_account),
):
    """Admin endpoint to fetch all platform promotional discount codes."""
    promos = PromoService.list_all(db=db)
    return {"success": True, "data": promos}


@router.post("")
def create_promo(
    req: PromoCreateRequest,
    db: Session = Depends(get_band_db),
    admin_user: BandAccount = Depends(get_current_admin_band_account),
):
    """Admin endpoint to create a new promotional discount coupon."""
    created = PromoService.add_promo(
        db=db,
        code=req.code,
        discount_type=req.discount_type,
        discount_value=req.discount_value,
        min_order_amount=req.min_order_amount,
        max_discount_cap=req.max_discount_cap,
        max_uses=req.max_uses,
        description=req.description,
        expires_at=req.expires_at,
    )
    return {"success": True, "data": created}


@router.post("/{promo_id}/toggle")
def toggle_promo_status(
    promo_id: int,
    db: Session = Depends(get_band_db),
    admin_user: BandAccount = Depends(get_current_admin_band_account),
):
    """Admin toggle to activate or suspend a coupon code."""
    promo = crud.toggle_promo_active(db, promo_id)
    if not promo:
        raise HTTPException(status_code=404, detail="Promo code not found.")
    return {
        "success": True,
        "data": {
            "id": promo.id,
            "code": promo.code,
            "is_active": promo.is_active,
            "message": f"Promo '{promo.code}' is now {'active' if promo.is_active else 'suspended'}.",
        },
    }


@router.delete("/{promo_id}")
def delete_promo(
    promo_id: int,
    db: Session = Depends(get_band_db),
    admin_user: BandAccount = Depends(get_current_admin_band_account),
):
    """Admin endpoint to permanently delete a promo code."""
    success = crud.delete_promo(db, promo_id)
    if not success:
        raise HTTPException(status_code=404, detail="Promo code not found.")
    return {"success": True, "message": "Promo code deleted successfully."}
