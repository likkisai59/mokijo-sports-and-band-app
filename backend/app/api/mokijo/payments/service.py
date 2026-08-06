from fastapi import APIRouter, Depends, Request, HTTPException, Header, status
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import date, datetime
import os
import uuid
import hmac
import json

from app.core.config import get_settings
from app.models import schemas
from sqlalchemy.orm import Session
from app.auth.authorization import check_user_authorization, validate_role_and_permission
from app.core.helpers import (
serialize_payment,
get_effective_payment_status,
validate_payment_scope
)
from app.services.razorpay import call_razorpay_api, build_razorpay_signature, get_razorpay_credentials
from app.logger import logger

PAYMENT_STATUSES = {"pending", "paid", "overdue", "cancelled"}
settings = get_settings()


from app.api.mokijo.payments import crud

async def get_razorpay_config(request: Request, db: Session, current_user: dict):
    try:
        with logger.time_operation("GET_RAZORPAY_CONFIG", request=request):
            validate_role_and_permission(db, current_user, ["admin", "team_member", "user"])
            key_id = os.getenv("RAZORPAY_KEY_ID")
            key_secret = os.getenv("RAZORPAY_KEY_SECRET")
            return {
                "configured": bool(key_id and key_secret),
                "key_id": key_id if key_id and key_secret else None,
                "currency": settings.RAZORPAY_CURRENCY,
                "name": "Mukijo Club",
            }
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to get Razorpay config: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def create_razorpay_payment_order(request: Request, db: Session, order_request: schemas.RazorpayOrderCreate, current_user: dict):
    try:
        with logger.time_operation("CREATE_RAZORPAY_ORDER", request=request):
            validate_role_and_permission(db, current_user, ["admin", "team_member", "user"])
            key_id, _ = get_razorpay_credentials()

            payment = crud.get_payment_by_id_and_owner(db, order_request.payment_id, order_request.owner_id)
            if not payment:
                raise HTTPException(status_code=404, detail="Payment request not found")
            if payment.get("status") == "paid":
                raise HTTPException(status_code=400, detail="This payment request is already paid")
            if payment.get("status") == "cancelled":
                raise HTTPException(status_code=400, detail="Cancelled payment requests cannot be paid online")
            if (payment.get("amount") or 0) <= 0:
                raise HTTPException(status_code=400, detail="Payment amount must be greater than zero")

            amount_in_paise = int(payment.get("amount") * 100)
            receipt = f"mukijo_{payment.get('id')}_{uuid.uuid4().hex[:10]}"

            razorpay_order = call_razorpay_api("POST", "/orders", {
                "amount": amount_in_paise,
                "currency": settings.RAZORPAY_CURRENCY,
                "receipt": receipt,
                "notes": {
                    "local_payment_id": str(payment.get("id")),
                    "owner_id": str(payment.get("owner_id")),
                    "category": payment.get("category") or "Payment",
                },
            })

            insert_data = {
                "payment_id": payment.get("id"),
                "owner_id": payment.get("owner_id"),
                "razorpay_order_id": razorpay_order["id"],
                "amount": amount_in_paise,
                "currency": razorpay_order.get("currency", settings.RAZORPAY_CURRENCY),
                "receipt": razorpay_order.get("receipt") or receipt,
                "status": razorpay_order.get("status", "created"),
                "raw_order": json.dumps(razorpay_order),
            }

            gateway_order_id = crud.create_gateway_order(db, insert_data)

            # Prefill details
            member_name = None
            member_email = None
            member_phone = None

            if payment.get("member_id"):
                member = crud.get_member_by_id(db, payment.get("member_id"))
                if member:
                    member_name = f"{member.get('first_name')} {member.get('last_name')}".strip()
                    member_email = member.get("email")
                    member_phone = member.get("phone")

            club_name = crud.get_user_club_name(db, payment.get("owner_id"))
            if not club_name or not isinstance(club_name, str):
                club_name = "Mukijo Club"

            return {
                "key_id": key_id,
                "razorpay_order_id": razorpay_order["id"],
                "local_order_id": gateway_order_id,
                "payment_id": payment.get("id"),
                "amount": amount_in_paise,
                "currency": razorpay_order.get("currency", settings.RAZORPAY_CURRENCY),
                "name": club_name,
                "description": payment.get("title"),
                "prefill_name": member_name,
                "prefill_email": member_email,
                "prefill_contact": member_phone,
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to create Razorpay order: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def verify_razorpay_payment(request: Request, db: Session, verification: schemas.RazorpayVerifyRequest, current_user: dict):
    try:
        with logger.time_operation("VERIFY_RAZORPAY_PAYMENT", request=request):
            validate_role_and_permission(db, current_user, ["admin", "team_member", "user"])
            payment = crud.get_payment_by_id_and_owner(db, verification.payment_id, verification.owner_id)
            if not payment:
                raise HTTPException(status_code=404, detail="Payment request not found")

            gateway_order = crud.get_gateway_order_for_verification(db, payment.get("id"), verification.owner_id, verification.razorpay_order_id)
            if not gateway_order:
                raise HTTPException(status_code=404, detail="Razorpay order not found for this payment request")

            expected_signature = build_razorpay_signature(
                gateway_order.get("razorpay_order_id"),
                verification.razorpay_payment_id
            )
            if not hmac.compare_digest(expected_signature, verification.razorpay_signature):
                crud.update_gateway_order_verification_failed(db, gateway_order.get("id"), verification.razorpay_payment_id, verification.razorpay_signature)
                raise HTTPException(status_code=400, detail="Payment verification failed")

            crud.update_gateway_order_verification_success(db, gateway_order.get("id"), verification.razorpay_payment_id, verification.razorpay_signature, datetime.utcnow())

            crud.update_payment_as_paid(db, payment.get("id"), "Razorpay", date.today().isoformat())

            # Course registration update if applicable
            desc = payment.get("description") or ""
            if "course_registration_id:" in desc:
                try:
                    parts = dict(part.split(":", 1) for part in desc.split("|") if ":" in part)
                    registration_id = int(parts.get("course_registration_id", "0"))
                    crud.update_course_registration_payment_status(db, registration_id, verification.owner_id, "paid")
                except Exception:
                    pass

            updated_payment = crud.get_payment_by_id(db, payment.get("id"))
            return {
                "message": "Payment verified successfully",
                "payment": serialize_payment(updated_payment, db),
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to verify Razorpay payment: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_payments(
    request: Request,
    db: Session,
    owner_id: int,
    status: str,
    group_id: Optional[int],
    member_id: Optional[int],
    current_user: dict
):
    try:
        with logger.time_operation("GET_PAYMENTS", request=request):
                validate_role_and_permission(db, current_user, ["admin", "team_member"], owner_id)
                if current_user.get("role") == "team_member":
                    if member_id != current_user.get("id"):
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail="Access denied: Team members can only view their own payments."
                        )
                query = "SELECT * FROM payments WHERE owner_id = %s"
                params = [owner_id]

                if group_id:
                    query += " AND group_id = %s"
                    params.append(group_id)
                if member_id:
                    query += " AND member_id = %s"
                    params.append(member_id)
                if status != "all":
                    if status not in PAYMENT_STATUSES:
                        raise HTTPException(status_code=400, detail="Invalid payment status")
                    if status != "overdue":
                        query += " AND status = %s"
                        params.append(status)

                query += " ORDER BY id DESC"
                payments = crud.get_filtered_payments(db, owner_id, group_id, status)
                serialized = [serialize_payment(p, db) for p in payments]

                if status == "overdue":
                    serialized = [p for p in serialized if p.get("status") == "overdue"]
                return serialized
    except HTTPException as he:
            raise he
    except Exception as e:
            await logger.log_error(request=request, message=f"Failed to get payments: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

async def get_payments_summary(request: Request, db: Session, owner_id: int, current_user: dict):
    try:
        with logger.time_operation("GET_PAYMENTS_SUMMARY", request=request):
            validate_role_and_permission(db, current_user, ["admin"], owner_id)
            payments = crud.get_payments_by_owner(db, owner_id)

            collected = sum(p.get("amount") or 0 for p in payments if p.get("status") == "paid")
            pending_items = [p for p in payments if get_effective_payment_status(p) in {"pending", "overdue"}]
            overdue_items = [p for p in payments if get_effective_payment_status(p) == "overdue"]

            return {
                "total_collected": collected,
                "pending_amount": sum(p.get("amount") or 0 for p in pending_items),
                "overdue_amount": sum(p.get("amount") or 0 for p in overdue_items),
                "total_requests": len(payments),
                "pending_count": len(pending_items),
                "paid_count": len([p for p in payments if p.get("status") == "paid"]),
                "overdue_count": len(overdue_items),
            }
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed payments summary: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_payments_member_status(request: Request, db: Session, owner_id: int, x_is_member: Optional[str], current_user: dict):
    try:
        with logger.time_operation("GET_PAYMENTS_MEMBER_STATUS", request=request):
            validate_role_and_permission(db, current_user, ["admin"], owner_id)
            if x_is_member == "true":
                raise HTTPException(status_code=403, detail="Members are not allowed to view payment records.")
            groups = crud.get_groups_by_owner(db, owner_id)
            group_ids = [g.get("id") for g in groups]

            if not group_ids:
                return []

            placeholders = ", ".join(["%s"] * len(group_ids))
            members = crud.get_members_by_group_ids(db, group_ids)

            payments = crud.get_payments_by_owner_desc(db, owner_id)
            group_map = {g.get("id"): g for g in groups}
            member_map = {m.get("id"): m for m in members}

            result = []
            seen_keys = set()

            for payment in payments:
                eff_status = get_effective_payment_status(payment)
                if eff_status != "paid":
                    continue

                p_id = payment.get("id")
                if p_id and p_id in seen_keys:
                    continue
                if p_id:
                    seen_keys.add(p_id)

                m_id = payment.get("member_id")
                member = member_map.get(m_id) if m_id else None

                full_name = "Paid Contributor"
                email = "N/A"
                role = "Member"
                sport = "N/A"
                group_name = "General Club"

                if member:
                    full_name = f"{member.get('first_name')} {member.get('last_name')}".strip()
                    email = member.get("email") or "N/A"
                    role = member.get("role") or "Member"
                    g_id = member.get("group_id")
                    group_obj = group_map.get(g_id)
                    if group_obj:
                        sport = group_obj.get("activity") or "N/A"
                        group_name = group_obj.get("group_name") or "General Club"
                else:
                    desc = payment.get("description") or ""
                    parts = {}
                    if "|" in desc:
                        for part in desc.split("|"):
                            if ":" in part:
                                k, v = part.split(":", 1)
                                parts[k.strip()] = v.strip()
                    if parts.get("donor_name"):
                        full_name = parts.get("donor_name")
                    if parts.get("donor_email"):
                        email = parts.get("donor_email")

                result.append({
                    "member_id": m_id,
                    "full_name": full_name,
                    "email": email,
                    "role": role,
                    "sport": sport,
                    "group_name": group_name,
                    "member_group_name": group_name,
                    "payment_for": payment.get("title") or "Club Payment",
                    "amount": payment.get("amount") or 0,
                    "status": "paid",
                    "raw_status": "paid",
                    "payment_id": p_id,
                })
            return result
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed payments member status: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def create_payment(request: Request, db: Session, payment: schemas.PaymentCreate, x_is_member: Optional[str], current_user: dict):
    try:
        with logger.time_operation("CREATE_PAYMENT", request=request):
            validate_role_and_permission(db, current_user, ["admin"], payment.owner_id)
            if x_is_member == "true":
                raise HTTPException(status_code=403, detail="Members are not allowed to create payments.")
            if payment.amount <= 0:
                raise HTTPException(status_code=400, detail="Amount must be greater than zero")

            status_val = payment.status or "pending"
            if status_val not in PAYMENT_STATUSES:
                raise HTTPException(status_code=400, detail="Invalid payment status")
            group_id, member_id = validate_payment_scope(payment.owner_id, payment.group_id, payment.member_id, db)

            insert_data = {
                "owner_id": payment.owner_id,
                "group_id": group_id,
                "member_id": member_id,
                "title": payment.title,
                "description": payment.description,
                "category": payment.category or "Membership Fee",
                "amount": payment.amount,
                "due_date": payment.due_date,
                "status": status_val,
                "payment_method": payment.payment_method,
                "paid_at": payment.paid_at
            }

            payment_id = crud.create_payment(db, insert_data)
            new_payment = crud.get_payment_by_id(db, payment_id)
            return serialize_payment(new_payment, db)
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to create payment: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def update_payment(
    request: Request,
    db: Session,
    payment_id: int,
    owner_id: int,
    payment_update: schemas.PaymentUpdate,
    x_is_member: Optional[str],
    current_user: dict
):
    try:
        with logger.time_operation("UPDATE_PAYMENT", request=request):
                validate_role_and_permission(db, current_user, ["admin"], owner_id)
                if x_is_member == "true":
                    raise HTTPException(status_code=403, detail="Members are not allowed to update payments.")
                payment = crud.get_payment_by_id_and_owner(db, payment_id, owner_id)
                if not payment:
                    raise HTTPException(status_code=404, detail="Payment request not found")

                update_data = payment_update.dict(exclude_unset=True)
                if "amount" in update_data and update_data["amount"] is not None and update_data["amount"] <= 0:
                    raise HTTPException(status_code=400, detail="Amount must be greater than zero")
                if "status" in update_data and update_data["status"] not in PAYMENT_STATUSES:
                    raise HTTPException(status_code=400, detail="Invalid payment status")

                group_id = update_data.get("group_id", payment.get("group_id"))
                member_id = update_data.get("member_id", payment.get("member_id"))

                if "group_id" in update_data or "member_id" in update_data:
                    group_id, member_id = validate_payment_scope(owner_id, group_id, member_id, db)
                    update_data["group_id"] = group_id
                    update_data["member_id"] = member_id

                if update_data.get("status") == "paid" and not update_data.get("paid_at") and not payment.get("paid_at"):
                    update_data["paid_at"] = date.today().isoformat()
                if update_data.get("status") in {"pending", "overdue", "cancelled"} and "paid_at" not in update_data:
                    update_data["paid_at"] = None

                crud.update_payment(db, payment_id, update_data)

                updated = crud.get_payment_by_id(db, payment_id)
                return serialize_payment(updated, db)
    except HTTPException as he:
            raise he
    except Exception as e:
            await logger.log_error(request=request, message=f"Failed to update payment: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

async def delete_payment(
    request: Request,
    db: Session,
    payment_id: int,
    owner_id: int,
    x_is_member: Optional[str],
    current_user: dict
):
    try:
        with logger.time_operation("DELETE_PAYMENT", request=request):
                validate_role_and_permission(db, current_user, ["admin"], owner_id)
                if x_is_member == "true":
                    raise HTTPException(status_code=403, detail="Members are not allowed to delete payments.")
                payment = crud.get_payment_by_id_and_owner(db, payment_id, owner_id)
                if not payment:
                    raise HTTPException(status_code=404, detail="Payment request not found")

                crud.delete_payment(db, payment_id)
                return {"message": "Payment request deleted successfully"}
    except HTTPException as he:
            raise he
    except Exception as e:
            await logger.log_error(request=request, message=f"Failed to delete payment: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
