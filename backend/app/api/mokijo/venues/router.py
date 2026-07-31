from fastapi import APIRouter, Depends, Request, HTTPException, status
from typing import List, Optional
from datetime import date, datetime, timedelta
from app.models import schemas
from app.api.mokijo.venues import service
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.auth.authorization import check_user_authorization

router = APIRouter()

@router.post("/venues", response_model=schemas.VenueResponse, summary="Add a new sports venue into the discoverable registry.", tags=["Venues"])
async def create_venue(request: Request, venue: schemas.VenueCreate, current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)):
    return await service.create_venue(request, db, venue, current_user)

@router.get("/venues", response_model=List[schemas.VenueResponse], summary="Search and discover nearby venues filtered by location, sport, pricing, ratings, distance, and availability.", tags=["Venues"])
async def get_venues(
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
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await logic.get_venues(
        request, sport, location, min_price, max_price, min_rating, latitude, longitude,
        max_distance, date, only_available, current_user, registered=registered
    )

@router.post("/venues/{venue_id}/slots", response_model=List[schemas.SlotResponse], summary="Batch insert sports slot inventories for a venue.", tags=["Venues"])
async def create_venue_slots(request: Request, venue_id: int, slots: List[schemas.SlotCreate], current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)):
    return await service.create_venue_slots(request, db, venue_id, slots, current_user)

@router.get("/venues/{venue_id}/slots", response_model=List[schemas.SlotResponse], summary="Fetch availability schedules/slots for a specific venue, filtered by YYYY-MM-DD.", tags=["Venues"])
async def get_venue_slots(request: Request, venue_id: int, date_str: Optional[str] = None, current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)):
    return await service.get_venue_slots(request, db, venue_id, date_str, current_user)

@router.post("/bookings", response_model=schemas.BookingResponse, summary="Place a venue slot reservation with concurrency protection to prevent double bookings.", tags=["Venues"])
async def create_booking(request: Request, booking: schemas.BookingCreate, current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)):
    return await service.create_booking(request, db, booking, current_user)

@router.post("/bookings/request-approval", response_model=schemas.BookingResponse, summary="Create a booking request that requires venue owner approval.", tags=["Venues"])
async def request_booking_approval(request: Request, booking: schemas.BookingCreate, current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)):
    if not booking.status:
        booking.status = "pending_approval"
    if not booking.payment_status:
        booking.payment_status = "pending"
    return await service.create_booking(request, db, booking, current_user)

@router.get("/venues/owner/{owner_id}", response_model=List[schemas.VenueResponse], summary="Retrieve all venues owned by a specific partner/owner.", tags=["Venues"])
async def get_owner_venues(request: Request, owner_id: int, current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)):
    return await service.get_owner_venues(request, db, owner_id, current_user)

@router.post("/venues/{venue_id}/block-slots", summary="Block slots within a date range for holidays or partner reservation.", tags=["Venues"])
async def block_venue_slots(request: Request, venue_id: int, req: schemas.BlockSlotsRequest, current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)):
    return await service.block_venue_slots(request, db, venue_id, req, current_user)

@router.post("/venues/{venue_id}/unblock-slots", summary="Unblock slots within a date range.", tags=["Venues"])
async def unblock_venue_slots(request: Request, venue_id: int, req: schemas.UnblockSlotsRequest, current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)):
    return await service.unblock_venue_slots(request, db, venue_id, req, current_user)

@router.post("/venues/{venue_id}/slots/{slot_id}/block", response_model=schemas.SlotResponse, summary="Block a particular slot so bookers see it as unavailable.", tags=["Venues"])
async def block_single_slot(request: Request, venue_id: int, slot_id: int, current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)):
    return await service.block_single_slot(request, db, venue_id, slot_id, current_user)

@router.post("/venues/{venue_id}/slots/{slot_id}/unblock", response_model=schemas.SlotResponse, summary="Unblock a particular slot so bookers can reserve it again.", tags=["Venues"])
async def unblock_single_slot(request: Request, venue_id: int, slot_id: int, current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)):
    return await service.unblock_single_slot(request, db, venue_id, slot_id, current_user)

@router.get("/venues/{venue_id}/payouts", response_model=schemas.PayoutsResponse, summary="Calculate revenue, platform fees, and payout history for a venue.", tags=["Venues"])
async def get_venue_payouts(request: Request, venue_id: int, current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)):
    return await service.get_venue_payouts(request, db, venue_id, current_user)

@router.get("/venues/{venue_id}/analytics", response_model=schemas.SaaSAnalyticsResponse, summary="Generate analytics for occupancy, peak hours, revenue trends, and customer retention.", tags=["Venues"])
async def get_venue_analytics(request: Request, venue_id: int, current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)):
    return await service.get_venue_analytics(request, db, venue_id, current_user)

@router.post("/venues/{venue_id}/courts", response_model=schemas.CourtResponse, summary="Register a new court inside a sports venue.", tags=["Venues"])
async def create_court(request: Request, venue_id: int, court: schemas.CourtCreate, current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)):
    return await service.create_court(request, db, venue_id, court, current_user)

@router.post("/venues/{venue_id}/reviews", response_model=schemas.ReviewResponse, summary="Post a customer review for a venue.", tags=["Venues"])
async def create_review(request: Request, venue_id: int, review: schemas.ReviewCreate, current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)):
    return await service.create_review(request, db, venue_id, review, current_user)

@router.post("/bookings/hold", response_model=schemas.BookingResponse, summary="Atomically locks selected slots for 5 minutes to prevent double-booking.", tags=["Venues"])
async def hold_booking_slots(request: Request, req: schemas.SlotHoldRequest, current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)):
    return await service.hold_booking_slots(request, db, req, current_user)

@router.post("/bookings/confirm", response_model=schemas.BookingResponse, summary="Confirm user slots booking after payment gateway webhook response.", tags=["Venues"])
async def confirm_booking(request: Request, req: schemas.BookingConfirmRequest, current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)):
    return await service.confirm_booking(request, db, req, current_user)

@router.post("/bookings/razorpay/order", response_model=schemas.VenueBookingOrderResponse, summary="Create a Razorpay order for a pending venue booking payment.", tags=["Venues"])
async def create_venue_booking_razorpay_order(request: Request, order_request: schemas.VenueBookingOrderCreate, current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)):
    return await service.create_venue_booking_razorpay_order(request, db, order_request, current_user)

@router.post("/bookings/razorpay/verify", response_model=schemas.BookingResponse, summary="Verify Razorpay payment and confirm the venue booking.", tags=["Venues"])
async def verify_venue_booking_razorpay_payment(request: Request, verification: schemas.VenueBookingVerifyRequest, current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)):
    return await service.verify_venue_booking_razorpay_payment(request, db, verification, current_user)

@router.post("/bookings/{booking_id}/approve", response_model=schemas.BookingResponse, summary="Approve a pending booking request for a venue owner.", tags=["Venues"])
async def approve_booking(request: Request, booking_id: int, current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)):
    return await service.approve_booking(request, db, booking_id, current_user)

@router.post("/bookings/{booking_id}/reject", response_model=schemas.BookingResponse, summary="Reject a pending booking request for a venue owner.", tags=["Venues"])
async def reject_booking(request: Request, booking_id: int, current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)):
    return await service.reject_booking(request, db, booking_id, current_user)

@router.post("/bookings/{booking_id}/cancel", response_model=schemas.BookingResponse, summary="Cancel booking and free up the time slots.", tags=["Venues"])
async def cancel_booking(request: Request, booking_id: int, reason: Optional[str] = "User cancelled", current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)):
    return await service.cancel_booking(request, db, booking_id, reason, current_user)

@router.get("/users/{user_id}/bookings", response_model=List[schemas.BookingResponse], summary="Get all bookings placed by a specific standard user.", tags=["Venues"])
async def get_user_bookings(request: Request, user_id: int, current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)):
    return await service.get_user_bookings(request, db, user_id, current_user)

@router.get("/bookings/{booking_id}", response_model=schemas.BookingResponse, summary="Retrieve a single booking by ID.", tags=["Venues"])
async def get_booking_by_id(request: Request, booking_id: int, current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)):
    return await service.get_booking_by_id(request, db, booking_id, current_user)
