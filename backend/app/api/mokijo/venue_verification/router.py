from fastapi import APIRouter, Depends, Request, BackgroundTasks
from typing import Optional

from app.api.mokijo.venue_verification import service
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.mokijo.venue_verification.service import (
    SubmitVerificationPayload,
    GPSLocationPayload,
    DocumentPayload,
    AdminActionPayload,
    _require_venue_owner,
    _require_mukijo_admin
)
from app.auth.authorization import check_user_authorization

router = APIRouter()

# ── Venue Owner endpoints ────────────────────────────────────────────────

@router.post("/venues/{venue_id}/submit-verification", summary="Submit venue for verification", tags=["Venue Verification"])
async def submit_verification(
    request: Request,
    venue_id: int,
    payload: SubmitVerificationPayload,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    _require_venue_owner(current_user)
    return await service.submit_verification(request, db, venue_id, payload, background_tasks, current_user)

@router.get("/venues/{venue_id}/verification-status", summary="Get venue verification status", tags=["Venue Verification"])
async def get_verification_status(
    request: Request,
    venue_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    _require_venue_owner(current_user)
    return await service.get_verification_status(request, db, venue_id, current_user)

@router.post("/venues/{venue_id}/gps-location", summary="Save venue GPS coordinates", tags=["Venue Verification"])
async def save_gps_location(
    request: Request,
    venue_id: int,
    payload: GPSLocationPayload,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    _require_venue_owner(current_user)
    return await service.save_gps_location(request, db, venue_id, payload, current_user)

@router.post("/venues/{venue_id}/documents", summary="Add document to venue", tags=["Venue Verification"])
async def add_document(
    request: Request,
    venue_id: int,
    payload: DocumentPayload,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    _require_venue_owner(current_user)
    return await service.add_document(request, db, venue_id, payload, current_user)

@router.get("/venues/{venue_id}/documents", summary="Get venue documents", tags=["Venue Verification"])
async def get_documents(
    request: Request,
    venue_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_documents(request, db, venue_id, current_user)

# ── Mukijo Admin endpoints ───────────────────────────────────────────────

@router.get("/admin/venues/verification-queue", summary="Get venues by verification status", tags=["Venue Verification"])
async def get_verification_queue(
    request: Request,
    verification_status: Optional[str] = None,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    _require_mukijo_admin(current_user)
    return await service.get_verification_queue(request, db, verification_status)

@router.get("/admin/venues/{venue_id}/review", summary="Get full venue review detail", tags=["Venue Verification"])
async def get_venue_review(
    request: Request,
    venue_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    _require_mukijo_admin(current_user)
    return await service.get_venue_review(request, db, venue_id)

@router.post("/admin/venues/{venue_id}/start-review", summary="Mark venue as UNDER_REVIEW", tags=["Venue Verification"])
async def start_review(
    request: Request,
    venue_id: int,
    payload: AdminActionPayload,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    _require_mukijo_admin(current_user)
    return await service.start_review(request, db, venue_id, payload, current_user)

@router.post("/admin/venues/{venue_id}/approve", summary="Approve venue (VERIFIED)", tags=["Venue Verification"])
async def approve_venue(
    request: Request,
    venue_id: int,
    payload: AdminActionPayload,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    _require_mukijo_admin(current_user)
    return await service.approve_venue(request, db, venue_id, payload, background_tasks, current_user)

@router.post("/admin/venues/{venue_id}/reject", summary="Reject venue", tags=["Venue Verification"])
async def reject_venue(
    request: Request,
    venue_id: int,
    payload: AdminActionPayload,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    _require_mukijo_admin(current_user)
    return await service.reject_venue(request, db, venue_id, payload, background_tasks, current_user)

@router.post("/admin/venues/{venue_id}/request-info", summary="Request more information", tags=["Venue Verification"])
async def request_more_info(
    request: Request,
    venue_id: int,
    payload: AdminActionPayload,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    _require_mukijo_admin(current_user)
    return await service.request_more_info(request, db, venue_id, payload, background_tasks, current_user)

@router.post("/admin/venues/{venue_id}/suspend", summary="Suspend a verified venue", tags=["Venue Verification"])
async def suspend_venue(
    request: Request,
    venue_id: int,
    payload: AdminActionPayload,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    _require_mukijo_admin(current_user)
    return await service.suspend_venue(request, db, venue_id, payload, background_tasks, current_user)

# ── Mukijo Admin Auth ────────────────────────────────────────────────────

@router.post("/mukijo-admin/register", summary="Register a Mukijo platform admin", tags=["Venue Verification"])
async def register_mukijo_admin(
    request: Request,
    payload: dict
,
    db: Session = Depends(get_db)
):
    return await service.register_mukijo_admin(request, db, payload)

@router.post("/mukijo-admin/login", summary="Login as Mukijo platform admin", tags=["Venue Verification"])
async def login_mukijo_admin(
    request: Request,
    payload: dict
,
    db: Session = Depends(get_db)
):
    return await service.login_mukijo_admin(request, db, payload)
