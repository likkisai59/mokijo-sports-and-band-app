"""Shared validation helpers for registration and onboarding."""
import re
from typing import Optional, Union

STRONG_PASSWORD_MESSAGE = (
    "Password must be at least 8 characters long and contain at least 1 uppercase letter, "
    "1 lowercase letter, 1 number, and 1 special character."
)

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")
PERSON_NAME_RE = re.compile(r"^[A-Za-z]+(?:[ '\-][A-Za-z]+)*$")
CLUB_NAME_RE = re.compile(r"^[A-Za-z0-9]+(?:[ \-][A-Za-z0-9]+)*$")
SPECIAL_CHAR_RE = re.compile(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>/?`~]")

PHONE_LENGTH_BY_CODE = {
    "+91": 10,
    "+1": 10,
    "+44": 10,
    "+49": (10, 11),
    "+61": 9,
    "+971": 9,
    "+65": 8,
    "+81": (10, 11),
    "+86": 11,
    "+33": 9,
    "+39": (9, 10),
}


def digits_only(value: Optional[str]) -> str:
    return re.sub(r"\D", "", value or "")


def is_strong_password(password: Optional[str]) -> bool:
    if not password or len(password) < 8:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"[0-9]", password):
        return False
    if not SPECIAL_CHAR_RE.search(password):
        return False
    return True


def is_valid_email(email: Optional[str]) -> bool:
    if not email:
        return False
    return bool(EMAIL_RE.match(email.strip()))


def is_valid_person_name(name: Optional[str]) -> bool:
    if not name or not name.strip():
        return False
    return bool(PERSON_NAME_RE.match(name.strip()))


def is_valid_club_name(name: Optional[str]) -> bool:
    if not name or not name.strip():
        return False
    return bool(CLUB_NAME_RE.match(name.strip()))


def is_valid_aadhaar(value: Optional[str]) -> bool:
    return bool(re.fullmatch(r"\d{12}", digits_only(value)))


def parse_phone(phone: Optional[str]) -> tuple[str, str]:
    """Return (country_code, digits). Defaults to +91 if no prefix."""
    raw = (phone or "").strip().replace(" ", "")
    if not raw:
        return "+91", ""
    if raw.startswith("+"):
        for code in sorted(PHONE_LENGTH_BY_CODE.keys(), key=len, reverse=True):
            if raw.startswith(code):
                return code, digits_only(raw[len(code):])
        # Unknown +prefix: treat remaining as digits after first 1-3 digits of code
        m = re.match(r"^(\+\d{1,3})(\d*)$", raw)
        if m:
            return m.group(1), digits_only(m.group(2))
    return "+91", digits_only(raw)


def is_valid_phone(phone: Optional[str], country_code: Optional[str] = None) -> bool:
    if country_code:
        code = country_code
        digits = digits_only(phone)
    else:
        code, digits = parse_phone(phone)
    rule: Union[int, tuple] = PHONE_LENGTH_BY_CODE.get(code, 10)
    if isinstance(rule, tuple):
        return rule[0] <= len(digits) <= rule[1]
    return len(digits) == rule


def validate_strong_password_or_raise(password: Optional[str]) -> None:
    from fastapi import HTTPException
    if not is_strong_password(password):
        raise HTTPException(status_code=400, detail=STRONG_PASSWORD_MESSAGE)


def validate_email_or_raise(email: Optional[str]) -> str:
    from fastapi import HTTPException
    clean = (email or "").replace(" ", "").lower().strip()
    if not is_valid_email(clean):
        raise HTTPException(
            status_code=400,
            detail="Please enter a valid email address (e.g., name@example.com).",
        )
    return clean


def validate_person_name_or_raise(name: Optional[str], label: str = "Name") -> str:
    from fastapi import HTTPException
    clean = (name or "").strip()
    if not is_valid_person_name(clean):
        raise HTTPException(
            status_code=400,
            detail=f"{label} can only contain letters, spaces, hyphens, and apostrophes",
        )
    return clean


def validate_club_name_or_raise(name: Optional[str]) -> str:
    from fastapi import HTTPException
    clean = (name or "").strip()
    if not is_valid_club_name(clean):
        raise HTTPException(
            status_code=400,
            detail="Club name can only contain letters, numbers, spaces, and hyphens",
        )
    return clean


def validate_phone_or_raise(phone: Optional[str]) -> str:
    from fastapi import HTTPException
    if not phone or not str(phone).strip():
        raise HTTPException(status_code=400, detail="Phone number is required")
    if not is_valid_phone(phone):
        raise HTTPException(
            status_code=400,
            detail="Phone number can only contain digits and must match the selected country code length.",
        )
    code, digits = parse_phone(phone)
    return f"{code}{digits}"


def validate_aadhaar_or_raise(value: Optional[str], required: bool = True) -> Optional[str]:
    from fastapi import HTTPException
    if not value or not str(value).strip():
        if required:
            raise HTTPException(status_code=400, detail="Aadhaar number must be exactly 12 digits.")
        return None
    clean = digits_only(value)
    if not is_valid_aadhaar(clean):
        raise HTTPException(status_code=400, detail="Aadhaar number must be exactly 12 digits.")
    return clean
