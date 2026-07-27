"""
Date and time utilities.
"""

from datetime import date, datetime, timezone

def get_utc_now() -> datetime:
    """Return timezone-aware current UTC time."""
    return datetime.now(timezone.utc)

def format_date_iso(d: date) -> str:
    """Convert date to ISO string format."""
    return d.isoformat()

def parse_date_iso(date_str: str) -> date:
    """Parse date from ISO string format."""
    return date.fromisoformat(date_str)
