from fastapi import APIRouter, Depends, Request, HTTPException, status
from typing import List
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import date, datetime

from app.models import schemas
from app.connectors.connection_service import ConnectionService
from app.auth.authorization import check_user_authorization, validate_role_and_permission
from app.core.security import hash_password, verify_password, create_access_token
from app.logger import logger


from app.api.mokijo.venue_owner import crud

async def register_venue_owner(request: Request, db: Session, payload: schemas.VenueOwnerRegister):
    try:
        with logger.time_operation("REGISTER_VENUE_OWNER", request=request):
            email_clean = payload.owner.email.replace(" ", "").lower()

            existing = crud.get_owner_by_email(db, email_clean)
            if existing:
                raise HTTPException(status_code=400, detail="Email already registered as a venue owner.")

            insert_owner = {
                "full_name": payload.owner.full_name.strip(),
                "dob": payload.owner.dob,
                "email": email_clean,
                "phone": payload.owner.phone.strip(),
                "aadhar_number": payload.owner.aadhar_number,
                "password": hash_password(payload.owner.password.strip()),
                "is_verified": True
            }
            owner_id = crud.create_venue_owner(db, insert_owner)

            created_venues_count = 0
            for v in payload.venues:
                insert_venue = {
                    "venue_owner_id": owner_id,
                    "owner_id": None,
                    "name": v.name.strip(),
                    "location": v.location.strip(),
                    "landmark": v.landmark,
                    "sports_supported": v.sports_supported,
                    "sport_prices": v.sport_prices,
                    "base_price_per_hour": v.base_price_per_hour or 0,
                    "amenities": v.amenities,
                    "cover_image": v.cover_image,
                    "venue_images": v.venue_images,
                    "opening_time": v.opening_time,
                    "closing_time": v.closing_time,
                    "days_open": v.days_open,
                    "slot_duration": v.slot_duration or 60,
                    "rating": 5.0,
                    "verification_status": "DRAFT",
                    "contact_phone": v.contact_phone,
                    "contact_email": v.contact_email,
                    "city": v.city,
                    "state_name": v.state_name,
                    "postal_code": v.postal_code,
                }
                crud.create_venue(db, insert_venue)
                created_venues_count += 1

            owner = crud.get_venue_owner_by_id(db, owner_id)
            return {
                "message": "Venue registered successfully!",
                "ownerId": owner.get("id"),
                "ownerName": owner.get("full_name"),
                "venuesCount": created_venues_count
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to register venue owner: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def login_venue_owner(request: Request, db: Session, credentials: schemas.VenueOwnerLogin):
    try:
        with logger.time_operation("LOGIN_VENUE_OWNER", request=request):
            email_clean = credentials.email.replace(" ", "").lower()
            owner = crud.get_owner_by_email(db, email_clean)

            if not owner:
                raise HTTPException(status_code=400, detail="Invalid email or password.")
            if not verify_password(credentials.password.strip(), owner.get("password")):
                raise HTTPException(status_code=400, detail="Invalid email or password.")

            # Migrate plain password if not hashed properly
            hashed_pw = owner.get("password")
            if hashed_pw and not (hashed_pw.startswith("$2b$") or hashed_pw.startswith("$2a$")):
                new_hash = hash_password(credentials.password.strip())
                crud.update_owner_password(db, owner.get("id"), new_hash)

            access_token = create_access_token({"sub": str(owner.get("id")), "role": "venue_owner"})
            return {
                "message": "Login successful",
                "ownerId": owner.get("id"),
                "ownerName": owner.get("full_name"),
                "ownerEmail": owner.get("email"),
                "isVenueOwner": True,
                "access_token": access_token,
                "token_type": "bearer"
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed venue owner login: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_owner_venues(request: Request, db: Session, owner_id: int, current_user: dict):
    try:
        with logger.time_operation("GET_OWNER_VENUES", request=request):
            validate_role_and_permission(db, current_user, ["venue_owner"], owner_id)
            venues = crud.get_venues_by_owner_id(db, owner_id)
            return [
                {
                    "id": v.get("id"),
                    "name": v.get("name"),
                    "location": v.get("location"),
                    "landmark": v.get("landmark"),
                    "sports_supported": v.get("sports_supported"),
                    "amenities": v.get("amenities"),
                    "cover_image": v.get("cover_image"),
                    "venue_images": v.get("venue_images"),
                    "opening_time": v.get("opening_time"),
                    "closing_time": v.get("closing_time"),
                    "days_open": v.get("days_open"),
                    "slot_duration": v.get("slot_duration"),
                    "rating": v.get("rating"),
                    "verification_status": v.get("verification_status", "DRAFT"),
                    "is_verified": v.get("verification_status") == "VERIFIED",
                    "rejection_reason": v.get("rejection_reason"),
                    "verification_notes": v.get("verification_notes"),
                    "contact_phone": v.get("contact_phone"),
                    "contact_email": v.get("contact_email"),
                    "city": v.get("city"),
                    "state_name": v.get("state_name"),
                    "postal_code": v.get("postal_code"),
                }
                for v in venues
            ]
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed getting owner venues: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def update_venue(request: Request, db: Session, venue_id: int, data: schemas.VenueInput, owner_id: int, current_user: dict):
    try:
        with logger.time_operation("UPDATE_VENUE", request=request):
            venue = crud.get_venue_by_id_and_owner(db, venue_id, owner_id)
            if not venue:
                raise HTTPException(status_code=404, detail="Venue not found or access denied.")

            current_status = venue.get("verification_status", "DRAFT")
            new_status = current_status
            if current_status in ["MORE_INFO_REQUIRED", "REJECTED"]:
                new_status = "DRAFT"

            crud.update_venue_details(db, venue_id, {
                "name": data.name.strip(),
                "location": data.location.strip(),
                "landmark": data.landmark,
                "sports_supported": data.sports_supported,
                "amenities": data.amenities,
                "cover_image": data.cover_image,
                "venue_images": data.venue_images,
                "opening_time": data.opening_time,
                "closing_time": data.closing_time,
                "days_open": data.days_open,
                "slot_duration": data.slot_duration or 60,
                "verification_status": new_status,
                "contact_phone": data.contact_phone,
                "contact_email": data.contact_email,
                "city": data.city,
                "state_name": data.state_name,
                "postal_code": data.postal_code
            })

            return {"message": "Venue updated successfully.", "id": venue_id, "verification_status": new_status}
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed updating venue: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_bookings_for_venue_owner(request: Request, db: Session, owner_id: int, current_user: dict):
    try:
        with logger.time_operation("GET_BOOKINGS_VENUE_OWNER", request=request):
            validate_role_and_permission(db, current_user, ["venue_owner"], owner_id)
            venues = crud.get_venue_basics_by_owner(db, owner_id)
            venue_ids = [v.get("id") for v in venues]
            venue_map = {v.get("id"): v.get("name") for v in venues}

            if not venue_ids:
                return []

            placeholders = ", ".join(["%s"] * len(venue_ids))
            bookings = crud.get_bookings_for_venues(db, venue_ids)

            # Sort by booking_date DESC in python
            bookings_sorted = sorted(
                bookings,
                key=lambda x: x.get("booking_date") or datetime.min,
                reverse=True
            )

            result = []
            for b in bookings_sorted:
                user = crud.get_user_basic(db, b.get("user_id"))
                result.append({
                    "booking_id": b.get("id"),
                    "venue_id": b.get("venue_id"),
                    "venue_name": venue_map.get(b.get("venue_id"), "Unknown"),
                    "sport": b.get("sport"),
                    "start_time": b.get("start_time").isoformat() if b.get("start_time") else None,
                    "end_time": b.get("end_time").isoformat() if b.get("end_time") else None,
                    "amount_paid": b.get("amount_paid"),
                    "payment_status": b.get("payment_status"),
                    "booking_status": b.get("status"),
                    "booking_date": b.get("booking_date").isoformat() if b.get("booking_date") else None,
                    "customer_name": f"{user.get('first_name')} {user.get('last_name')}" if user else "Guest",
                    "customer_email": user.get("email") if user else "",
                })
            return result
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed getting bookings for venue owner: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
