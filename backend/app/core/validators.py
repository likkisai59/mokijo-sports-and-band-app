"""Shared registration validation (mirrors frontend/lib/validation.js)."""
from __future__ import annotations

import re
from typing import Optional, Tuple

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
PERSON_NAME_RE = re.compile(r"^[A-Za-z][A-Za-z\s'-]*$")
CLUB_NAME_RE = re.compile(r"^(?=.*[A-Za-z])[A-Za-z0-9][A-Za-z0-9\s.&'\-]*$")
STRONG_PASSWORD_RE = re.compile(
    r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$"
)

STRONG_PASSWORD_MESSAGE = (
    "Password must be at least 8 characters long and contain at least 1 uppercase letter, "
    "1 lowercase letter, 1 number, and 1 special character."
)
EMAIL_MESSAGE = "Please enter a valid email address (e.g., name@example.com)."
PERSON_NAME_MESSAGE = (
    "Name can only contain alphabetic characters, spaces, hyphens, and apostrophes."
)
CLUB_NAME_MESSAGE = "Club name cannot be only numbers and must use valid characters."
AADHAAR_MESSAGE = "Please enter a valid 12-digit Aadhaar number."

PHONE_LENGTH_BY_CODE = {
    "+91": (10, 10),
    "+1": (10, 10),
    "+44": (10, 11),
    "+49": (10, 11),
    "+61": (9, 9),
    "+971": (9, 9),
}


def digits_only(value: Optional[str]) -> str:
    return re.sub(r"\D", "", str(value or ""))


def is_valid_email(value: Optional[str]) -> bool:
    v = (value or "").strip()
    return bool(EMAIL_RE.match(v))


def is_valid_person_name(value: Optional[str]) -> bool:
    v = (value or "").strip()
    return bool(v) and bool(PERSON_NAME_RE.match(v)) and not re.search(r"\d", v)


def is_valid_club_name(value: Optional[str]) -> bool:
    v = (value or "").strip()
    if not v or v.isdigit():
        return False
    return bool(CLUB_NAME_RE.match(v))


def is_strong_password(value: Optional[str]) -> bool:
    return bool(STRONG_PASSWORD_RE.match(str(value or "")))


def is_valid_aadhaar(value: Optional[str]) -> bool:
    return bool(re.fullmatch(r"\d{12}", digits_only(value)))


def parse_phone(value: Optional[str]) -> Tuple[str, str]:
    raw = (value or "").strip()
    m = re.match(r"^(\+\d{1,4})\s*(.*)$", raw)
    if m:
        return m.group(1), digits_only(m.group(2))
    return "+91", digits_only(raw)


def is_valid_phone(value: Optional[str], country_code: Optional[str] = None) -> bool:
    if country_code:
        code, digits = country_code, digits_only(value)
    else:
        code, digits = parse_phone(value)
    if not digits.isdigit() or not digits:
        return False
    lo, hi = PHONE_LENGTH_BY_CODE.get(code, (8, 15))
    return lo <= len(digits) <= hi


def phone_length_message(country_code: str = "+91") -> str:
    lo, hi = PHONE_LENGTH_BY_CODE.get(country_code, (8, 15))
    if lo == hi:
        return f"Please enter a valid {lo}-digit phone number."
    return f"Please enter a valid phone number ({lo}–{hi} digits)."
