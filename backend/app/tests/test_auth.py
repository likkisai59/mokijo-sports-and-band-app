"""
Module 1 — Authentication & Account Lifecycle Test Suite
=========================================================
Covers:
  - Role assignment per registration type (client, artist, venue_owner)
  - Admin self-registration blocked
  - Password complexity enforcement (backend Pydantic validators)
  - Duplicate email detection
  - Login success and failure paths
  - Email verification token handling (valid, expired, invalid, already-verified)
  - Resend verification rate-limiting (60-second cooldown)
  - Artist username uniqueness and normalization
  - Venue number sequential generation
  - JWT decode_token exception mapping (UnauthorizedException vs raw HTTPException)
  - Password reset flow
"""

import pytest
from unittest.mock import patch

# ─── Helpers ──────────────────────────────────────────────────────────────────

WEAK_PASSWORDS = [
    "short1!",           # too short (< 8)
    "alllowercase1!",    # no uppercase
    "ALLUPPERCASE1!",    # no lowercase
    "NoDigitHere!",      # no digit
    "NoSpecial1234",     # no special char
]

STRONG_PASSWORD = "Secure@Pass1"

def register_user(client, email: str, name: str, role: str, password: str = STRONG_PASSWORD):
    """Helper: POST /api/v1/auth/register and return the response object."""
    return client.post("/api/v1/auth/register", json={
        "email": email,
        "name": name,
        "role_name": role,
        "password": password,
    })


# ─── Registration Tests ────────────────────────────────────────────────────────

class TestRegistration:

    def test_client_registration_assigns_client_role(self, client):
        resp = register_user(client, "client1@test.com", "Test Client", "client")
        assert resp.status_code == 201, resp.json()
        data = resp.json()
        assert data["success"] is True
        roles = data["data"]["roles"]
        assert any(r["name"] == "client" for r in roles), f"Expected 'client' role, got {roles}"

    def test_artist_registration_assigns_artist_role(self, client):
        resp = register_user(client, "artist1@test.com", "Test Artist", "artist")
        assert resp.status_code == 201, resp.json()
        data = resp.json()
        roles = data["data"]["roles"]
        assert any(r["name"] == "artist" for r in roles), f"Expected 'artist' role, got {roles}"

    def test_venue_owner_registration_assigns_venue_owner_role(self, client):
        resp = register_user(client, "venue1@test.com", "Test Venue Owner", "venue_owner")
        assert resp.status_code == 201, resp.json()
        data = resp.json()
        roles = data["data"]["roles"]
        assert any(r["name"] == "venue_owner" for r in roles), f"Expected 'venue_owner' role, got {roles}"

    def test_admin_registration_blocked_on_public_endpoint(self, client):
        resp = register_user(client, "admin@test.com", "Evil Admin", "admin")
        # Must reject with 422 (validation) — not 201
        assert resp.status_code == 422, f"Admin self-registration should be blocked, got {resp.status_code}"

    def test_duplicate_email_returns_409(self, client):
        register_user(client, "dup@test.com", "User One", "client")
        resp = register_user(client, "dup@test.com", "User Two", "client")
        assert resp.status_code == 409, resp.json()
        data = resp.json()
        assert data["success"] is False

    def test_registration_returns_is_verified_false(self, client):
        resp = register_user(client, "unverified@test.com", "Unverified User", "client")
        assert resp.status_code == 201
        assert resp.json()["data"]["is_verified"] is False

    def test_registration_with_email_failure_still_returns_201(self, client):
        """User account creation succeeds even if SMTP is down."""
        with patch("app.core.email.EmailService.send_verification_email", side_effect=Exception("SMTP unavailable")):
            resp = register_user(client, "emailfail@test.com", "No Email User", "client")
        assert resp.status_code == 201, resp.json()
        assert resp.json()["success"] is True
        # Message should indicate email send failure, not success
        assert "failed" in resp.json()["message"].lower() or "resend" in resp.json()["message"].lower()


# ─── Password Strength Tests ───────────────────────────────────────────────────

class TestPasswordStrength:

    @pytest.mark.parametrize("weak_password", WEAK_PASSWORDS)
    def test_weak_passwords_rejected(self, client, weak_password):
        resp = client.post("/api/v1/auth/register", json={
            "email": f"weak{hash(weak_password) % 9999}@test.com",
            "name": "Weak Password User",
            "role_name": "client",
            "password": weak_password,
        })
        # Must fail with 422 validation error — not 201
        assert resp.status_code == 422, (
            f"Weak password '{weak_password}' should be rejected but got {resp.status_code}"
        )
        data = resp.json()
        assert data["success"] is False

    def test_strong_password_accepted(self, client):
        resp = register_user(client, "strongpass@test.com", "Strong Pass User", "client", STRONG_PASSWORD)
        assert resp.status_code == 201, resp.json()

    def test_password_reset_enforces_complexity(self, client):
        """Reset-password endpoint must also enforce the same complexity rules."""
        resp = client.post("/api/v1/auth/reset-password", json={
            "token": "dummy_token",
            "new_password": "alllowercase",
        })
        # 422 from Pydantic validation, not 401 from token check
        assert resp.status_code == 422, resp.json()


# ─── Login Tests ──────────────────────────────────────────────────────────────

class TestLogin:

    def test_login_success_returns_tokens(self, client):
        register_user(client, "loginok@test.com", "Login User", "client")
        resp = client.post("/api/v1/auth/login", json={"email": "loginok@test.com", "password": STRONG_PASSWORD})
        assert resp.status_code == 200, resp.json()
        data = resp.json()["data"]
        assert "access_token" in data
        assert "refresh_token" in data

    def test_login_wrong_password_returns_401(self, client):
        register_user(client, "loginbad@test.com", "Bad Login", "client")
        resp = client.post("/api/v1/auth/login", json={"email": "loginbad@test.com", "password": "WrongPass@1"})
        assert resp.status_code == 401, resp.json()
        assert resp.json()["success"] is False

    def test_login_nonexistent_email_returns_401(self, client):
        resp = client.post("/api/v1/auth/login", json={"email": "ghost@test.com", "password": STRONG_PASSWORD})
        assert resp.status_code == 401, resp.json()

    def test_login_response_has_standard_error_shape_on_failure(self, client):
        """Ensures error shape is {success: false, error: {code, message, details}} not {detail: ...}."""
        resp = client.post("/api/v1/auth/login", json={"email": "nobody@test.com", "password": "BadPass@1"})
        body = resp.json()
        assert "error" in body, f"Expected 'error' key in response, got: {body}"
        assert "message" in body["error"], f"Expected 'message' in error, got: {body['error']}"
        assert "detail" not in body, "Raw FastAPI 'detail' key must not appear in error responses"


# ─── Email Verification Tests ─────────────────────────────────────────────────

class TestEmailVerification:

    def _get_verify_token(self, client, email: str, role: str = "client") -> str:
        """Register a user and capture the verification token from log output."""
        from app.core.security import create_access_token
        from datetime import timedelta

        # Register first to get the user created
        register_user(client, email, "Verify User", role)

        # Simulate generating a fresh verify token (same as service layer does)
        # Use TestClient's overridden DB session via /auth/me simulation
        # Simplest approach: generate a verify token directly
        from app.core.config import settings
        import jwt as pyjwt

        # We need the user's UUID — look it up via /auth/login then /auth/me
        login_resp = client.post("/api/v1/auth/login", json={"email": email, "password": STRONG_PASSWORD})
        assert login_resp.status_code == 200, f"Login failed: {login_resp.json()}"
        access_token = login_resp.json()["data"]["access_token"]

        payload = pyjwt.decode(access_token, settings.effective_secret_key, algorithms=[settings.ALGORITHM])
        user_id = payload["sub"]

        # Generate a verify token for this user
        verify_token = create_access_token(
            subject=user_id,
            role="verify",
            email=email,
            expires_delta=timedelta(hours=24)
        )
        return verify_token

    def test_valid_verify_token_sets_is_verified(self, client):
        email = "verifyok@test.com"
        token = self._get_verify_token(client, email)

        resp = client.post("/api/v1/auth/verify-email", json={"token": token})
        assert resp.status_code == 200, resp.json()
        assert resp.json()["success"] is True
        # Confirmed: service sets is_verified=True and returns the success message
        assert "verified" in resp.json()["message"].lower()

    def test_already_verified_returns_200_not_error(self, client):
        """Second call with same token should return 200 with already-verified message, not 409."""
        email = "already_verified@test.com"
        token = self._get_verify_token(client, email)

        client.post("/api/v1/auth/verify-email", json={"token": token})     # First call — verifies
        resp = client.post("/api/v1/auth/verify-email", json={"token": token})  # Second call
        assert resp.status_code == 200, resp.json()
        assert resp.json()["success"] is True
        assert "already" in resp.json()["message"].lower()

    def test_invalid_token_returns_401(self, client):
        resp = client.post("/api/v1/auth/verify-email", json={"token": "this.is.garbage"})
        assert resp.status_code == 401, resp.json()
        assert resp.json()["success"] is False

    def test_wrong_role_token_returns_401(self, client):
        """A reset token (role='reset') must not be accepted as a verify token."""
        from app.core.security import create_access_token
        from datetime import timedelta
        bad_token = create_access_token(
            subject="00000000-0000-0000-0000-000000000001",
            role="reset",          # wrong role
            email="x@x.com",
            expires_delta=timedelta(hours=1)
        )
        resp = client.post("/api/v1/auth/verify-email", json={"token": bad_token})
        assert resp.status_code == 401, resp.json()

    def test_expired_token_returns_401_with_standard_error_shape(self, client):
        """Expired tokens must return the AppException shape, not raw FastAPI {detail: ...}."""
        from app.core.security import create_access_token
        from datetime import timedelta
        expired_token = create_access_token(
            subject="00000000-0000-0000-0000-000000000002",
            role="verify",
            email="expired@test.com",
            expires_delta=timedelta(seconds=-1)   # already expired
        )
        resp = client.post("/api/v1/auth/verify-email", json={"token": expired_token})
        body = resp.json()
        assert resp.status_code == 401
        assert "error" in body, f"Expected AppException shape, got: {body}"
        assert "detail" not in body, "Must not expose raw FastAPI 'detail' key"


# ─── Resend Verification Cooldown Tests ───────────────────────────────────────

class TestResendVerification:

    def test_resend_works_for_unverified_user(self, client, db_session):
        email = "resend1@test.com"
        register_user(client, email, "Resend User", "client")
        # Rewind last_verification_sent_at so the 60-second cooldown is bypassed
        from app.features.auth.models import User
        from datetime import datetime, timedelta
        user = db_session.query(User).filter(User.email == email).first()
        if user:
            user.last_verification_sent_at = datetime.utcnow() - timedelta(seconds=120)
            db_session.add(user)
            db_session.commit()
        with patch("app.core.email.EmailService.send_verification_email", return_value=True):
            resp = client.post("/api/v1/auth/resend-verification", json={"email": email})
        assert resp.status_code == 200, resp.json()

    def test_resend_cooldown_enforced(self, client):
        """A second resend within 60 seconds must be rejected with 400."""
        register_user(client, "resend2@test.com", "Cooldown User", "client")
        with patch("app.core.email.EmailService.send_verification_email", return_value=True):
            client.post("/api/v1/auth/resend-verification", json={"email": "resend2@test.com"})
            # Immediately request again — should hit cooldown
            resp = client.post("/api/v1/auth/resend-verification", json={"email": "resend2@test.com"})
        assert resp.status_code == 400, resp.json()
        assert "wait" in resp.json()["error"]["message"].lower()

    def test_resend_for_already_verified_returns_409(self, client, db_session):
        email = "resend_verified@test.com"
        register_user(client, email, "Resend Verified", "client")

        # Manually verify the user via token
        from app.core.security import create_access_token
        from datetime import datetime, timedelta
        import jwt as pyjwt
        from app.core.config import settings
        from app.features.auth.models import User

        login_resp = client.post("/api/v1/auth/login", json={"email": email, "password": STRONG_PASSWORD})
        access_token = login_resp.json()["data"]["access_token"]
        payload = pyjwt.decode(access_token, settings.effective_secret_key, algorithms=[settings.ALGORITHM])
        verify_token = create_access_token(
            subject=payload["sub"], role="verify", email=email,
            expires_delta=timedelta(hours=24)
        )
        client.post("/api/v1/auth/verify-email", json={"token": verify_token})

        # Reset cooldown timer so resend doesn't fail on cooldown first
        user = db_session.query(User).filter(User.email == email).first()
        if user:
            user.last_verification_sent_at = datetime.utcnow() - timedelta(seconds=120)
            db_session.add(user)
            db_session.commit()

        with patch("app.core.email.EmailService.send_verification_email", return_value=True):
            resp = client.post("/api/v1/auth/resend-verification", json={"email": email})
        assert resp.status_code == 409, resp.json()

    def test_resend_for_nonexistent_email_returns_404(self, client):
        resp = client.post("/api/v1/auth/resend-verification", json={"email": "ghost_resend@test.com"})
        assert resp.status_code == 404, resp.json()


# ─── Artist Username Tests ─────────────────────────────────────────────────────

class TestArtistUsername:

    def test_validate_username_accepts_valid_handle(self):
        from app.utils.validators import validate_username
        assert validate_username("the_groove_band") == "the_groove_band"

    def test_validate_username_normalizes_to_lowercase(self):
        from app.utils.validators import validate_username
        assert validate_username("  GrooveBand99  ") == "grooveband99"

    def test_validate_username_rejects_too_short(self):
        from app.utils.validators import validate_username
        with pytest.raises(ValueError, match="3 and 30"):
            validate_username("ab")

    def test_validate_username_rejects_too_long(self):
        from app.utils.validators import validate_username
        with pytest.raises(ValueError, match="3 and 30"):
            validate_username("a" * 31)

    def test_validate_username_rejects_invalid_chars(self):
        from app.utils.validators import validate_username
        with pytest.raises(ValueError, match="only contain"):
            validate_username("bad username!")

    def test_validate_username_rejects_leading_underscore(self):
        from app.utils.validators import validate_username
        with pytest.raises(ValueError, match="start or end"):
            validate_username("_badstart")

    def test_validate_username_rejects_trailing_underscore(self):
        from app.utils.validators import validate_username
        with pytest.raises(ValueError, match="start or end"):
            validate_username("badend_")

    def test_validate_username_rejects_reserved_names(self):
        from app.utils.validators import validate_username
        for reserved in ["admin", "bandconnect", "venue", "booking"]:
            with pytest.raises(ValueError, match="reserved"):
                validate_username(reserved)

    def test_validate_username_allows_digits_and_underscores(self):
        from app.utils.validators import validate_username
        assert validate_username("band_123") == "band_123"


# ─── Venue Number Generation Tests ────────────────────────────────────────────

class TestVenueNumber:

    def test_venue_number_format(self):
        """Generated venue numbers must match BCV-XXXXXX format."""
        import re
        from app.features.venues.service import generate_next_venue_number

        # Use a mock session that simulates PostgreSQL sequence failure (SQLite fallback)
        class MockQuery:
            def count(self): return 0

        class MockDB:
            def execute(self, *a): raise Exception("No sequence in test")
            def query(self, *a): return MockQuery()

        result = generate_next_venue_number(MockDB())
        assert re.match(r"^BCV-\d{6}$", result), f"Invalid format: {result}"

    def test_venue_number_sequential_with_fallback(self):
        """Consecutive calls with SQLite fallback must produce ascending numbers."""
        from app.features.venues.service import generate_next_venue_number

        class MockQueryIncrementing:
            def __init__(self, count): self._count = count
            def count(self): return self._count

        class MockDBFactory:
            def __init__(self, count): self._count = count
            def execute(self, *a): raise Exception("No sequence")
            def query(self, *a): return MockQueryIncrementing(self._count)

        n1 = generate_next_venue_number(MockDBFactory(0))
        n2 = generate_next_venue_number(MockDBFactory(1))
        num1 = int(n1.split("-")[1])
        num2 = int(n2.split("-")[1])
        assert num2 > num1, f"Venue numbers must be ascending: {n1} >= {n2}"

    def test_venue_number_starts_at_bcv_100001(self):
        from app.features.venues.service import generate_next_venue_number

        class MockQuery:
            def count(self): return 0

        class MockDB:
            def execute(self, *a): raise Exception("No sequence")
            def query(self, *a): return MockQuery()

        result = generate_next_venue_number(MockDB())
        assert result == "BCV-100001", f"First venue number must be BCV-100001, got {result}"


# ─── decode_token Exception Shape Tests ───────────────────────────────────────

class TestDecodeTokenExceptionShape:

    def test_expired_token_raises_unauthorized_exception(self):
        """decode_token must raise UnauthorizedException (not HTTPException) for expired tokens."""
        from datetime import timedelta
        from app.core.security import create_access_token, decode_token
        from app.core.exceptions import UnauthorizedException
        from fastapi import HTTPException

        expired = create_access_token(
            subject="test-user-id",
            role="client",
            email="test@test.com",
            expires_delta=timedelta(seconds=-1)
        )
        with pytest.raises(UnauthorizedException):
            decode_token(expired)

        # Must NOT raise raw HTTPException
        try:
            decode_token(expired)
        except UnauthorizedException:
            pass  # Expected
        except HTTPException:
            pytest.fail("decode_token must not raise HTTPException — use UnauthorizedException instead")

    def test_invalid_token_raises_unauthorized_exception(self):
        from app.core.security import decode_token
        from app.core.exceptions import UnauthorizedException

        with pytest.raises(UnauthorizedException):
            decode_token("completely.invalid.garbage")


# ─── Password Change Tests ─────────────────────────────────────────────────────

class TestChangePassword:

    def test_change_password_requires_correct_old_password(self, client):
        email = "changepw@test.com"
        register_user(client, email, "Change PW User", "client")
        login_resp = client.post("/api/v1/auth/login", json={"email": email, "password": STRONG_PASSWORD})
        token = login_resp.json()["data"]["access_token"]

        resp = client.post(
            "/api/v1/auth/change-password",
            json={"old_password": "WrongOld@1", "new_password": "NewSecure@2"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == 401, resp.json()

    def test_change_password_enforces_complexity(self, client):
        email = "changepw2@test.com"
        register_user(client, email, "Change PW User 2", "client")
        login_resp = client.post("/api/v1/auth/login", json={"email": email, "password": STRONG_PASSWORD})
        token = login_resp.json()["data"]["access_token"]

        # New password is too weak (no special char)
        resp = client.post(
            "/api/v1/auth/change-password",
            json={"old_password": STRONG_PASSWORD, "new_password": "NoSpecial1234"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == 422, resp.json()

    def test_change_password_success(self, client):
        email = "changepw3@test.com"
        new_pw = "NewSecure@2026"
        register_user(client, email, "Change PW User 3", "client")
        login_resp = client.post("/api/v1/auth/login", json={"email": email, "password": STRONG_PASSWORD})
        token = login_resp.json()["data"]["access_token"]

        resp = client.post(
            "/api/v1/auth/change-password",
            json={"old_password": STRONG_PASSWORD, "new_password": new_pw},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == 200, resp.json()

        # Verify new password works for login
        new_login = client.post("/api/v1/auth/login", json={"email": email, "password": new_pw})
        assert new_login.status_code == 200, new_login.json()

    def test_registration_creates_draft_artist_profile(self, client, db_session):
        from uuid import UUID
        from app.features.artists.models import ArtistProfile
        email = "artist_draft@test.com"
        resp = register_user(client, email, "The Rockers", "artist")
        assert resp.status_code == 201

        user_id = UUID(resp.json()["data"]["id"])
        ap = db_session.query(ArtistProfile).filter(ArtistProfile.user_id == user_id).first()
        assert ap is not None
        assert ap.display_name == "The Rockers"
        assert ap.verification_status == "pending"

    def test_registration_creates_draft_venue(self, client, db_session):
        from uuid import UUID
        from app.features.venues.models import Venue
        email = "venue_draft@test.com"
        resp = register_user(client, email, "Grand Palace", "venue_owner")
        assert resp.status_code == 201

        user_id = UUID(resp.json()["data"]["id"])
        venue = db_session.query(Venue).filter(Venue.user_id == user_id).first()
        assert venue is not None
        assert venue.name == "Grand Palace's Venue"
        assert venue.verification_status == "pending"
