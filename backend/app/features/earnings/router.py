from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_artist, get_current_venue_owner
from app.common.schemas.base import SuccessResponse
from app.features.earnings.schemas import EarningsSummaryResponse
from app.features.earnings.service import earnings_service

router = APIRouter(tags=["Earnings"])

@router.get(
    "/artist",
    response_model=SuccessResponse[EarningsSummaryResponse],
    status_code=status.HTTP_200_OK,
    summary="Get earnings wallet balance, monthly performance and transactions for performer"
)
async def get_artist_earnings_feed(
    current_user_claims: dict = Depends(get_current_artist),
    db: Session = Depends(get_db)
):
    """
    Retrieves wallet balances, total income, pending deposits, performance charts, and transaction ledger.
    """
    summary = earnings_service.get_artist_earnings_summary(db, current_user_claims["sub"])
    return SuccessResponse(
        success=True,
        data={
            "wallet_balance": summary["wallet_balance"],
            "total_earnings": summary["total_earnings"],
            "monthly_earnings": summary["monthly_earnings"],
            "pending_payments": summary["pending_payments"],
            "completed_payments": summary["completed_payments"],
            "revenue_chart": summary["revenue_chart"],
            "transactions": [_format_tx(tx) for tx in summary["transactions"]]
        },
        message="Artist earnings dashboard metrics retrieved."
    )


@router.get(
    "/venue",
    response_model=SuccessResponse[EarningsSummaryResponse],
    status_code=status.HTTP_200_OK,
    summary="Get earnings wallet balance, monthly performance and transactions for venue owner"
)
async def get_venue_earnings_feed(
    current_user_claims: dict = Depends(get_current_venue_owner),
    db: Session = Depends(get_db)
):
    """
    Retrieves wallet balances, total income, pending deposits, performance charts, and transaction ledger.
    """
    summary = earnings_service.get_venue_earnings_summary(db, current_user_claims["sub"])
    return SuccessResponse(
        success=True,
        data={
            "wallet_balance": summary["wallet_balance"],
            "total_earnings": summary["total_earnings"],
            "monthly_earnings": summary["monthly_earnings"],
            "pending_payments": summary["pending_payments"],
            "completed_payments": summary["completed_payments"],
            "revenue_chart": summary["revenue_chart"],
            "transactions": [_format_tx(tx) for tx in summary["transactions"]]
        },
        message="Venue earnings dashboard metrics retrieved."
    )


def _format_tx(tx) -> dict:
    return {
        "id": str(tx.id),
        "booking_id": str(tx.booking_id) if tx.booking_id else None,
        "amount": float(tx.amount),
        "type": tx.type,
        "status": tx.status,
        "description": tx.description,
        "created_at": tx.created_at.isoformat()
    }
