from fastapi import APIRouter, Depends, Request, Header
from typing import List, Optional

from app.models import schemas
from app.api.mokijo.payments import service
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.auth.authorization import check_user_authorization

router = APIRouter()

@router.get("/payments/razorpay/config", summary="Retrieve Razorpay payment gateway configuration details.", tags=["Payments"])
async def get_razorpay_config(
    request: Request,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_razorpay_config(request, db, current_user)

@router.post("/payments/razorpay/order", response_model=schemas.RazorpayOrderResponse, summary="Create a new Razorpay payment gateway order for a pending payment request.", tags=["Payments"])
async def create_razorpay_payment_order(
    request: Request,
    order_request: schemas.RazorpayOrderCreate,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.create_razorpay_payment_order(request, db, order_request, current_user)

@router.post("/payments/razorpay/verify", summary="Verify Razorpay payment signature and mark the payment request as paid.", tags=["Payments"])
async def verify_razorpay_payment(
    request: Request,
    verification: schemas.RazorpayVerifyRequest,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.verify_razorpay_payment(request, db, verification, current_user)

@router.get("/payments", response_model=List[schemas.PaymentResponse], summary="Retrieve all payment requests, optionally filtered by status, group, or member.", tags=["Payments"])
async def get_payments(
    request: Request,
    owner_id: int,
    status: str = "all",
    group_id: Optional[int] = None,
    member_id: Optional[int] = None,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_payments(request, db, owner_id, status, group_id, member_id, current_user)

@router.get("/payments/summary", summary="Retrieve a summary of collected, pending, and overdue payment amounts.", tags=["Payments"])
async def get_payments_summary(
    request: Request,
    owner_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_payments_summary(request, db, owner_id, current_user)

@router.get("/payments/member-status", summary="Retrieve payment status details for all club members and their assigned payments.", tags=["Payments"])
async def get_payments_member_status(
    request: Request,
    owner_id: int,
    x_is_member: Optional[str] = Header(None),
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_payments_member_status(request, db, owner_id, x_is_member, current_user)

@router.post("/payments", response_model=schemas.PaymentResponse, summary="Create a new payment request for a specific group, member, or club-wide.", tags=["Payments"])
async def create_payment(
    request: Request,
    payment: schemas.PaymentCreate,
    x_is_member: Optional[str] = Header(None),
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.create_payment(request, db, payment, x_is_member, current_user)

@router.put("/payments/{payment_id}", response_model=schemas.PaymentResponse, summary="Update details of an existing payment request, including its amount or status.", tags=["Payments"])
async def update_payment(
    request: Request,
    payment_id: int,
    owner_id: int,
    payment_update: schemas.PaymentUpdate,
    x_is_member: Optional[str] = Header(None),
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.update_payment(request, db, payment_id, owner_id, payment_update, x_is_member, current_user)

@router.delete("/payments/{payment_id}", summary="Delete an existing payment request.", tags=["Payments"])
async def delete_payment(
    request: Request,
    payment_id: int,
    owner_id: int,
    x_is_member: Optional[str] = Header(None),
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.delete_payment(request, db, payment_id, owner_id, x_is_member, current_user)
