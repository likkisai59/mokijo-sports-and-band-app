"""Band Earnings Service layer — wallet summaries and payout withdrawals."""

from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.band_models import BandAccount, BandArtistProfile, BandVenue
from app.models import band_schemas as schemas
from app.api.band.earnings import crud


def get_my_earnings_summary(
    db: Session,
    account: BandAccount,
) -> schemas.BandEarningsSummaryResponse:
    """Retrieve full earnings, wallet balance, and ledger for the authenticated provider."""
    artist_id = None
    venue_id = None

    if account.role == "artist":
        artist = db.query(BandArtistProfile).filter_by(account_id=account.id).first()
        if artist:
            artist_id = artist.id
    elif account.role == "venue_owner":
        venue = db.query(BandVenue).filter_by(account_id=account.id).first()
        if venue:
            venue_id = venue.id

    return crud.calculate_earnings_summary(
        db,
        artist_profile_id=artist_id,
        venue_id=venue_id,
        account_id=account.id,
    )


def request_withdrawal(
    db: Session,
    account: BandAccount,
    amount: float,
    description: Optional[str] = None,
) -> schemas.BandTransactionResponse:
    """Request a payout withdrawal to bank or UPI."""
    if amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Withdrawal amount must be greater than zero.",
        )

    summary = get_my_earnings_summary(db, account)
    if amount > summary.wallet_balance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient available wallet balance (₹{summary.wallet_balance:,.2f}).",
        )

    artist_id = None
    venue_id = None
    if account.role == "artist":
        artist = db.query(BandArtistProfile).filter_by(account_id=account.id).first()
        if artist:
            artist_id = artist.id
    elif account.role == "venue_owner":
        venue = db.query(BandVenue).filter_by(account_id=account.id).first()
        if venue:
            venue_id = venue.id

    tx = crud.create_transaction(
        db=db,
        amount=amount,
        tx_type="debit",
        status="pending",
        description=description or "Payout withdrawal to bank account / UPI",
        artist_profile_id=artist_id,
        venue_id=venue_id,
        account_id=account.id,
    )
    return schemas.BandTransactionResponse.model_validate(tx)
