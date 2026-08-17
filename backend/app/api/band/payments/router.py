"""Band Payments Router — escrow releases, invoice calculation, and transactions."""

from typing import Dict, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import band_schemas as schemas
from app.models.band_models import BandAccount
from app.api.band.common.deps import get_band_account
from app.api.band.payments import service

router = APIRouter(prefix="/band/payments", tags=["Band Payments"])


@router.post(
    "/release-escrow/{booking_id}",
    response_model=schemas.BandBookingResponse,
)
def release_escrow(
    booking_id: int,
    db: Session = Depends(get_db),
    account: BandAccount = Depends(get_band_account),
):
    """Release remaining 80% escrow balance to provider wallet and mark gig completed."""
    return service.release_escrow(db, account, booking_id)


@router.get(
    "/invoices/{booking_id}",
    response_model=Dict[str, Any],
)
def get_booking_invoice(
    booking_id: int,
    db: Session = Depends(get_db),
    account: BandAccount = Depends(get_band_account),
):
    """Get calculated tax invoice breakdown with GST and escrow status."""
    return service.get_booking_invoice(db, account, booking_id)
