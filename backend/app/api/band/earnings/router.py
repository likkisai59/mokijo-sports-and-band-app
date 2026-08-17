"""Band Earnings Router — earnings summary, transaction history, and payout withdrawals."""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import band_schemas as schemas
from app.models.band_models import BandAccount
from app.api.band.common.deps import get_band_account
from app.api.band.earnings import service

router = APIRouter(prefix="/band/earnings", tags=["Band Earnings"])


@router.get(
    "/summary",
    response_model=schemas.BandEarningsSummaryResponse,
)
def get_earnings_summary(
    db: Session = Depends(get_db),
    account: BandAccount = Depends(get_band_account),
):
    """Retrieve full wallet balance, monthly metrics, revenue chart, and transaction ledger."""
    return service.get_my_earnings_summary(db, account)


@router.post(
    "/withdraw",
    response_model=schemas.BandTransactionResponse,
    status_code=status.HTTP_201_CREATED,
)
def request_payout_withdrawal(
    amount: float = Query(..., gt=0),
    description: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    account: BandAccount = Depends(get_band_account),
):
    """Request a payout withdrawal from available balance."""
    return service.request_withdrawal(db, account, amount=amount, description=description)
