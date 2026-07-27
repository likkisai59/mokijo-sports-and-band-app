"""
Common Pydantic validation helpers.
"""

import re

# Reserved usernames that cannot be claimed by any artist
_RESERVED_USERNAMES = frozenset({
    "admin", "administrator", "bandconnect", "support", "help",
    "api", "login", "register", "developer", "marketplace",
    "artist", "artists", "venue", "venues", "client", "clients",
    "booking", "bookings", "payment", "payments", "review", "reviews",
    "notification", "notifications", "report", "reports", "system",
    "null", "undefined", "root", "test", "info", "contact", "me",
})

def validate_phone_number(value: str) -> str:
    """Validate standard phone format."""
    pattern = re.compile(r"^\+?[1-9]\d{1,14}$")  # E.164 phone format
    if not pattern.match(value):
        raise ValueError("Invalid phone number format. Must be E.164 compliant.")
    return value

def validate_password_strength(value: str) -> str:
    """Ensure passwords meet minimal security strength requirements."""
    if len(value) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    if not any(char.isupper() for char in value):
        raise ValueError("Password must contain at least one uppercase letter.")
    if not any(char.islower() for char in value):
        raise ValueError("Password must contain at least one lowercase letter.")
    if not any(char.isdigit() for char in value):
        raise ValueError("Password must contain at least one numeric digit.")
    if not any(char in "!@#$%^&*()_+-=[]{}|;':\",./<>?" for char in value):
        raise ValueError("Password must contain at least one special character.")
    return value

def validate_username(value: str) -> str:
    """
    Validate and normalize an artist username.
    Rules:
      - 3 to 30 characters
      - Only lowercase letters, digits, and underscores
      - May not start or end with an underscore
      - Must not be a reserved system name
    The value is lowercased before validation and stored without the @ prefix.
    """
    # Normalize to lowercase first
    value = value.strip().lower()

    if len(value) < 3 or len(value) > 30:
        raise ValueError("Username must be between 3 and 30 characters long.")

    if not re.fullmatch(r"[a-z0-9_]+", value):
        raise ValueError(
            "Username may only contain lowercase letters, digits, and underscores."
        )

    if value.startswith("_") or value.endswith("_"):
        raise ValueError("Username may not start or end with an underscore.")

    if value in _RESERVED_USERNAMES:
        raise ValueError(
            f"'{value}' is a reserved name and cannot be used as a username."
        )

    return value
