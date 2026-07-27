from fastapi import APIRouter, Depends, Request, HTTPException, status
from typing import List, Optional
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
    slots = db.fetch_all(
        "SELECT s.* FROM slots s JOIN booking_slots bs ON s.id = bs.slot_id WHERE bs.booking_id = %s",
        (booking.get("id"),)
    )
    venue_info = None
    venue_id = None
    if slots:
        venue_id = slots[0].get("venue_id")
    if venue_id:
        venue = db.fetch_one(
            "SELECT id, name, location, cover_image FROM venues WHERE id = %s LIMIT 1",
            (venue_id,),
        )
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


class VenuesRouting(ConnectionService):
    def __init__(self) -> None:
        super().__init__()
        
        self.router.add_api_route(
            path="/venues",
            endpoint=self.create_venue,
            methods=["POST"],
            response_model=schemas.VenueResponse,
            summary="Add a new sports venue into the discoverable registry.",
            tags=["Venues"]
        )
        self.router.add_api_route(
            path="/venues",
            endpoint=self.get_venues,
            methods=["GET"],
            response_model=List[schemas.VenueResponse],
            summary="Search and discover nearby venues filtered by location, sport, pricing, ratings, distance, and availability.",
            tags=["Venues"]
        )
        self.router.add_api_route(
            path="/venues/{venue_id}/slots",
            endpoint=self.create_venue_slots,
            methods=["POST"],
            response_model=List[schemas.SlotResponse],
            summary="Batch insert sports slot inventories for a venue.",
            tags=["Venues"]
        )
        self.router.add_api_route(
            path="/venues/{venue_id}/slots",
            endpoint=self.get_venue_slots,
            methods=["GET"],
            response_model=List[schemas.SlotResponse],
            summary="Fetch availability schedules/slots for a specific venue, filtered by YYYY-MM-DD.",
            tags=["Venues"]
        )
        self.router.add_api_route(
            path="/bookings",
            endpoint=self.create_booking,
            methods=["POST"],
            response_model=schemas.BookingResponse,
            summary="Place a venue slot reservation with concurrency protection to prevent double bookings.",
            tags=["Venues"]
        )
        self.router.add_api_route(
            path="/bookings/request-approval",
            endpoint=self.request_booking_approval,
            methods=["POST"],
            response_model=schemas.BookingResponse,
            summary="Create a booking request that requires venue owner approval.",
            tags=["Venues"]
        )
        self.router.add_api_route(
            path="/venues/owner/{owner_id}",
            endpoint=self.get_owner_venues,
            methods=["GET"],
            response_model=List[schemas.VenueResponse],
            summary="Retrieve all venues owned by a specific partner/owner.",
            tags=["Venues"]
        )
        self.router.add_api_route(
            path="/venues/{venue_id}/block-slots",
            endpoint=self.block_venue_slots,
            methods=["POST"],
            summary="Block slots within a date range for holidays or partner reservation.",
            tags=["Venues"]
        )
        self.router.add_api_route(
            path="/venues/{venue_id}/unblock-slots",
            endpoint=self.unblock_venue_slots,
            methods=["POST"],
            summary="Unblock slots within a date range.",
            tags=["Venues"]
        )
        self.router.add_api_route(
            path="/venues/{venue_id}/slots/{slot_id}/block",
            endpoint=self.block_single_slot,
            methods=["POST"],
            response_model=schemas.SlotResponse,
            summary="Block a particular slot so bookers see it as unavailable.",
            tags=["Venues"]
        )
        self.router.add_api_route(
            path="/venues/{venue_id}/slots/{slot_id}/unblock",
            endpoint=self.unblock_single_slot,
            methods=["POST"],
            response_model=schemas.SlotResponse,
            summary="Unblock a particular slot so bookers can reserve it again.",
            tags=["Venues"]
        )
        self.router.add_api_route(
            path="/venues/{venue_id}/payouts",
            endpoint=self.get_venue_payouts,
            methods=["GET"],
            response_model=schemas.PayoutsResponse,
            summary="Calculate revenue, platform fees, and payout history for a venue.",
            tags=["Venues"]
        )
        self.router.add_api_route(
            path="/venues/{venue_id}/analytics",
            endpoint=self.get_venue_analytics,
            methods=["GET"],
            response_model=schemas.SaaSAnalyticsResponse,
            summary="Generate analytics for occupancy, peak hours, revenue trends, and customer retention.",
            tags=["Venues"]
        )
        self.router.add_api_route(
            path="/venues/{venue_id}/courts",
            endpoint=self.create_court,
            methods=["POST"],
            response_model=schemas.CourtResponse,
            summary="Register a new court inside a sports venue.",
            tags=["Venues"]
        )
        self.router.add_api_route(
            path="/venues/{venue_id}/reviews",
            endpoint=self.create_review,
            methods=["POST"],
            response_model=schemas.ReviewResponse,
            summary="Post a customer review for a venue.",
            tags=["Venues"]
        )
        self.router.add_api_route(
            path="/bookings/hold",
            endpoint=self.hold_booking_slots,
            methods=["POST"],
            response_model=schemas.BookingResponse,
            summary="Atomically locks selected slots for 5 minutes to prevent double-booking.",
            tags=["Venues"]
        )
        self.router.add_api_route(
            path="/bookings/confirm",
            endpoint=self.confirm_booking,
            methods=["POST"],
            response_model=schemas.BookingResponse,
            summary="Confirm user slots booking after payment gateway webhook response.",
            tags=["Venues"]
        )
        self.router.add_api_route(
            path="/bookings/razorpay/order",
            endpoint=self.create_venue_booking_razorpay_order,
            methods=["POST"],
            response_model=schemas.VenueBookingOrderResponse,
            summary="Create a Razorpay order for a pending venue booking payment.",
            tags=["Venues"]
        )
        self.router.add_api_route(
            path="/bookings/razorpay/verify",
            endpoint=self.verify_venue_booking_razorpay_payment,
            methods=["POST"],
            response_model=schemas.BookingResponse,
            summary="Verify Razorpay payment and confirm the venue booking.",
            tags=["Venues"]
        )
        self.router.add_api_route(
            path="/bookings/{booking_id}/approve",
            endpoint=self.approve_booking,
            methods=["POST"],
            response_model=schemas.BookingResponse,
            summary="Approve a pending booking request for a venue owner.",
            tags=["Venues"]
        )
        self.router.add_api_route(
            path="/bookings/{booking_id}/reject",
            endpoint=self.reject_booking,
            methods=["POST"],
            response_model=schemas.BookingResponse,
            summary="Reject a pending booking request for a venue owner.",
            tags=["Venues"]
        )
        self.router.add_api_route(
            path="/bookings/{booking_id}/cancel",
            endpoint=self.cancel_booking,
            methods=["POST"],
            response_model=schemas.BookingResponse,
            summary="Cancel booking and free up the time slots.",
            tags=["Venues"]
        )
        self.router.add_api_route(
            path="/users/{user_id}/bookings",
            endpoint=self.get_user_bookings,
            methods=["GET"],
            response_model=List[schemas.BookingResponse],
            summary="Get all bookings placed by a specific standard user.",
            tags=["Venues"]
        )
        self.router.add_api_route(
            path="/bookings/{booking_id}",
            endpoint=self.get_booking_by_id,
            methods=["GET"],
            response_model=schemas.BookingResponse,
            summary="Retrieve a single booking by ID.",
            tags=["Venues"]
        )

    async def create_venue(self, request: Request, venue: schemas.VenueCreate, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Create venue router start", step="ROUTER_START", user_info=current_user)
        logic = VenuesLogic()
        return await logic.create_venue(request, venue, current_user)

    async def get_venues(
        self,
        request: Request,
        sport: Optional[str] = None,
        location: Optional[str] = None,
        min_price: Optional[int] = None,
        max_price: Optional[int] = None,
        min_rating: Optional[float] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        max_distance: Optional[float] = None,
        date: Optional[str] = None,
        only_available: Optional[bool] = False,
        registered: Optional[bool] = False,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Get venues router start", step="ROUTER_START", user_info=current_user)
        logic = VenuesLogic()
        return await logic.get_venues(
            request, sport, location, min_price, max_price, min_rating, latitude, longitude,
            max_distance, date, only_available, current_user, registered=registered
        )

    async def create_venue_slots(self, request: Request, venue_id: int, slots: List[schemas.SlotCreate], current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Create venue slots router start", step="ROUTER_START", user_info=current_user)
        logic = VenuesLogic()
        return await logic.create_venue_slots(request, venue_id, slots, current_user)

    async def get_venue_slots(self, request: Request, venue_id: int, date_str: Optional[str] = None, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Get venue slots router start", step="ROUTER_START", user_info=current_user)
        logic = VenuesLogic()
        return await logic.get_venue_slots(request, venue_id, date_str, current_user)

    async def create_booking(self, request: Request, booking: schemas.BookingCreate, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Create booking router start", step="ROUTER_START", user_info=current_user)
        logic = VenuesLogic()
        return await logic.create_booking(request, booking, current_user)

    async def request_booking_approval(self, request: Request, booking: schemas.BookingCreate, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Request booking approval router start", step="ROUTER_START", user_info=current_user)
        if not booking.status:
            booking.status = "pending_approval"
        if not booking.payment_status:
            booking.payment_status = "pending"
        logic = VenuesLogic()
        return await logic.create_booking(request, booking, current_user)

    async def get_owner_venues(self, request: Request, owner_id: int, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Get owner venues router start", step="ROUTER_START", user_info=current_user)
        logic = VenuesLogic()
        return await logic.get_owner_venues(request, owner_id, current_user)

    async def block_venue_slots(self, request: Request, venue_id: int, req: schemas.BlockSlotsRequest, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Block slots router start", step="ROUTER_START", user_info=current_user)
        logic = VenuesLogic()
        return await logic.block_venue_slots(request, venue_id, req, current_user)

    async def unblock_venue_slots(self, request: Request, venue_id: int, req: schemas.UnblockSlotsRequest, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Unblock slots router start", step="ROUTER_START", user_info=current_user)
        logic = VenuesLogic()
        return await logic.unblock_venue_slots(request, venue_id, req, current_user)

    async def block_single_slot(self, request: Request, venue_id: int, slot_id: int, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Block single slot router start", step="ROUTER_START", user_info=current_user)
        logic = VenuesLogic()
        return await logic.block_single_slot(request, venue_id, slot_id, current_user)

    async def unblock_single_slot(self, request: Request, venue_id: int, slot_id: int, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Unblock single slot router start", step="ROUTER_START", user_info=current_user)
        logic = VenuesLogic()
        return await logic.unblock_single_slot(request, venue_id, slot_id, current_user)

    async def get_venue_payouts(self, request: Request, venue_id: int, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Get venue payouts router start", step="ROUTER_START", user_info=current_user)
        logic = VenuesLogic()
        return await logic.get_venue_payouts(request, venue_id, current_user)

    async def get_venue_analytics(self, request: Request, venue_id: int, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Get venue analytics router start", step="ROUTER_START", user_info=current_user)
        logic = VenuesLogic()
        return await logic.get_venue_analytics(request, venue_id, current_user)

    async def create_court(self, request: Request, venue_id: int, court: schemas.CourtCreate, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Create court router start", step="ROUTER_START", user_info=current_user)
        logic = VenuesLogic()
        return await logic.create_court(request, venue_id, court, current_user)

    async def create_review(self, request: Request, venue_id: int, review: schemas.ReviewCreate, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Create review router start", step="ROUTER_START", user_info=current_user)
        logic = VenuesLogic()
        return await logic.create_review(request, venue_id, review, current_user)

    async def hold_booking_slots(self, request: Request, req: schemas.SlotHoldRequest, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Hold slots router start", step="ROUTER_START", user_info=current_user)
        logic = VenuesLogic()
        return await logic.hold_booking_slots(request, req, current_user)

    async def confirm_booking(self, request: Request, req: schemas.BookingConfirmRequest, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Confirm booking router start", step="ROUTER_START", user_info=current_user)
        logic = VenuesLogic()
        return await logic.confirm_booking(request, req, current_user)

    async def create_venue_booking_razorpay_order(
        self,
        request: Request,
        order_request: schemas.VenueBookingOrderCreate,
        current_user: dict = Depends(check_user_authorization),
    ):
        await logger.log_message(request=request, message="Create venue booking razorpay order router start", step="ROUTER_START", user_info=current_user)
        logic = VenuesLogic()
        return await logic.create_venue_booking_razorpay_order(request, order_request, current_user)

    async def verify_venue_booking_razorpay_payment(
        self,
        request: Request,
        verification: schemas.VenueBookingVerifyRequest,
        current_user: dict = Depends(check_user_authorization),
    ):
        await logger.log_message(request=request, message="Verify venue booking razorpay payment router start", step="ROUTER_START", user_info=current_user)
        logic = VenuesLogic()
        return await logic.verify_venue_booking_razorpay_payment(request, verification, current_user)

    async def approve_booking(self, request: Request, booking_id: int, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Approve booking router start", step="ROUTER_START", user_info=current_user)
        logic = VenuesLogic()
        return await logic.approve_booking(request, booking_id, current_user)

    async def reject_booking(self, request: Request, booking_id: int, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Reject booking router start", step="ROUTER_START", user_info=current_user)
        logic = VenuesLogic()
        return await logic.reject_booking(request, booking_id, current_user)

    async def cancel_booking(self, request: Request, booking_id: int, reason: Optional[str] = "User cancelled", current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Cancel booking router start", step="ROUTER_START", user_info=current_user)
        logic = VenuesLogic()
        return await logic.cancel_booking(request, booking_id, reason, current_user)

    async def get_user_bookings(self, request: Request, user_id: int, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Get user bookings router start", step="ROUTER_START", user_info=current_user)
        logic = VenuesLogic()
        return await logic.get_user_bookings(request, user_id, current_user)

    async def get_booking_by_id(self, request: Request, booking_id: int, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Get booking by ID router start", step="ROUTER_START", user_info=current_user)
        logic = VenuesLogic()
        return await logic.get_booking_by_id(request, booking_id, current_user)


class VenuesLogic(ConnectionService):
    def __init__(self) -> None:
        super().__init__()
        logger.log_message_sync(message="VenuesLogic instance created")

    async def create_venue(self, request: Request, venue: schemas.VenueCreate, current_user: dict):
        try:
            with logger.time_operation("CREATE_VENUE", request=request):
                db = self.db_driver
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
                v_id = db.insert("venues", insert_data)
                new_v = db.fetch_one("SELECT * FROM venues WHERE id = %s", (v_id,))
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
                db = self.db_driver
                # Club admin / discovery of owner-registered venues vs public verified-only list
                # Verification gating deferred — all owner-registered venues are bookable for now
                query = "SELECT * FROM venues WHERE venue_owner_id IS NOT NULL"
                params = []

                if sport and sport != "all":
                    query += " AND sports_supported LIKE %s"
                    params.append(f"%{sport}%")
                if location:
                    query += " AND (location LIKE %s OR name LIKE %s)"
                    params.append(f"%{location}%")
                    params.append(f"%{location}%")
                if min_price is not None:
                    query += " AND base_price_per_hour >= %s"
                    params.append(min_price)
                if max_price is not None:
                    query += " AND base_price_per_hour <= %s"
                    params.append(max_price)
                if min_rating is not None:
                    query += " AND rating >= %s"
                    params.append(min_rating)

                venues = db.fetch_all(query, tuple(params))

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
                        slots = db.fetch_all(
                            "SELECT s.* FROM slots s WHERE s.venue_id = %s AND DATE(s.start_time) = %s",
                            (venue.get("id"), target_date)
                        )
                        if not slots:
                            available_venues.append(venue)
                        else:
                            has_available_slot = False
                            # Gather slot bookings for evaluation
                            slot_ids = [s.get("id") for s in slots]
                            placeholders = ", ".join(["%s"] * len(slot_ids))
                            active_bookings = db.fetch_all(
                                f"SELECT bs.slot_id FROM bookings b JOIN booking_slots bs ON b.id = bs.booking_id WHERE bs.slot_id IN ({placeholders}) AND b.status IN ('reserved', 'confirmed')",
                                tuple(slot_ids)
                            )
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

    async def create_venue_slots(self, request: Request, venue_id: int, slots: List[schemas.SlotCreate], current_user: dict):
        try:
            with logger.time_operation("CREATE_VENUE_SLOTS", request=request):
                db = self.db_driver
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
                    slot_id = db.insert("slots", insert_data)
                    created_slot_ids.append(slot_id)
                
                placeholders = ", ".join(["%s"] * len(created_slot_ids))
                new_slots = db.fetch_all(f"SELECT * FROM slots WHERE id IN ({placeholders})", tuple(created_slot_ids))
                return [serialize_slot(s) for s in new_slots]
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed creating slots: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_venue_slots(self, request: Request, venue_id: int, date_str: Optional[str], current_user: dict):
        try:
            with logger.time_operation("GET_VENUE_SLOTS", request=request):
                db = self.db_driver
                if not date_str:
                    date_str = date.today().isoformat()
                
                try:
                    target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                except ValueError:
                    raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD.")

                venue = db.fetch_one("SELECT * FROM venues WHERE id = %s", (venue_id,))
                if not venue:
                    raise HTTPException(status_code=404, detail="Venue not found")

                now = datetime.utcnow()
                expired_held = db.fetch_all(
                    "SELECT id FROM slots WHERE venue_id = %s AND DATE(start_time) = %s AND status = 'HELD' AND held_until < %s",
                    (venue_id, target_date, now)
                )
                if expired_held:
                    expired_ids = [s.get("id") for s in expired_held]
                    placeholders = ", ".join(["%s"] * len(expired_ids))
                    db.execute_query(
                        f"UPDATE slots SET status = 'AVAILABLE', held_until = NULL, held_by_user_id = NULL WHERE id IN ({placeholders})",
                        tuple(expired_ids)
                    )

                # NOTE: Slots are no longer auto-seeded with hardcoded defaults here.
                # Venue owners must explicitly create slots via POST /venues/{venue_id}/slots.
                # If none exist yet for the requested date, this simply returns an empty list.
                slots = db.fetch_all(
                    "SELECT * FROM slots WHERE venue_id = %s AND DATE(start_time) = %s",
                    (venue_id, target_date)
                )

                if slots:
                    slot_ids = [s.get("id") for s in slots]
                    placeholders = ", ".join(["%s"] * len(slot_ids))
                    active_bookings = db.fetch_all(
                        f"SELECT bs.slot_id FROM bookings b JOIN booking_slots bs ON b.id = bs.booking_id WHERE bs.slot_id IN ({placeholders}) AND b.status IN ('reserved', 'confirmed')",
                        tuple(slot_ids)
                    )
                    booked_slot_ids = {b.get("slot_id") for b in active_bookings}

                    for slot in slots:
                        if slot.get("status") == "AVAILABLE" and slot.get("id") in booked_slot_ids:
                            # Update dynamically in response/db
                            db.execute_query("UPDATE slots SET status = 'BOOKED' WHERE id = %s", (slot.get("id"),))
                            slot["status"] = "BOOKED"

                return [serialize_slot(s) for s in slots]
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed getting venue slots: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def create_booking(self, request: Request, booking: schemas.BookingCreate, current_user: dict):
        try:
            with logger.time_operation("CREATE_BOOKING", request=request):
                db = self.db_driver
                if not booking.slot_ids:
                    raise HTTPException(status_code=400, detail="No slot IDs specified")

                placeholders = ", ".join(["%s"] * len(booking.slot_ids))
                slots = db.fetch_all(
                    f"SELECT * FROM slots WHERE id IN ({placeholders}) FOR UPDATE",
                    tuple(booking.slot_ids)
                )

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
                            db.execute_query(
                                "UPDATE slots SET status = 'AVAILABLE', held_until = NULL, held_by_user_id = NULL WHERE id = %s",
                                (slot.get("id"),)
                            )
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
                b_id = db.insert("bookings", insert_booking)

                held_expiry = None
                if status_val == "pending_approval":
                    held_expiry = datetime.utcnow() + timedelta(minutes=30)

                for slot in slots:
                    db.insert("booking_slots", {"booking_id": b_id, "slot_id": slot.get("id")})
                    if status_val == "pending_approval":
                        db.execute_query(
                            "UPDATE slots SET status = 'HELD', held_until = %s, held_by_user_id = %s WHERE id = %s",
                            (held_expiry, user_id, slot.get("id"))
                        )
                    else:
                        db.execute_query("UPDATE slots SET status = 'BOOKED' WHERE id = %s", (slot.get("id"),))

                new_booking = db.fetch_one("SELECT * FROM bookings WHERE id = %s", (b_id,))
                if status_val == "pending_approval":
                    self._send_booking_notification(db, current_user, slots, b_id, "request")
                return serialize_booking(new_booking, db)
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to create booking: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_owner_venues(self, request: Request, owner_id: int, current_user: dict):
        try:
            with logger.time_operation("GET_OWNER_VENUES", request=request):
                db = self.db_driver
                venues = db.fetch_all("SELECT * FROM venues WHERE owner_id = %s", (owner_id,))
                return [serialize_venue(v, db) for v in venues]
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed getting owner venues: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def block_venue_slots(self, request: Request, venue_id: int, req: schemas.BlockSlotsRequest, current_user: dict):
        try:
            with logger.time_operation("BLOCK_VENUE_SLOTS", request=request):
                db = self.db_driver
                try:
                    start_date = datetime.strptime(req.start_date, "%Y-%m-%d").date()
                    end_date = datetime.strptime(req.end_date, "%Y-%m-%d").date()
                except ValueError:
                    raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

                if start_date > end_date:
                    raise HTTPException(status_code=400, detail="Start date must be before or equal to end date.")

                venue = db.fetch_one("SELECT id FROM venues WHERE id = %s LIMIT 1", (venue_id,))
                if not venue:
                    raise HTTPException(status_code=404, detail="Venue not found")

                query = "UPDATE slots SET is_blocked = TRUE WHERE venue_id = %s AND DATE(start_time) >= %s AND DATE(start_time) <= %s"
                params = [venue_id, start_date, end_date]
                if req.sport:
                    query += " AND sport = %s"
                    params.append(req.sport)

                db.execute_query(query, tuple(params))
                return {"message": f"Successfully blocked slots between {req.start_date} and {req.end_date}."}
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed blocking slots: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def unblock_venue_slots(self, request: Request, venue_id: int, req: schemas.UnblockSlotsRequest, current_user: dict):
        try:
            with logger.time_operation("UNBLOCK_VENUE_SLOTS", request=request):
                db = self.db_driver
                try:
                    start_date = datetime.strptime(req.start_date, "%Y-%m-%d").date()
                    end_date = datetime.strptime(req.end_date, "%Y-%m-%d").date()
                except ValueError:
                    raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

                if start_date > end_date:
                    raise HTTPException(status_code=400, detail="Start date must be before or equal to end date.")

                venue = db.fetch_one("SELECT id FROM venues WHERE id = %s LIMIT 1", (venue_id,))
                if not venue:
                    raise HTTPException(status_code=404, detail="Venue not found")

                query = "UPDATE slots SET is_blocked = FALSE WHERE venue_id = %s AND DATE(start_time) >= %s AND DATE(start_time) <= %s"
                params = [venue_id, start_date, end_date]
                if req.sport:
                    query += " AND sport = %s"
                    params.append(req.sport)

                db.execute_query(query, tuple(params))
                return {"message": f"Successfully unblocked slots between {req.start_date} and {req.end_date}."}
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed unblocking slots: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    def _get_toggleable_slot(self, db, venue_id: int, slot_id: int):
        venue = db.fetch_one("SELECT id FROM venues WHERE id = %s LIMIT 1", (venue_id,))
        if not venue:
            raise HTTPException(status_code=404, detail="Venue not found")

        slot = db.fetch_one(
            "SELECT * FROM slots WHERE id = %s AND venue_id = %s LIMIT 1",
            (slot_id, venue_id),
        )
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
            db.execute_query(
                "UPDATE slots SET status = 'AVAILABLE', held_until = NULL, held_by_user_id = NULL WHERE id = %s",
                (slot_id,),
            )
            slot["status"] = "AVAILABLE"
            slot["held_until"] = None
            slot["held_by_user_id"] = None

        return slot

    async def block_single_slot(self, request: Request, venue_id: int, slot_id: int, current_user: dict):
        try:
            with logger.time_operation("BLOCK_SINGLE_SLOT", request=request):
                db = self.db_driver
                self._get_toggleable_slot(db, venue_id, slot_id)
                db.execute_query(
                    "UPDATE slots SET is_blocked = TRUE, status = 'BLOCKED' WHERE id = %s AND venue_id = %s",
                    (slot_id, venue_id),
                )
                updated = db.fetch_one(
                    "SELECT * FROM slots WHERE id = %s AND venue_id = %s LIMIT 1",
                    (slot_id, venue_id),
                )
                return serialize_slot(updated)
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed blocking single slot: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def unblock_single_slot(self, request: Request, venue_id: int, slot_id: int, current_user: dict):
        try:
            with logger.time_operation("UNBLOCK_SINGLE_SLOT", request=request):
                db = self.db_driver
                self._get_toggleable_slot(db, venue_id, slot_id)
                db.execute_query(
                    "UPDATE slots SET is_blocked = FALSE, status = 'AVAILABLE' WHERE id = %s AND venue_id = %s",
                    (slot_id, venue_id),
                )
                updated = db.fetch_one(
                    "SELECT * FROM slots WHERE id = %s AND venue_id = %s LIMIT 1",
                    (slot_id, venue_id),
                )
                return serialize_slot(updated)
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed unblocking single slot: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_venue_payouts(self, request: Request, venue_id: int, current_user: dict):
        try:
            with logger.time_operation("GET_VENUE_PAYOUTS", request=request):
                db = self.db_driver
                venue = db.fetch_one("SELECT id FROM venues WHERE id = %s LIMIT 1", (venue_id,))
                if not venue:
                    raise HTTPException(status_code=404, detail="Venue not found")

                bookings = db.fetch_all(
                    "SELECT DISTINCT b.* FROM bookings b JOIN booking_slots bs ON b.id = bs.booking_id "
                    "JOIN slots s ON s.id = bs.slot_id WHERE s.venue_id = %s AND b.payment_status = 'paid'",
                    (venue_id,)
                )

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

    async def get_venue_analytics(self, request: Request, venue_id: int, current_user: dict):
        try:
            with logger.time_operation("GET_VENUE_ANALYTICS", request=request):
                db = self.db_driver
                venue = db.fetch_one("SELECT id FROM venues WHERE id = %s LIMIT 1", (venue_id,))
                if not venue:
                    raise HTTPException(status_code=404, detail="Venue not found")

                slots_count = db.fetch_one("SELECT COUNT(*) as count FROM slots WHERE venue_id = %s", (venue_id,))
                total_slots = slots_count.get("count", 0) if slots_count else 0

                bookings = db.fetch_all(
                    "SELECT DISTINCT b.*, s.start_time FROM bookings b JOIN booking_slots bs ON b.id = bs.booking_id "
                    "JOIN slots s ON s.id = bs.slot_id WHERE s.venue_id = %s",
                    (venue_id,)
                )

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
                    user = db.fetch_one("SELECT first_name, last_name, email FROM users WHERE id = %s LIMIT 1", (u_id,))
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

    async def create_court(self, request: Request, venue_id: int, court: schemas.CourtCreate, current_user: dict):
        try:
            with logger.time_operation("CREATE_COURT", request=request):
                db = self.db_driver
                venue = db.fetch_one("SELECT id FROM venues WHERE id = %s LIMIT 1", (venue_id,))
                if not venue:
                    raise HTTPException(status_code=404, detail="Venue not found")

                insert_data = {
                    "venue_id": venue_id,
                    "name": court.name,
                    "sport_type": court.sport_type,
                    "capacity": court.capacity,
                    "price_per_hour": court.price_per_hour
                }
                c_id = db.insert("courts", insert_data)
                new_c = db.fetch_one("SELECT * FROM courts WHERE id = %s", (c_id,))
                return new_c
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed creating court: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def create_review(self, request: Request, venue_id: int, review: schemas.ReviewCreate, current_user: dict):
        try:
            with logger.time_operation("CREATE_REVIEW", request=request):
                db = self.db_driver
                venue = db.fetch_one("SELECT id FROM venues WHERE id = %s LIMIT 1", (venue_id,))
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
                r_id = db.insert("reviews", insert_data)
                new_review = db.fetch_one("SELECT * FROM reviews WHERE id = %s", (r_id,))

                # Recalculate average rating
                avg_res = db.fetch_one("SELECT AVG(rating) as avg FROM reviews WHERE venue_id = %s", (venue_id,))
                if avg_res and avg_res.get("avg") is not None:
                    db.execute_query("UPDATE venues SET rating = %s WHERE id = %s", (round(float(avg_res.get("avg")), 1), venue_id))

                user = db.fetch_one("SELECT first_name, last_name FROM users WHERE id = %s LIMIT 1", (review.user_id,))
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

    async def hold_booking_slots(self, request: Request, req: schemas.SlotHoldRequest, current_user: dict):
        try:
            with logger.time_operation("HOLD_BOOKING_SLOTS", request=request):
                db = self.db_driver
                now = datetime.utcnow()

                if not req.slot_ids:
                    raise HTTPException(status_code=400, detail="No slot IDs provided")

                # Lock slot rows for update
                placeholders = ", ".join(["%s"] * len(req.slot_ids))
                slots = db.fetch_all(
                    f"SELECT * FROM slots WHERE id IN ({placeholders}) FOR UPDATE",
                    tuple(req.slot_ids)
                )

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
                    db.execute_query(
                        "UPDATE slots SET status = 'HELD', held_until = %s, held_by_user_id = %s WHERE id = %s",
                        (expiry, req.user_id, s.get("id"))
                    )
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
                b_id = db.insert("bookings", insert_booking)

                for s in slots:
                    db.insert("booking_slots", {"booking_id": b_id, "slot_id": s.get("id")})

                booking = db.fetch_one("SELECT * FROM bookings WHERE id = %s", (b_id,))
                return serialize_booking(booking, db)
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed slot hold: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def confirm_booking(self, request: Request, req: schemas.BookingConfirmRequest, current_user: dict):
        try:
            with logger.time_operation("CONFIRM_BOOKING", request=request):
                db = self.db_driver
                booking = db.fetch_one("SELECT * FROM bookings WHERE id = %s", (req.booking_id,))
                if not booking:
                    raise HTTPException(status_code=404, detail="Booking not found")

                slots = db.fetch_all(
                    "SELECT s.* FROM slots s JOIN booking_slots bs ON s.id = bs.slot_id WHERE bs.booking_id = %s",
                    (req.booking_id,)
                )

                for s in slots:
                    status_val = s.get("status") or "AVAILABLE"
                    if status_val == "BOOKED":
                        continue
                    if status_val == "AVAILABLE" or (status_val == "HELD" and s.get("held_by_user_id") == booking.get("user_id")):
                        db.execute_query(
                            "UPDATE slots SET status = 'BOOKED', held_until = NULL, held_by_user_id = NULL WHERE id = %s",
                            (s.get("id"),)
                        )
                    else:
                        db.execute_query(
                            "UPDATE bookings SET status = 'failed_overbooked', payment_status = 'refund_needed', payment_id = %s WHERE id = %s",
                            (req.payment_id, req.booking_id)
                        )
                        raise HTTPException(
                            status_code=409,
                            detail="Checkout expired and slot was booked by another user. Refund initiated."
                        )

                db.execute_query(
                    "UPDATE bookings SET status = 'confirmed', payment_status = 'paid', payment_id = %s WHERE id = %s",
                    (req.payment_id, req.booking_id)
                )

                updated = db.fetch_one("SELECT * FROM bookings WHERE id = %s", (req.booking_id,))
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
                db = self.db_driver
                validate_role_and_permission(db, current_user, ["admin", "team_member", "user", "venue_owner"])
                key_id, _ = get_razorpay_credentials()

                booking = db.fetch_one(
                    "SELECT * FROM bookings WHERE id = %s AND user_id = %s",
                    (order_request.booking_id, order_request.user_id),
                )
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

                local_order_id = db.insert("venue_booking_orders", {
                    "booking_id": booking.get("id"),
                    "user_id": booking.get("user_id"),
                    "razorpay_order_id": razorpay_order["id"],
                    "amount": amount_in_paise,
                    "currency": razorpay_order.get("currency", settings.RAZORPAY_CURRENCY),
                    "status": razorpay_order.get("status", "created"),
                })

                user = db.fetch_one("SELECT * FROM users WHERE id = %s", (booking.get("user_id"),))
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
                db = self.db_driver
                validate_role_and_permission(db, current_user, ["admin", "team_member", "user", "venue_owner"])

                booking = db.fetch_one("SELECT * FROM bookings WHERE id = %s", (verification.booking_id,))
                if not booking:
                    raise HTTPException(status_code=404, detail="Booking not found")

                gateway_order = db.fetch_one(
                    "SELECT * FROM venue_booking_orders WHERE booking_id = %s AND razorpay_order_id = %s",
                    (verification.booking_id, verification.razorpay_order_id),
                )
                if not gateway_order:
                    raise HTTPException(status_code=404, detail="Razorpay order not found for this booking")

                expected_signature = build_razorpay_signature(
                    gateway_order.get("razorpay_order_id"),
                    verification.razorpay_payment_id,
                )
                if not hmac.compare_digest(expected_signature, verification.razorpay_signature):
                    db.execute_query(
                        "UPDATE venue_booking_orders SET status = 'signature_failed', razorpay_payment_id = %s, razorpay_signature = %s WHERE id = %s",
                        (verification.razorpay_payment_id, verification.razorpay_signature, gateway_order.get("id")),
                    )
                    raise HTTPException(status_code=400, detail="Payment verification failed")

                db.execute_query(
                    "UPDATE venue_booking_orders SET status = 'paid', razorpay_payment_id = %s, razorpay_signature = %s, verified_at = %s WHERE id = %s",
                    (
                        verification.razorpay_payment_id,
                        verification.razorpay_signature,
                        datetime.utcnow(),
                        gateway_order.get("id"),
                    ),
                )

                return await self.confirm_booking(
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

    async def cancel_booking(self, request: Request, booking_id: int, reason: Optional[str], current_user: dict):
        try:
            with logger.time_operation("CANCEL_BOOKING", request=request):
                db = self.db_driver
                booking = db.fetch_one("SELECT * FROM bookings WHERE id = %s", (booking_id,))
                if not booking:
                    raise HTTPException(status_code=404, detail="Booking not found")

                if booking.get("status") == "cancelled":
                    return serialize_booking(booking, db)

                slots = db.fetch_all(
                    "SELECT slot_id FROM booking_slots WHERE booking_id = %s",
                    (booking_id,)
                )
                
                for s in slots:
                    db.execute_query(
                        "UPDATE slots SET status = 'AVAILABLE', held_until = NULL, held_by_user_id = NULL WHERE id = %s",
                        (s.get("slot_id"),)
                    )

                pay_status = "refunded" if booking.get("payment_status") == "paid" else booking.get("payment_status")
                db.execute_query(
                    "UPDATE bookings SET status = 'cancelled', payment_status = %s, cancelled_at = %s, cancellation_reason = %s WHERE id = %s",
                    (pay_status, datetime.utcnow(), reason or "User cancelled", booking_id)
                )

                updated = db.fetch_one("SELECT * FROM bookings WHERE id = %s", (booking_id,))
                return serialize_booking(updated, db)
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed cancel booking: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_user_bookings(self, request: Request, user_id: int, current_user: dict):
        try:
            with logger.time_operation("GET_USER_BOOKINGS", request=request):
                db = self.db_driver
                now = datetime.utcnow()
                # Release expired slot holds automatically
                expired = db.fetch_all(
                    "SELECT id FROM slots WHERE status = 'HELD' AND held_until < %s",
                    (now,)
                )
                if expired:
                    expired_ids = [s.get("id") for s in expired]
                    placeholders = ", ".join(["%s"] * len(expired_ids))
                    db.execute_query(
                        f"UPDATE slots SET status = 'AVAILABLE', held_until = NULL, held_by_user_id = NULL WHERE id IN ({placeholders})",
                        tuple(expired_ids)
                    )

                bookings = db.fetch_all(
                    "SELECT * FROM bookings WHERE user_id = %s ORDER BY booking_date DESC",
                    (user_id,)
                )
                return [serialize_booking(b, db) for b in bookings]
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed getting user bookings: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def approve_booking(self, request: Request, booking_id: int, current_user: dict):
        try:
            with logger.time_operation("APPROVE_BOOKING", request=request):
                db = self.db_driver
                booking = db.fetch_one("SELECT * FROM bookings WHERE id = %s FOR UPDATE", (booking_id,))
                if not booking:
                    raise HTTPException(status_code=404, detail="Booking not found")
                if booking.get("status") != "pending_approval":
                    raise HTTPException(status_code=400, detail="Only pending approval bookings can be approved.")

                slots = db.fetch_all(
                    "SELECT s.* FROM slots s JOIN booking_slots bs ON s.id = bs.slot_id WHERE bs.booking_id = %s",
                    (booking_id,)
                )

                if not slots:
                    raise HTTPException(status_code=400, detail="Booking has no slots attached.")

                venue_id = slots[0].get("venue_id")
                venue = db.fetch_one("SELECT * FROM venues WHERE id = %s LIMIT 1", (venue_id,))
                if not venue or venue.get("venue_owner_id") != current_user.get("id"):
                    raise HTTPException(status_code=403, detail="Access denied.")

                for s in slots:
                    if s.get("status") == "HELD" and s.get("held_by_user_id") == booking.get("user_id"):
                        db.execute_query(
                            "UPDATE slots SET status = 'BOOKED', held_until = NULL, held_by_user_id = NULL WHERE id = %s",
                            (s.get("id"),)
                        )
                    elif s.get("status") == "BOOKED":
                        continue
                    else:
                        raise HTTPException(status_code=409, detail="Requested slot is no longer available.")

                db.execute_query(
                    "UPDATE bookings SET status = 'confirmed' WHERE id = %s",
                    (booking_id,)
                )

                self._send_booking_notification(db, current_user, slots, booking_id, "approved", booking)

                updated = db.fetch_one("SELECT * FROM bookings WHERE id = %s", (booking_id,))
                return serialize_booking(updated, db)
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed approving booking: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def reject_booking(self, request: Request, booking_id: int, current_user: dict):
        try:
            with logger.time_operation("REJECT_BOOKING", request=request):
                db = self.db_driver
                booking = db.fetch_one("SELECT * FROM bookings WHERE id = %s FOR UPDATE", (booking_id,))
                if not booking:
                    raise HTTPException(status_code=404, detail="Booking not found")
                if booking.get("status") != "pending_approval":
                    raise HTTPException(status_code=400, detail="Only pending approval bookings can be rejected.")

                slots = db.fetch_all(
                    "SELECT s.* FROM slots s JOIN booking_slots bs ON s.id = bs.slot_id WHERE bs.booking_id = %s",
                    (booking_id,)
                )

                if not slots:
                    raise HTTPException(status_code=400, detail="Booking has no slots attached.")

                venue_id = slots[0].get("venue_id")
                venue = db.fetch_one("SELECT * FROM venues WHERE id = %s LIMIT 1", (venue_id,))
                if not venue or venue.get("venue_owner_id") != current_user.get("id"):
                    raise HTTPException(status_code=403, detail="Access denied.")

                for s in slots:
                    if s.get("status") == "HELD" and s.get("held_by_user_id") == booking.get("user_id"):
                        db.execute_query(
                            "UPDATE slots SET status = 'AVAILABLE', held_until = NULL, held_by_user_id = NULL WHERE id = %s",
                            (s.get("id"),)
                        )

                db.execute_query(
                    "UPDATE bookings SET status = 'rejected', payment_status = 'cancelled' WHERE id = %s",
                    (booking_id,)
                )

                self._send_booking_notification(db, current_user, slots, booking_id, "rejected", booking)

                updated = db.fetch_one("SELECT * FROM bookings WHERE id = %s", (booking_id,))
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
            venue = db.fetch_one("SELECT * FROM venues WHERE id = %s", (venue_id,))
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
                    booking = db.fetch_one("SELECT * FROM bookings WHERE id = %s", (booking_id,))
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
            db.insert("messages", insert_data)
        except Exception:
            pass

    async def get_booking_by_id(self, request: Request, booking_id: int, current_user: dict):
        try:
            with logger.time_operation("GET_BOOKING_BY_ID", request=request):
                db = self.db_driver
                booking = db.fetch_one("SELECT * FROM bookings WHERE id = %s", (booking_id,))
                if not booking:
                    raise HTTPException(status_code=404, detail="Booking not found")
                return serialize_booking(booking, db)
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed getting booking: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
