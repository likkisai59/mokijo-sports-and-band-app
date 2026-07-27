"""
Business logic service layers for handling registration login token updates and resets.
"""

import hashlib
from datetime import datetime, timedelta, timezone
from typing import Tuple
from sqlalchemy.orm import Session
from loguru import logger

from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.core.config import settings
from app.features.auth.crud import UserCRUD, RoleCRUD, RefreshTokenCRUD
from app.features.auth.models import User
from app.features.auth.schemas import UserRegister, UserLogin
from app.core.exceptions import ConflictException, UnauthorizedException, NotFoundException, BadRequestException


class AuthService:
    """Authentication and session lifecycle service methods."""

    def __init__(self):
        self.user_crud = UserCRUD()
        self.role_crud = RoleCRUD()
        self.token_crud = RefreshTokenCRUD()

    def _hash_token(self, token: str) -> str:
        """Hash a token string to store in DB safely."""
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    def _get_or_create_default_city(self, db: Session):
        from app.features.locations.models import Country, State, City
        city = db.query(City).first()
        if not city:
            country = db.query(Country).filter(Country.code == "IN").first()
            if not country:
                country = Country(name="India", code="IN")
                db.add(country)
                db.flush()
            state = db.query(State).filter(State.name == "Karnataka").first()
            if not state:
                state = State(name="Karnataka", country_id=country.id)
                db.add(state)
                db.flush()
            city = City(name="Bengaluru", state_id=state.id)
            db.add(city)
            db.flush()
        return city

    def register_user(self, db: Session, data: UserRegister) -> Tuple[User, bool]:
        """Registers a new platform user, assigns selected roles, and creates draft role entity."""
        # Check if email is already taken
        existing_user = self.user_crud.get_by_email(db, data.email)
        if existing_user:
            raise ConflictException(f"User with email {data.email} already exists.")

        # Resolve role mapping
        role = self.role_crud.get_by_name(db, data.role_name)
        if not role:
            # Auto-seed standard roles if missing (for easy sandbox development)
            role = self.role_crud.create(db, obj_in={"name": data.role_name, "description": f"{data.role_name} role"})

        # Hash credentials
        hashed_password = get_password_hash(data.password)
        
        # Create user database entry
        user = self.user_crud.create(
            db,
            obj_in={
                "email": data.email,
                "password_hash": hashed_password,
                "name": data.name,
                "is_active": True,
                "is_verified": False,
                "last_verification_sent_at": datetime.utcnow()
            }
        )

        # Attach roles mapping relationship
        user.roles.append(role)
        db.flush()

        # Immediately create corresponding draft role entity so dashboard APIs never fail with 404
        from uuid import UUID as PyUUID
        user_uuid = PyUUID(str(user.id)) if not isinstance(user.id, PyUUID) else user.id

        if data.role_name == "artist":
            from app.features.artists.models import ArtistProfile
            existing_ap = db.query(ArtistProfile).filter(ArtistProfile.user_id == user_uuid).first()
            if not existing_ap:
                draft_artist = ArtistProfile(
                    user_id=user_uuid,
                    display_name=user.name,
                    verification_status="pending"
                )
                db.add(draft_artist)
        elif data.role_name == "venue_owner":
            from app.features.venues.models import Venue
            from app.features.venues.service import generate_next_venue_number
            existing_venue = db.query(Venue).filter(Venue.user_id == user_uuid).first()
            if not existing_venue:
                city = self._get_or_create_default_city(db)
                venue_num = generate_next_venue_number(db)
                draft_venue = Venue(
                    user_id=user_uuid,
                    name=f"{user.name}'s Venue",
                    address="Pending Address",
                    city_id=city.id,
                    venue_number=venue_num,
                    verification_status="pending"
                )
                db.add(draft_venue)

        db.commit()
        db.refresh(user)

        # Generate custom verify token expiring in 24 hours
        verify_token = create_access_token(
            subject=str(user.id),
            role="verify",
            email=user.email,
            expires_delta=timedelta(hours=24)
        )
        logger.info(f"User registered successfully: {user.email} | Role: {data.role_name}")
        logger.info(f"Email verification initiated for {user.email}. Sandbox Verification link:\n{settings.APP_URL}/verify-email?token={verify_token}")

        # Attempt to dispatch verification email. If the email service is unreachable
        # we must NOT raise — the user account is already committed. Return email_sent=False
        # so the caller can surface a truthful status to the UI (e.g. "Check spam" or "Resend").
        email_sent = False
        try:
            from app.core.email import EmailService
            email_sent = EmailService.send_verification_email(user.email, verify_token)
        except Exception as e:
            logger.warning(f"Verification email dispatch failed for {user.email}: {e}")

        return user, email_sent


    def login_user(self, db: Session, data: UserLogin) -> Tuple[str, str]:
        """Logs in a user, returning access and refresh JWT tokens."""
        user = self.user_crud.get_by_email(db, data.email)
        if not user or not verify_password(data.password, user.password_hash):
            raise UnauthorizedException("Incorrect email or password.")

        if not user.is_active:
            raise UnauthorizedException("Your account is currently inactive. Contact system admin.")

        # Primary user role
        primary_role = user.roles[0].name if user.roles else "client"
        
        # Aggregate permissions from all roles
        permissions = list({perm.name for role in user.roles for perm in role.permissions})

        # Generate tokens
        access_token = create_access_token(
            subject=user.id,
            role=primary_role,
            email=user.email,
            permissions=permissions
        )
        refresh_token = create_refresh_token(subject=user.id)

        # Hash and store refresh token in database
        token_hash = self._hash_token(refresh_token)
        expiry = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
        # Revoke old active sessions
        self.token_crud.revoke_user_tokens(db, user.id)

        # Store new refresh token
        self.token_crud.create(
            db,
            obj_in={
                "user_id": user.id,
                "token_hash": token_hash,
                "expires_at": expiry,
                "is_revoked": False
            }
        )

        logger.info(f"Session established for user: {user.email}")
        return access_token, refresh_token

    def refresh_access_token(self, db: Session, refresh_token: str) -> str:
        """Verifies refresh token and issues a new access token."""
        token_payload = decode_token(refresh_token)
        user_id = token_payload.get("sub")
        
        if not user_id:
            raise UnauthorizedException("Invalid refresh token payload.")

        # Check DB to verify token is not revoked or expired
        token_hash = self._hash_token(refresh_token)
        db_token = self.token_crud.get_by_hash(db, token_hash)
        
        if not db_token or db_token.is_expired or db_token.is_revoked:
            raise UnauthorizedException("Refresh token is expired or revoked.")

        user = self.user_crud.get(db, db_token.user_id)
        if not user or not user.is_active:
            raise UnauthorizedException("User session is inactive.")

        primary_role = user.roles[0].name if user.roles else "client"
        permissions = list({perm.name for role in user.roles for perm in role.permissions})
        new_access_token = create_access_token(
            subject=user.id,
            role=primary_role,
            email=user.email,
            permissions=permissions
        )
        
        return new_access_token

    def logout_user(self, db: Session, refresh_token: str) -> None:
        """Logs out a user by revoking their refresh session tokens."""
        try:
            token_payload = decode_token(refresh_token)
            user_id = token_payload.get("sub")
            if user_id:
                token_hash = self._hash_token(refresh_token)
                db_token = self.token_crud.get_by_hash(db, token_hash)
                if db_token:
                    db_token.is_revoked = True
                    db.add(db_token)
                    db.commit()
                    logger.info(f"User {user_id} logged out successfully. Session token revoked.")
        except Exception:
            # Gracefully fail logout if token is already expired or invalid
            pass

    def initiate_forgot_password(self, db: Session, email: str) -> None:
        """Generates password reset sandbox logs placeholder."""
        user = self.user_crud.get_by_email(db, email)
        if not user:
            # Silent fallback to protect user enumeration attacks
            logger.info(f"Password reset requested for non-existent email: {email}")
            return

        # Generate custom reset token expiring in 1 hour
        reset_token = create_access_token(
            subject=user.id,
            role="reset",
            email=user.email,
            expires_delta=timedelta(hours=1)
        )
        
        logger.info(f"Password reset initiated for {email}. Sandbox Token link:\n{settings.APP_URL}/reset-password?token={reset_token}")
        from app.core.email import EmailService
        EmailService.send_password_reset_email(user.email, reset_token)

    def reset_password(self, db: Session, token: str, new_password: str) -> None:
        """Verifies token claims and resets user credentials password."""
        payload = decode_token(token)
        user_id = payload.get("sub")
        
        if not user_id:
            raise UnauthorizedException("Invalid reset token.")

        user = self.user_crud.get(db, user_id)
        if not user or not user.is_active:
            raise NotFoundException("User not found or suspended.")

        # Hash new credentials
        user.password_hash = get_password_hash(new_password)
        user.is_verified = True  # Resetting password also marks verified as safety
        db.add(user)
        
        # Revoke all old refresh sessions
        self.token_crud.revoke_user_tokens(db, user.id)
        db.commit()
        logger.info(f"Password successfully reset for user: {user.email}")

    def verify_email_token(self, db: Session, token: str) -> dict:
        """
        Verifies email verification token and flags user.is_verified to True.
        Returns a dict with keys: 'verified' (bool) and 'already_verified' (bool).
        Raises UnauthorizedException for tampered or expired tokens.
        """
        payload = decode_token(token)
        user_id = payload.get("sub")
        role = payload.get("role")
        
        if not user_id or role != "verify":
            raise UnauthorizedException("Invalid or expired verification token.")

        from uuid import UUID as PyUUID
        try:
            user_uuid = PyUUID(user_id)
        except (ValueError, AttributeError):
            raise UnauthorizedException("Invalid user ID format in token.")

        user = self.user_crud.get(db, user_uuid)
        if not user or not user.is_active:
            raise NotFoundException("User account not found or suspended.")

        role_name = user.roles[0].name if user.roles else "client"

        # Gracefully handle already-verified — do NOT error the account or issue new session tokens.
        if user.is_verified:
            logger.info(f"Email already verified for user: {user.email}")
            return {
                "verified": True,
                "already_verified": True,
                "role": role_name,
                "access_token": None,
                "refresh_token": None,
                "user": None
            }

        user.is_verified = True
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Email successfully verified for user: {user.email}")

        # First-time auto-login: generate access & refresh tokens
        permissions = list({perm.name for r in user.roles for perm in r.permissions})
        access_token = create_access_token(
            subject=user.id,
            role=role_name,
            email=user.email,
            permissions=permissions
        )
        refresh_token = create_refresh_token(subject=user.id)

        token_hash = self._hash_token(refresh_token)
        expiry = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        self.token_crud.revoke_user_tokens(db, user.id)
        self.token_crud.create(
            db,
            obj_in={
                "user_id": user.id,
                "token_hash": token_hash,
                "expires_at": expiry,
                "is_revoked": False
            }
        )

        from app.features.auth.schemas import UserResponse
        user_data = UserResponse.model_validate(user).model_dump(mode="json")

        return {
            "verified": True,
            "already_verified": False,
            "role": role_name,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user_data
        }



    def resend_verification_email(self, db: Session, email: str) -> bool:
        """Resends email verification token if not already verified with a 60s cooldown limit."""
        user = self.user_crud.get_by_email(db, email)
        if not user:
            raise NotFoundException("User account not found.")

        if user.is_verified:
            raise ConflictException("Email already verified.")

        if user.last_verification_sent_at:
            # Determine elapsed seconds
            elapsed = (datetime.utcnow() - user.last_verification_sent_at).total_seconds()
            if elapsed < 60:
                raise BadRequestException(f"Please wait {int(60 - elapsed)} seconds before requesting another email.")

        # Update cooldown timestamp
        user.last_verification_sent_at = datetime.utcnow()
        db.add(user)
        db.commit()

        # Generate custom verify token expiring in 24 hours
        verify_token = create_access_token(
            subject=str(user.id),
            role="verify",
            email=user.email,
            expires_delta=timedelta(hours=24)
        )
        logger.info(f"Email verification resent for {user.email}. Sandbox Verification link:\n{settings.APP_URL}/verify-email?token={verify_token}")
        
        from app.core.email import EmailService
        return EmailService.send_verification_email(user.email, verify_token)

    def toggle_user_activity(self, db: Session, user_id: str, is_active: bool) -> User:
        """Suspends or activates a user account profile by changing active flag status."""
        user = self.user_crud.get(db, user_id)
        if not user:
            raise NotFoundException("User not found.")
        user.is_active = is_active
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"User account {user.email} activity status toggled to: {is_active}")
        return user

    def soft_delete_user(self, db: Session, user_id: str) -> None:
        """Flags user account details for logical deletion placeholder."""
        import uuid
        uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
        user = self.user_crud.get(db, uid)
        if not user:
            raise NotFoundException("User not found.")
        
        # Base model inherits soft delete method: update deleted_at
        user.deleted_at = datetime.utcnow()
        db.add(user)
        
        # Revoke active refresh tokens
        self.token_crud.revoke_user_tokens(db, user.id)
        db.commit()
        logger.info(f"User account {user.email} marked for logical deletion.")

    def bulk_toggle_user_activity(self, db: Session, user_ids: list[str], is_active: bool) -> None:
        """Bulk updates activity flags for user ids list."""
        db.query(User).filter(
            User.id.in_(user_ids),
            User.deleted_at.is_(None)
        ).update({"is_active": is_active}, synchronize_session=False)
        db.commit()
        logger.info(f"Bulk toggled activity status to {is_active} for {len(user_ids)} users.")

    def change_password(self, db: Session, user_id: str, old_password: str, new_password: str) -> None:
        """Verifies old password and updates it to new password."""
        import uuid
        uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
        user = self.user_crud.get(db, uid)
        if not user or user.deleted_at is not None:
            raise NotFoundException("User not found.")
            
        if not verify_password(old_password, user.password_hash):
            raise UnauthorizedException("Incorrect old password.")
            
        user.password_hash = get_password_hash(new_password)
        db.add(user)
        db.commit()
        logger.info(f"Password successfully changed for user: {user.email}")
