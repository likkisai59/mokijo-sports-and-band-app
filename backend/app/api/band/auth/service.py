"""Band Auth Service layer — business logic for registration, direct login, and token generation."""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import verify_password, create_access_token
from app.models.band_models import BandAccount, BandArtistProfile, BandVenue
from app.models import band_schemas as schemas
from app.api.band.auth import crud


def register(db: Session, payload: schemas.BandRegisterRequest) -> schemas.BandTokenResponse:
    """Register a new BandAccount and return JWT access token for direct login."""
    existing = crud.get_account_by_email(db, payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        )

    # Validate allowed registration roles (cannot self-register as admin)
    if payload.role not in ["client", "artist", "venue_owner"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role specified for registration.",
        )

    # Create account (is_verified = True for direct email/password login workflow)
    account = crud.create_account(
        db=db,
        email=payload.email,
        password=payload.password,
        name=payload.name,
        role=payload.role,
        phone=payload.phone,
        is_verified=True,
    )

    # Provision default profile entity for Artist or Venue Owner
    if payload.role == "artist":
        username_val = getattr(payload, "username", None)
        if username_val:
            username_val = username_val.lower().strip()
            existing_artist = (
                db.query(BandArtistProfile)
                .filter(BandArtistProfile.username == username_val)
                .first()
            )
            if existing_artist:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This artist username is already taken. Please choose another.",
                )
        clean_username = username_val if username_val else f"{account.name.lower().replace(' ', '_')}_{account.id}"
        artist_profile = BandArtistProfile(
            account_id=account.id,
            display_name=account.name,
            username=clean_username,
            verification_status="approved",
            base_rate=25000.0,
            rating=5.0,
            band_type="Band",
            profile_image="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
            cover_image="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80",
        )
        db.add(artist_profile)
        db.commit()
    elif payload.role == "venue_owner":
        venue_profile = BandVenue(
            account_id=account.id,
            name=f"{account.name}'s Venue",
            address="Address pending update",
            verification_status="pending",
            base_price=0.0,
        )
        db.add(venue_profile)
        db.commit()

    # Generate JWT token
    token = create_access_token(
        subject=str(account.id),
        role=account.role,
        email=account.email,
    )

    return schemas.BandTokenResponse(
        access_token=token,
        token_type="bearer",
        user=schemas.BandAccountResponse.model_validate(account),
    )


def login(db: Session, payload: schemas.BandLoginRequest) -> schemas.BandTokenResponse:
    """Authenticate with direct email/password and issue JWT access token."""
    account = crud.get_account_by_email(db, payload.email)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password.",
        )

    if not verify_password(payload.password, account.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password.",
        )

    if not account.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact support.",
        )

    token = create_access_token(
        subject=str(account.id),
        role=account.role,
        email=account.email,
    )

    return schemas.BandTokenResponse(
        access_token=token,
        token_type="bearer",
        user=schemas.BandAccountResponse.model_validate(account),
    )


def change_password(
    db: Session, account: BandAccount, payload: schemas.BandChangePasswordRequest
) -> dict:
    """Update password for authenticated user."""
    if not verify_password(payload.current_password, account.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password does not match.",
        )
    crud.update_password(db, account, payload.new_password)
    return {"message": "Password changed successfully."}


def delete_me(db: Session, account: BandAccount) -> dict:
    """Soft-delete account."""
    crud.soft_delete_account(db, account)
    return {"message": "Account successfully deleted."}
