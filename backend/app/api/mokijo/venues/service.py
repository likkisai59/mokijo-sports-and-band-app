from fastapi import APIRouter, Depends, Request, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
import math
import hmac
import uuid

from app.models import schemas
from app.connectors.connection_service import ConnectionService
from app.auth.authorization import check_user_authorization, validate_role_and_permission
from app.core.config import get_settings
from app.services.razorpay import call_razorpay_api, build_razorpay_signature, get_razorpay_credentials
from app.logger import logger
from app.api.mokijo.venues import crud

settings = get_settings()


def serialize_venue(venue, db):
    if not venue:
        return None
    # Attach distance dynamically if calculated
    distance = getattr(venue, "distance", None) if hasattr(venue, "distance") else venue.get("distance", None)
    return {
        "id": venue.get("id"),
        "owner_id": venue.get("owner_id"),
        "venue_owner_id": venue.get("venue_owner_id"),
        "name": venue.get("name"),
        "location": venue.get("location"),
        "latitude": venue.get("latitude"),
        "longitude": venue.get("longitude"),
        "sports_supported": venue.get("sports_supported"),
        "amenities": venue.get("amenities"),
        "base_price_per_hour": venue.get("base_price_per_hour"),
        "rating": venue.get("rating"),
        "cover_image": venue.get("cover_image"),
        "venue_images": venue.get("venue_images"),
        "distance": distance,
        "verification_status": venue.get("verification_status", "DRAFT"),
        "is_verified": venue.get("verification_status") == "VERIFIED",
        "verified_at": venue.get("verified_at").isoformat() if venue.get("verified_at") else None,
    }


def serialize_slot(slot):
    if not slot:
        return None
    return {
        "id": slot.get("id"),
        "venue_id": slot.get("venue_id"),
        "sport": slot.get("sport"),
        "start_time": slot.get("start_time").isoformat() if slot.get("start_time") else None,
        "end_time": slot.get("end_time").isoformat() if slot.get("end_time") else None,
        "base_price": slot.get("base_price"),
        "current_price": slot.get("current_price"),
        "is_blocked": slot.get("is_blocked") or False,
        "status": slot.get("status") or "AVAILABLE"
    }


def serialize_booking(booking, db):
    if not booking:
        return None
    slots = crud.get_slots_by_booking_id(db, booking.get("id"))
    venue_info = None
    venue_id = None
    if slots:
        venue_id = slots[0].get("venue_id")
    if venue_id:
        venue = crud.get_venue_basic(db, venue_id)
        if venue:
            venue_info = {
                "id": venue.get("id"),
                "name": venue.get("name"),
                "location": venue.get("location"),
                "cover_image": venue.get("cover_image"),
            }
    return {
        "id": booking.get("id"),
        "user_id": booking.get("user_id"),
        "court_id": booking.get("court_id"),
        "booking_date": booking.get("booking_date").isoformat() if booking.get("booking_date") else None,
        "amount_paid": float(booking.get("amount_paid") or 0),
        "payment_status": booking.get("payment_status"),
        "status": booking.get("status"),
        "payment_id": booking.get("payment_id"),
        "cancelled_at": booking.get("cancelled_at").isoformat() if booking.get("cancelled_at") else None,
        "cancellation_reason": booking.get("cancellation_reason"),
        "slots": [serialize_slot(s) for s in slots],
        "venue": venue_info,
    }




async def create_venue(request: Request, db: Session, venue: schemas.VenueCreate, current_user: dict):
    try:
        with logger.time_operation("CREATE_VENUE", request=request):
            insert_data = {
                "owner_id": venue.owner_id,
                "name": venue.name,
                "location": venue.location,
                "latitude": venue.latitude,
                "longitude": venue.longitude,
                "sports_supported": venue.sports_supported,
                "amenities": venue.amenities,
                "rating": venue.rating or 5.0,
                "cover_image": venue.cover_image,
                "venue_images": venue.venue_images,
                "verification_status": "DRAFT",
            }
            v_id = crud.create_venue(db, insert_data)
            new_v = crud.get_venue(db, v_id)
            return serialize_venue(new_v, db)
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to create venue: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_venues(
        self,
        request: Request,
        sport: Optional[str],
        location: Optional[str],
        min_price: Optional[int],
        max_price: Optional[int],
        min_rating: Optional[float],
        latitude: Optional[float],
        longitude: Optional[float],
        max_distance: Optional[float],
        date_str: Optional[str],
        only_available: Optional[bool],
        current_user: dict,
        registered: Optional[bool] = False,
    ):
        try:
            with logger.time_operation("GET_VENUES", request=request):
                # Club admin / discovery of owner-registered venues vs public verified-only list
                # Verification gating deferred — all owner-registered venues are bookable for now
                venues = crud.get_venues_filtered(db, sport, location, min_price, max_price, min_rating)

                # Calculate distances if coordinates are provided
                if latitude is not None and longitude is not None:
                    venues_with_distance = []
                    for venue in venues:
                        v_lat = venue.get("latitude")
                        v_lon = venue.get("longitude")
                        if v_lat is not None and v_lon is not None:
                            R = 6371.0
                            lat1_rad = math.radians(latitude)
                            lon1_rad = math.radians(longitude)
                            lat2_rad = math.radians(v_lat)
                            lon2_rad = math.radians(v_lon)

                            dlat = lat2_rad - lat1_rad
                            dlon = lon2_rad - lon1_rad

                            a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
                            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
                            dist = R * c
                            venue["distance"] = round(dist, 2)
                        else:
                            venue["distance"] = None
                        venues_with_distance.append(venue)

                    if max_distance is not None:
                        venues_with_distance = [
                            v for v in venues_with_distance
                            if v.get("distance") is not None and v.get("distance") <= max_distance
                        ]

                    venues = sorted(
                        venues_with_distance,
                        key=lambda x: (x.get("distance") is None, x.get("distance") or float('inf'))
                    )
                else:
                    for venue in venues:
                        venue["distance"] = None

                # Filter by availability
                if only_available:
                    if not date_str:
                        target_date_str = date.today().isoformat()
                    else:
                        target_date_str = date_str

                    try:
                        target_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
                    except ValueError:
                        raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD.")

                    available_venues = []
                    for venue in venues:
                        slots = crud.get_slots_by_venue_and_date(db, venue.get("id"), target_date)
                        if not slots:
                            available_venues.append(venue)
                        else:
                            has_available_slot = False
                            # Gather slot bookings for evaluation
                            slot_ids = [s.get("id") for s in slots]
                            placeholders = ", ".join(["%s"] * len(slot_ids))
                            active_bookings = crud.get_active_bookings_for_slots(db, slot_ids)
                            booked_slot_ids = {b.get("slot_id") for b in active_bookings}

                            for slot in slots:
                                if not slot.get("is_blocked"):
                                    if slot.get("status") == "AVAILABLE":
                                        if slot.get("id") not in booked_slot_ids:
                                            has_available_slot = True
                                            break
                                    elif slot.get("status") == "HELD" and slot.get("held_until") and slot.get("held_until") < datetime.utcnow():
                                        has_available_slot = True
                                        break
                            if has_available_slot:
                                available_venues.append(venue)
                    venues = available_venues

                return [serialize_venue(v, db) for v in venues]
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed getting venues: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

async def create_venue_slots(request: Request, db: Session, venue_id: int, slots: List[schemas.SlotCreate], current_user: dict):
    try:
        with logger.time_operation("CREATE_VENUE_SLOTS", request=request):
            created_slot_ids = []
            for slot in slots:
                insert_data = {
                    "venue_id": venue_id,
                    "sport": slot.sport,
                    "start_time": slot.start_time,
                    "end_time": slot.end_time,
                    "base_price": slot.base_price,
                    "current_price": slot.current_price,
                    "is_blocked": slot.is_blocked or False,
                    "status": "AVAILABLE"
                }
                slot_id = crud.create_slot(db, insert_data)
                created_slot_ids.append(slot_id)

            placeholders = ", ".join(["%s"] * len(created_slot_ids))
            new_slots = crud.get_slots_by_ids(db, placeholders, tuple(created_slot_ids))
            return [serialize_slot(s) for s in new_slots]
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed creating slots: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_venue_slots(request: Request, db: Session, venue_id: int, date_str: Optional[str], current_user: dict):
    try:
        with logger.time_operation("GET_VENUE_SLOTS", request=request):
            if not date_str:
                date_str = date.today().isoformat()

            try:
                target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD.")

            venue = crud.get_venue(db, venue_id)
            if not venue:
                raise HTTPException(status_code=404, detail="Venue not found")

            now = datetime.utcnow()
            expired_held = crud.get_expired_held_slots(db, venue_id, target_date, now)
            if expired_held:
                expired_ids = [s.get("id") for s in expired_held]
                placeholders = ", ".join(["%s"] * len(expired_ids))
                crud.release_slots(db, expired_ids)

            # NOTE: Slots are no longer auto-seeded with hardcoded defaults here.
            # Venue owners must explicitly create slots via POST /venues/{venue_id}/slots.
            # If none exist yet for the requested date, this simply returns an empty list.
            slots = crud.get_slots_by_venue_and_date(db, venue_id, target_date)

            if slots:
                slot_ids = [s.get("id") for s in slots]
                placeholders = ", ".join(["%s"] * len(slot_ids))
                active_bookings = crud.get_active_bookings_for_slots(db, slot_ids)
                booked_slot_ids = {b.get("slot_id") for b in active_bookings}

                for slot in slots:
                    if slot.get("status") == "AVAILABLE" and slot.get("id") in booked_slot_ids:
                        # Update dynamically in response/db
                        crud.update_slot_status(db, slot.get("id"), "BOOKED")
                        slot["status"] = "BOOKED"

            return [serialize_slot(s) for s in slots]
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed getting venue slots: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def create_booking(request: Request, db: Session, booking: schemas.BookingCreate, current_user: dict):
    try:
        with logger.time_operation("CREATE_BOOKING", request=request):
            if not booking.slot_ids:
                raise HTTPException(status_code=400, detail="No slot IDs specified")

            placeholders = ", ".join(["%s"] * len(booking.slot_ids))
            slots = crud.get_slots_for_update(db, booking.slot_ids)

            if len(slots) != len(booking.slot_ids):
                raise HTTPException(status_code=404, detail="One or more slots not found.")

            now = datetime.utcnow()
            for slot in slots:
                if slot.get("is_blocked"):
                    raise HTTPException(status_code=400, detail=f"Slot ID {slot.get('id')} is blocked.")

                if slot.get("status") == "BOOKED":
                    raise HTTPException(status_code=409, detail=f"Slot ID {slot.get('id')} is already booked.")

                if slot.get("status") == "HELD":
                    held_until = slot.get("held_until")
                    if held_until and held_until < now:
                        crud.release_slot(db, slot.get("id"))
                        slot["status"] = "AVAILABLE"
                        slot["held_until"] = None
                        slot["held_by_user_id"] = None
                    elif slot.get("held_by_user_id") != booking.user_id:
                        raise HTTPException(status_code=409, detail=f"Slot ID {slot.get('id')} is currently held by another user.")

            status_val = booking.status or "reserved"
            user_id = booking.user_id
            total_amount = booking.amount_paid or sum(slot.get("current_price") or 0 for slot in slots)

            insert_booking = {
                "user_id": user_id,
                "court_id": booking.court_id,
                "amount_paid": total_amount,
                "payment_status": booking.payment_status or "pending",
                "status": status_val,
                "booking_date": datetime.utcnow()
            }
            b_id = crud.create_booking(db, insert_booking)

            held_expiry = None
            if status_val == "pending_approval":
                held_expiry = datetime.utcnow() + timedelta(minutes=30)

            for slot in slots:
                crud.create_booking_slot(db, b_id, slot.get("id"))
                if status_val == "pending_approval":
                    crud.hold_slot(db, slot.get("id"), held_expiry, user_id)
                else:
                    crud.update_slot_status(db, slot.get("id"), "BOOKED")

            new_booking = crud.get_booking(db, b_id)
            if status_val == "pending_approval":
                _send_booking_notification(db, current_user, slots, b_id, "request")
            return serialize_booking(new_booking, db)
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to create booking: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_owner_venues(request: Request, db: Session, owner_id: int, current_user: dict):
    try:
        with logger.time_operation("GET_OWNER_VENUES", request=request):
            venues = crud.get_venues_by_owner(db, owner_id)
            return [serialize_venue(v, db) for v in venues]
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed getting owner venues: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def block_venue_slots(request: Request, db: Session, venue_id: int, req: schemas.BlockSlotsRequest, current_user: dict):
    try:
        with logger.time_operation("BLOCK_VENUE_SLOTS", request=request):
            try:
                start_date = datetime.strptime(req.start_date, "%Y-%m-%d").date()
                end_date = datetime.strptime(req.end_date, "%Y-%m-%d").date()
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

            if start_date > end_date:
                raise HTTPException(status_code=400, detail="Start date must be before or equal to end date.")

            venue = crud.get_venue_id(db, venue_id)
            if not venue:
                raise HTTPException(status_code=404, detail="Venue not found")

            crud.block_slots_bulk(db, venue_id, start_date, end_date, req.sport)
            return {"message": f"Successfully blocked slots between {req.start_date} and {req.end_date}."}
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed blocking slots: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def unblock_venue_slots(request: Request, db: Session, venue_id: int, req: schemas.UnblockSlotsRequest, current_user: dict):
    try:
        with logger.time_operation("UNBLOCK_VENUE_SLOTS", request=request):
            try:
                start_date = datetime.strptime(req.start_date, "%Y-%m-%d").date()
                end_date = datetime.strptime(req.end_date, "%Y-%m-%d").date()
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

            if start_date > end_date:
                raise HTTPException(status_code=400, detail="Start date must be before or equal to end date.")

            venue = crud.get_venue_id(db, venue_id)
            if not venue:
                raise HTTPException(status_code=404, detail="Venue not found")

            crud.unblock_slots_bulk(db, venue_id, start_date, end_date, req.sport)
            return {"message": f"Successfully unblocked slots between {req.start_date} and {req.end_date}."}
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed unblocking slots: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

def _get_toggleable_slot(self, db, venue_id: int, slot_id: int):
    venue = crud.get_venue_id(db, venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")

    slot = crud.get_slot_by_id_and_venue(db, slot_id, venue_id)
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found for this venue")

    status_val = (slot.get("status") or "AVAILABLE").upper()
    if status_val == "BOOKED":
        raise HTTPException(status_code=400, detail="Cannot change availability of a booked slot.")

    if status_val == "HELD":
        held_until = slot.get("held_until")
        now = datetime.utcnow()
        if held_until and held_until > now:
            raise HTTPException(status_code=400, detail="Cannot change availability of a slot currently on hold.")
        crud.release_slot(db, slot_id)
        slot["status"] = "AVAILABLE"
        slot["held_until"] = None
        slot["held_by_user_id"] = None

    return slot

async def block_single_slot(request: Request, db: Session, venue_id: int, slot_id: int, current_user: dict):
    try:
        with logger.time_operation("BLOCK_SINGLE_SLOT", request=request):
            _get_toggleable_slot(db, venue_id, slot_id)
            crud.block_slot(db, slot_id, venue_id)
            updated = crud.get_slot_by_id_and_venue(db, slot_id, venue_id)
            return serialize_slot(updated)
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed blocking single slot: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def unblock_single_slot(request: Request, db: Session, venue_id: int, slot_id: int, current_user: dict):
    try:
        with logger.time_operation("UNBLOCK_SINGLE_SLOT", request=request):
            _get_toggleable_slot(db, venue_id, slot_id)
            crud.unblock_slot(db, slot_id, venue_id)
            updated = crud.get_slot_by_id_and_venue(db, slot_id, venue_id)
            return serialize_slot(updated)
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed unblocking single slot: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_venue_payouts(request: Request, db: Session, venue_id: int, current_user: dict):
    try:
        with logger.time_operation("GET_VENUE_PAYOUTS", request=request):
            venue = crud.get_venue_id(db, venue_id)
            if not venue:
                raise HTTPException(status_code=404, detail="Venue not found")

            bookings = crud.get_paid_bookings_by_venue(db, venue_id)

            total_revenue = sum(float(b.get("amount_paid") or 0) for b in bookings)
            platform_fee = round(total_revenue * 0.10, 2)
            final_payout = round(total_revenue * 0.90, 2)

            payout_history = []
            monthly_data = {}

            for booking in bookings:
                b_date = booking.get("booking_date")
                if b_date:
                    month_key = b_date.strftime("%Y-%m")
                    monthly_data[month_key] = monthly_data.get(month_key, 0) + float(booking.get("amount_paid") or 0)

            sorted_months = sorted(monthly_data.keys(), reverse=True)
            for i, month in enumerate(sorted_months):
                m_revenue = monthly_data[month]
                m_payout = round(m_revenue * 0.90, 2)
                current_month = datetime.utcnow().strftime("%Y-%m")
                status = "processing" if month == current_month else "transferred"

                payout_history.append({
                    "id": f"PAY-{venue_id}-{month.replace('-', '')}",
                    "date": f"{month}-28",
                    "amount": m_payout,
                    "status": status,
                    "utr": f"UTR{venue_id:04d}{month.replace('-', '')}{i:02d}" if status == "transferred" else "PENDING"
                })

            if not payout_history:
                payout_history.append({
                    "id": f"PAY-{venue_id}-MOCK",
                    "date": datetime.utcnow().strftime("%Y-%m-%d"),
                    "amount": 0.0,
                    "status": "processing",
                    "utr": "PENDING"
                })

            return {
                "total_revenue": total_revenue,
                "platform_fee": platform_fee,
                "final_payout": final_payout,
                "payout_history": payout_history
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed getting payouts: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_venue_analytics(request: Request, db: Session, venue_id: int, current_user: dict):
    try:
        with logger.time_operation("GET_VENUE_ANALYTICS", request=request):
            venue = crud.get_venue_id(db, venue_id)
            if not venue:
                raise HTTPException(status_code=404, detail="Venue not found")

            slots_count = crud.get_venue_slots_count(db, venue_id)
            total_slots = slots_count.get("count", 0) if slots_count else 0

            bookings = crud.get_bookings_by_venue_with_time(db, venue_id)

            total_bookings = len(bookings)
            paid_bookings = [b for b in bookings if b.get("payment_status") == "paid"]
            total_revenue = sum(float(b.get("amount_paid") or 0) for b in paid_bookings)
            occupancy_rate = round((total_bookings / total_slots * 100), 1) if total_slots > 0 else 0.0

            hour_counts = {}
            for booking in bookings:
                s_time = booking.get("start_time")
                if s_time:
                    hour_str = s_time.strftime("%I:%M %p")
                    hour_counts[hour_str] = hour_counts.get(hour_str, 0) + 1

            peak_hours = []
            for time_slot, count in hour_counts.items():
                pct = round((count / total_bookings * 100), 1) if total_bookings > 0 else 0.0
                peak_hours.append({
                    "time": time_slot,
                    "bookings_count": count,
                    "percentage": pct
                })
            peak_hours = sorted(peak_hours, key=lambda x: x["bookings_count"], reverse=True)[:5]

            monthly_revenue = {}
            for b in paid_bookings:
                b_date = b.get("booking_date")
                if b_date:
                    month_name = b_date.strftime("%B %Y")
                    monthly_revenue[month_name] = monthly_revenue.get(month_name, 0.0) + float(b.get("amount_paid") or 0)

            revenue_trends = []
            if not monthly_revenue:
                revenue_trends.append({
                    "month": datetime.utcnow().strftime("%B %Y"),
                    "revenue": 0.0
                })
            else:
                for month, rev in monthly_revenue.items():
                    revenue_trends.append({
                        "month": month,
                        "revenue": rev
                    })
                # Sort revenue trends chronologically or alphabetically
                revenue_trends = sorted(revenue_trends, key=lambda x: x["month"])

            user_bookings = {}
            for b in bookings:
                u_id = b.get("user_id")
                if u_id:
                    user_bookings.setdefault(u_id, []).append(b)

            customer_retention = []
            for u_id, u_b in user_bookings.items():
                user = crud.get_user_basic(db, u_id)
                u_name = f"{user.get('first_name')} {user.get('last_name')}" if user else f"User {u_id}"
                u_email = user.get("email") if user else "N/A"

                bookings_count = len(u_b)
                is_repeat = bookings_count > 1

                customer_retention.append({
                    "user_id": u_id,
                    "user_name": u_name,
                    "user_email": u_email,
                    "bookings_count": bookings_count,
                    "is_repeat": is_repeat
                })
            customer_retention = sorted(customer_retention, key=lambda x: x["bookings_count"], reverse=True)[:10]

            return {
                "occupancy_rate": occupancy_rate,
                "total_revenue": total_revenue,
                "total_bookings": total_bookings,
                "peak_hours": peak_hours,
                "revenue_trends": revenue_trends,
                "customer_retention": customer_retention
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed analytics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def create_court(request: Request, db: Session, venue_id: int, court: schemas.CourtCreate, current_user: dict):
    try:
        with logger.time_operation("CREATE_COURT", request=request):
            venue = crud.get_venue_id(db, venue_id)
            if not venue:
                raise HTTPException(status_code=404, detail="Venue not found")

            insert_data = {
                "venue_id": venue_id,
                "name": court.name,
                "sport_type": court.sport_type,
                "capacity": court.capacity,
                "price_per_hour": court.price_per_hour
            }
            c_id = crud.create_court(db, insert_data)
            new_c = crud.get_court(db, c_id)
            return new_c
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed creating court: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def create_review(request: Request, db: Session, venue_id: int, review: schemas.ReviewCreate, current_user: dict):
    try:
        with logger.time_operation("CREATE_REVIEW", request=request):
            venue = crud.get_venue_id(db, venue_id)
            if not venue:
                raise HTTPException(status_code=404, detail="Venue not found")

            insert_data = {
                "venue_id": venue_id,
                "user_id": review.user_id,
                "booking_id": review.booking_id,
                "rating": review.rating,
                "comment": review.comment,
                "created_at": datetime.utcnow()
            }
            r_id = crud.create_review(db, insert_data)
            new_review = crud.get_review(db, r_id)

            # Recalculate average rating
            avg_res = crud.get_average_rating(db, venue_id)
            if avg_res and avg_res.get("avg") is not None:
                crud.update_venue_rating(db, venue_id, round(float(avg_res.get("avg")), 1))

            user = crud.get_user_basic(db, review.user_id)
            user_name = f"{user.get('first_name')} {user.get('last_name')}" if user else "Anonymous"

            return {
                "id": new_review.get("id"),
                "venue_id": new_review.get("venue_id"),
                "user_id": new_review.get("user_id"),
                "booking_id": new_review.get("booking_id"),
                "rating": new_review.get("rating"),
                "comment": new_review.get("comment"),
                "created_at": new_review.get("created_at").isoformat() if new_review.get("created_at") else None,
                "user_name": user_name
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed creating review: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def hold_booking_slots(request: Request, db: Session, req: schemas.SlotHoldRequest, current_user: dict):
    try:
        with logger.time_operation("HOLD_BOOKING_SLOTS", request=request):
            now = datetime.utcnow()

            if not req.slot_ids:
                raise HTTPException(status_code=400, detail="No slot IDs provided")

            # Lock slot rows for update
            placeholders = ", ".join(["%s"] * len(req.slot_ids))
            slots = crud.get_slots_for_update(db, req.slot_ids)

            if len(slots) != len(req.slot_ids):
                raise HTTPException(
                    status_code=409,
                    detail="One or more selected slots are currently locked in checkout by another session."
                )


            for s in slots:
                if s.get("is_blocked") or (s.get("status") or "").upper() == "BLOCKED":
                    raise HTTPException(
                        status_code=400,
                        detail=f"Slot starting at {s.get('start_time').strftime('%I:%M %p')} is unavailable.",
                    )

                status_val = s.get("status") or "AVAILABLE"
                if status_val != "AVAILABLE":
                    if status_val == "HELD" and s.get("held_until") and s.get("held_until") < now:
                        continue
                    raise HTTPException(
                        status_code=400,
                        detail=f"Slot starting at {s.get('start_time').strftime('%I:%M %p')} is already booked or blocked."
                    )

            expiry = now + timedelta(minutes=5)
            total_amount = 0
            court_id = None

            for s in slots:
                crud.hold_slot(db, s.get("id"), expiry, req.user_id)
                total_amount += (s.get("current_price") or 0)
                if s.get("court_id"):
                    court_id = s.get("court_id")

            insert_booking = {
                "user_id": req.user_id,
                "court_id": court_id,
                "status": "pending_payment",
                "amount_paid": total_amount,
                "payment_status": "pending",
                "booking_date": now
            }
            b_id = crud.create_booking(db, insert_booking)

            for s in slots:
                crud.create_booking_slot(db, b_id, s.get("id"))

            booking = crud.get_booking(db, b_id)
            return serialize_booking(booking, db)
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed slot hold: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def confirm_booking(request: Request, db: Session, req: schemas.BookingConfirmRequest, current_user: dict):
    try:
        with logger.time_operation("CONFIRM_BOOKING", request=request):
            booking = crud.get_booking(db, req.booking_id)
            if not booking:
                raise HTTPException(status_code=404, detail="Booking not found")

            slots = crud.get_slots_by_booking_id(db, req.booking_id)

            for s in slots:
                status_val = s.get("status") or "AVAILABLE"
                if status_val == "BOOKED":
                    continue
                if status_val == "AVAILABLE" or (status_val == "HELD" and s.get("held_by_user_id") == booking.get("user_id")):
                    crud.book_slot(db, s.get("id"))
                else:
                    crud.update_booking_status_failed(db, req.booking_id, req.payment_id)
                    raise HTTPException(
                        status_code=409,
                        detail="Checkout expired and slot was booked by another user. Refund initiated."
                    )

            crud.update_booking_status_confirmed(db, req.booking_id, req.payment_id)

            updated = crud.get_booking(db, req.booking_id)
            return serialize_booking(updated, db)
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to confirm booking: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def create_venue_booking_razorpay_order(
        self,
        request: Request,
        order_request: schemas.VenueBookingOrderCreate,
        current_user: dict,
    ):
        try:
            with logger.time_operation("CREATE_VENUE_BOOKING_RAZORPAY_ORDER", request=request):
                validate_role_and_permission(db, current_user, ["admin", "team_member", "user", "venue_owner"])
                key_id, _ = get_razorpay_credentials()

                booking = crud.get_booking_by_id_and_user(db, order_request.booking_id, order_request.user_id)
                if not booking:
                    raise HTTPException(status_code=404, detail="Booking not found")
                if booking.get("status") == "confirmed" or booking.get("payment_status") == "paid":
                    raise HTTPException(status_code=400, detail="This booking is already paid")
                if booking.get("status") not in ("pending_payment", "pending_approval"):
                    raise HTTPException(status_code=400, detail="This booking cannot be paid online")

                amount_rupees = int(booking.get("amount_paid") or 0)
                if amount_rupees <= 0:
                    raise HTTPException(status_code=400, detail="Booking amount must be greater than zero")

                amount_in_paise = amount_rupees * 100
                receipt = f"venue_bk_{booking.get('id')}_{uuid.uuid4().hex[:10]}"

                razorpay_order = call_razorpay_api("POST", "/orders", {
                    "amount": amount_in_paise,
                    "currency": settings.RAZORPAY_CURRENCY,
                    "receipt": receipt,
                    "notes": {
                        "booking_id": str(booking.get("id")),
                        "user_id": str(booking.get("user_id")),
                        "type": "venue_booking",
                    },
                })

                local_order_id = crud.create_venue_booking_order(db, {...})

                user = crud.get_user_full(db, booking.get("user_id"))
                prefill_name = None
                prefill_email = None
                prefill_contact = None
                if user:
                    first = user.get("first_name") or ""
                    last = user.get("last_name") or ""
                    prefill_name = f"{first} {last}".strip() or user.get("club_name")
                    prefill_email = user.get("email")
                    prefill_contact = user.get("phone")

                return {
                    "key_id": key_id,
                    "razorpay_order_id": razorpay_order["id"],
                    "local_order_id": local_order_id,
                    "booking_id": booking.get("id"),
                    "amount": amount_in_paise,
                    "currency": razorpay_order.get("currency", settings.RAZORPAY_CURRENCY),
                    "name": "Mukijo Venues",
                    "description": f"Venue booking #{booking.get('id')}",
                    "prefill_name": prefill_name,
                    "prefill_email": prefill_email,
                    "prefill_contact": prefill_contact,
                }
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to create venue booking Razorpay order: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

async def verify_venue_booking_razorpay_payment(
        self,
        request: Request,
        verification: schemas.VenueBookingVerifyRequest,
        current_user: dict,
    ):
        try:
            with logger.time_operation("VERIFY_VENUE_BOOKING_RAZORPAY_PAYMENT", request=request):
                validate_role_and_permission(db, current_user, ["admin", "team_member", "user", "venue_owner"])

                booking = crud.get_booking_by_id(db, verification.booking_id)
                if not booking:
                    raise HTTPException(status_code=404, detail="Booking not found")

                gateway_order = crud.get_venue_booking_order(db, verification.booking_id, verification.razorpay_order_id)
                if not gateway_order:
                    raise HTTPException(status_code=404, detail="Razorpay order not found for this booking")

                expected_signature = build_razorpay_signature(
                    gateway_order.get("razorpay_order_id"),
                    verification.razorpay_payment_id,
                )
                if not hmac.compare_digest(expected_signature, verification.razorpay_signature):
                    crud.update_venue_booking_order_failed(db, gateway_order.get("id"), verification.razorpay_payment_id, verification.razorpay_signature)
                    raise HTTPException(status_code=400, detail="Payment verification failed")

                crud.update_venue_booking_order_success(db, gateway_order.get("id"), verification.razorpay_payment_id, verification.razorpay_signature, datetime.utcnow())

                return await confirm_booking(
                    request,
                    schemas.BookingConfirmRequest(
                        booking_id=verification.booking_id,
                        payment_id=verification.razorpay_payment_id,
                        razorpay_order_id=verification.razorpay_order_id,
                        razorpay_signature=verification.razorpay_signature,
                    ),
                    current_user,
                )
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to verify venue booking Razorpay payment: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

async def cancel_booking(request: Request, db: Session, booking_id: int, reason: Optional[str], current_user: dict):
    try:
        with logger.time_operation("CANCEL_BOOKING", request=request):
            booking = crud.get_booking(db, booking_id)
            if not booking:
                raise HTTPException(status_code=404, detail="Booking not found")

            if booking.get("status") == "cancelled":
                return serialize_booking(booking, db)

            slots = crud.get_slot_ids_for_booking(db, booking_id)

            for s in slots:
                crud.release_slot(db, s.get("slot_id"))

            pay_status = "refunded" if booking.get("payment_status") == "paid" else booking.get("payment_status")
            crud.update_booking_cancelled(db, booking_id, pay_status, datetime.utcnow(), reason or "User cancelled")

            updated = crud.get_booking(db, booking_id)
            return serialize_booking(updated, db)
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed cancel booking: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_user_bookings(request: Request, db: Session, user_id: int, current_user: dict):
    try:
        with logger.time_operation("GET_USER_BOOKINGS", request=request):
            now = datetime.utcnow()
            # Release expired slot holds automatically
            expired = crud.get_expired_held_slot_ids(db, now)
            if expired:
                expired_ids = [s.get("id") for s in expired]
                placeholders = ", ".join(["%s"] * len(expired_ids))
                crud.release_slots(db, expired_ids)

            bookings = crud.get_bookings_by_user(db, user_id)
            return [serialize_booking(b, db) for b in bookings]
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed getting user bookings: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def approve_booking(request: Request, db: Session, booking_id: int, current_user: dict):
    try:
        with logger.time_operation("APPROVE_BOOKING", request=request):
            booking = crud.get_booking_for_update(db, booking_id)
            if not booking:
                raise HTTPException(status_code=404, detail="Booking not found")
            if booking.get("status") != "pending_approval":
                raise HTTPException(status_code=400, detail="Only pending approval bookings can be approved.")

            slots = crud.get_slots_by_booking_id(db, booking_id)

            if not slots:
                raise HTTPException(status_code=400, detail="Booking has no slots attached.")

            venue_id = slots[0].get("venue_id")
            venue = crud.get_venue_by_id(db, venue_id)
            if not venue or venue.get("venue_owner_id") != current_user.get("id"):
                raise HTTPException(status_code=403, detail="Access denied.")

            for s in slots:
                if s.get("status") == "HELD" and s.get("held_by_user_id") == booking.get("user_id"):
                    crud.book_slot(db, s.get("id"))
                elif s.get("status") == "BOOKED":
                    continue
                else:
                    raise HTTPException(status_code=409, detail="Requested slot is no longer available.")

            crud.update_booking_status_confirmed(db, booking_id)

            _send_booking_notification(db, current_user, slots, booking_id, "approved", booking)

            updated = crud.get_booking(db, booking_id)
            return serialize_booking(updated, db)
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed approving booking: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def reject_booking(request: Request, db: Session, booking_id: int, current_user: dict):
    try:
        with logger.time_operation("REJECT_BOOKING", request=request):
            booking = crud.get_booking_for_update(db, booking_id)
            if not booking:
                raise HTTPException(status_code=404, detail="Booking not found")
            if booking.get("status") != "pending_approval":
                raise HTTPException(status_code=400, detail="Only pending approval bookings can be rejected.")

            slots = crud.get_slots_by_booking_id(db, booking_id)

            if not slots:
                raise HTTPException(status_code=400, detail="Booking has no slots attached.")

            venue_id = slots[0].get("venue_id")
            venue = crud.get_venue_by_id(db, venue_id)
            if not venue or venue.get("venue_owner_id") != current_user.get("id"):
                raise HTTPException(status_code=403, detail="Access denied.")

            for s in slots:
                if s.get("status") == "HELD" and s.get("held_by_user_id") == booking.get("user_id"):
                    crud.release_slot(db, s.get("id"))

            crud.update_booking_status_rejected(db, booking_id)

            _send_booking_notification(db, current_user, slots, booking_id, "rejected", booking)

            updated = crud.get_booking(db, booking_id)
            return serialize_booking(updated, db)
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed rejecting booking: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

def _send_booking_notification(self, db, current_user: dict, slots: list, booking_id: int, action: str, booking: Optional[dict] = None):
    try:
        if not slots:
            return
        venue_id = slots[0].get("venue_id")
        venue = crud.get_venue(db, venue_id)
        if not venue:
            return

        content = ""
        recipient_id = None
        recipient_type = None

        if action == "request":
            venue_owner_id = venue.get("venue_owner_id")
            if not venue_owner_id:
                return
            recipient_id = venue_owner_id
            recipient_type = "venue_owner"
            content = f"New booking request #{booking_id} for {venue.get('name')} needs your approval."
        else:
            if not booking:
                booking = crud.get_booking(db, booking_id)
            if not booking:
                return
            recipient_id = booking.get("user_id")
            recipient_type = "admin"
            content = f"Your booking request #{booking_id} has been {action}."

        if not recipient_id:
            return

        insert_data = {
            "sender_id": current_user.get("id"),
            "sender_type": current_user.get("role", "admin"),
            "sender_name": current_user.get("username") or current_user.get("name") or "Mukijo",
            "group_id": None,
            "channel": "notifications",
            "recipient_id": recipient_id,
            "recipient_type": recipient_type,
            "content": content,
        }
        crud.create_message(db, insert_data)
    except Exception:
        pass

async def get_booking_by_id(request: Request, db: Session, booking_id: int, current_user: dict):
    try:
        with logger.time_operation("GET_BOOKING_BY_ID", request=request):
            booking = crud.get_booking(db, booking_id)
            if not booking:
                raise HTTPException(status_code=404, detail="Booking not found")
            return serialize_booking(booking, db)
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed getting booking: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")