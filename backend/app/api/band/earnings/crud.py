"""Earnings/wallet ledger data layer for Band artists and venues."""

from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.band_models import BandTransaction, BandBooking

def _serialize(t: BandTransaction) -> dict:
    return {
        "id": t.id, "artist_profile_id": t.artist_profile_id, "venue_id": t.venue_id,
        "booking_id": t.booking_id, "account_id": t.account_id,
        "amount": float(t.amount or 0), "type": t.type, "status": t.status,
        "description": t.description, "created_at": t.created_at,
    }

def get_summary_core(db: Session, artist_profile_id=None, venue_id=None) -> dict:
    q = db.query(BandBooking).filter(BandBooking.deleted_at.is_(None))
    if artist_profile_id:
        q = q.filter(BandBooking.artist_profile_id == artist_profile_id)
    if venue_id:
        q = q.filter(BandBooking.venue_id == venue_id)

    completed_bookings = q.filter(BandBooking.status == "completed")
    pending_bookings = q.filter(BandBooking.status.in_(["accepted", "confirmed"]))

    # Total earnings (Gross)
    total_earnings = float(
        completed_bookings.with_entities(func.sum(func.coalesce(BandBooking.counter_price, BandBooking.proposed_price))).scalar() or 0
    )

    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    monthly_earnings = float(
        completed_bookings.filter(BandBooking.created_at >= month_start)
        .with_entities(func.sum(func.coalesce(BandBooking.counter_price, BandBooking.proposed_price))).scalar() or 0
    )
    
    # Pending Amount
    pending_amount = float(
        pending_bookings.with_entities(func.sum(func.coalesce(BandBooking.counter_price, BandBooking.proposed_price))).scalar() or 0
    )
    
    completed_count = completed_bookings.count()

    # Generate Chart Data
    chart = []
    for i in range(5, -1, -1):
        d = now - timedelta(days=30 * i)
        start = d.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end = (start + timedelta(days=32)).replace(day=1)
        
        amount = float(
            completed_bookings.filter(BandBooking.created_at >= start, BandBooking.created_at < end)
            .with_entities(func.sum(func.coalesce(BandBooking.counter_price, BandBooking.proposed_price))).scalar() or 0
        )
        chart.append({"month": start.strftime("%b"), "revenue": round(amount, 2)})

    # Calculate wallet balance by subtracting withdrawals from total_earnings
    withdrawals = float(
        db.query(BandTransaction)
        .filter(BandTransaction.type == "debit", BandTransaction.status == "completed")
        .with_entities(func.sum(BandTransaction.amount)).scalar() or 0
    )

    return {
        "wallet_balance": round(total_earnings - withdrawals, 2),
        "total_earnings": round(total_earnings, 2),
        "monthly_earnings": round(monthly_earnings, 2),
        "pending_payments": round(pending_amount, 2),
        "completed_payments": int(completed_count),
        "revenue_chart": chart,
    }

def seed_mock_transactions(db: Session, artist_profile_id=None, venue_id=None):
    pass

def get_transaction_count_for_artist(db: Session, profile_id: int) -> int:
    return db.query(BandTransaction).filter(BandTransaction.artist_profile_id == profile_id).count()

def get_recent_transactions_for_artist(db: Session, profile_id: int, limit: int = 20):
    txns = (
        db.query(BandTransaction)
        .filter(BandTransaction.artist_profile_id == profile_id)
        .order_by(BandTransaction.created_at.desc())
        .limit(limit)
        .all()
    )
    return [_serialize(t) for t in txns]

def get_transaction_count_for_venue(db: Session, venue_id: int) -> int:
    return db.query(BandTransaction).filter(BandTransaction.venue_id == venue_id).count()

def get_recent_transactions_for_venue(db: Session, venue_id: int, limit: int = 20):
    txns = (
        db.query(BandTransaction)
        .filter(BandTransaction.venue_id == venue_id)
        .order_by(BandTransaction.created_at.desc())
        .limit(limit)
        .all()
    )
    return [_serialize(t) for t in txns]
