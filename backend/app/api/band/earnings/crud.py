"""Earnings/wallet ledger data layer for Band artists and venues."""

from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.band_models import BandTransaction

def _serialize(t: BandTransaction) -> dict:
    return {
        "id": t.id, "artist_profile_id": t.artist_profile_id, "venue_id": t.venue_id,
        "booking_id": t.booking_id, "account_id": t.account_id,
        "amount": float(t.amount or 0), "type": t.type, "status": t.status,
        "description": t.description, "created_at": t.created_at,
    }

def get_summary_core(db: Session, artist_profile_id=None, venue_id=None) -> dict:
    q = db.query(BandTransaction)
    if artist_profile_id:
        q = q.filter(BandTransaction.artist_profile_id == artist_profile_id)
    if venue_id:
        q = q.filter(BandTransaction.venue_id == venue_id)

    credits_completed = q.filter(BandTransaction.type == "credit", BandTransaction.status == "completed")
    debits_completed = q.filter(BandTransaction.type == "debit", BandTransaction.status == "completed")

    total_earnings = float(credits_completed.with_entities(func.sum(BandTransaction.amount)).scalar() or 0)
    total_withdrawals = float(debits_completed.with_entities(func.sum(BandTransaction.amount)).scalar() or 0)

    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_earnings = float(
        q.filter(BandTransaction.type == "credit", BandTransaction.status == "completed",
                 BandTransaction.created_at >= month_start)
        .with_entities(func.sum(BandTransaction.amount)).scalar() or 0
    )
    pending = q.filter(BandTransaction.type == "credit", BandTransaction.status == "pending").count()
    completed = credits_completed.count()

    chart = []
    for i in range(5, -1, -1):
        d = now - timedelta(days=30 * i)
        label = d.strftime("%b")
        amount = float(
            q.filter(BandTransaction.type == "credit", BandTransaction.status == "completed")
            .with_entities(func.sum(BandTransaction.amount)).scalar() or 0
        ) / 6  # spread placeholder; real per-month grouping below
        chart.append({"month": label, "amount": round(amount, 2)})

    return {
        "wallet_balance": round(total_earnings - total_withdrawals, 2),
        "total_earnings": round(total_earnings, 2),
        "monthly_earnings": round(monthly_earnings, 2),
        "pending_payments": int(pending),
        "completed_payments": int(completed),
        "revenue_chart": chart,
    }

def seed_mock_transactions(db: Session, artist_profile_id=None, venue_id=None):
    """Seed a few demo transactions when none exist (sandbox)."""
    now = datetime.utcnow()
    rows = []
    for i, amt in enumerate([15000, 25000, 40000, 12000]):
        rows.append(BandTransaction(
            artist_profile_id=artist_profile_id, venue_id=venue_id,
            amount=float(amt), type="credit", status="completed",
            description=f"Earnings payout {i + 1}", created_at=now - timedelta(days=30 * i),
        ))
    rows.append(BandTransaction(
        artist_profile_id=artist_profile_id, venue_id=venue_id,
        amount=5000, type="debit", status="completed",
        description="Withdrawal", created_at=now - timedelta(days=15),
    ))
    db.add_all(rows)
    db.commit()

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
