from fastapi import APIRouter, Depends, Request, HTTPException, Header, status
from typing import List, Optional
from datetime import date, datetime
import os
import uuid
import hmac
import json

from app.core.config import get_settings
from app.models import schemas
from app.connectors.connection_service import ConnectionService
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


class PaymentsRouting(ConnectionService):
    def __init__(self) -> None:
        super().__init__()
        
        self.router.add_api_route(
            path="/payments/razorpay/config",
            endpoint=self.get_razorpay_config,
            methods=["GET"],
            summary="Retrieve Razorpay payment gateway configuration details.",
            tags=["Payments"]
        )
        self.router.add_api_route(
            path="/payments/razorpay/order",
            endpoint=self.create_razorpay_payment_order,
            methods=["POST"],
            response_model=schemas.RazorpayOrderResponse,
            summary="Create a new Razorpay payment gateway order for a pending payment request.",
            tags=["Payments"]
        )
        self.router.add_api_route(
            path="/payments/razorpay/verify",
            endpoint=self.verify_razorpay_payment,
            methods=["POST"],
            summary="Verify Razorpay payment signature and mark the payment request as paid.",
            tags=["Payments"]
        )
        self.router.add_api_route(
            path="/payments",
            endpoint=self.get_payments,
            methods=["GET"],
            response_model=List[schemas.PaymentResponse],
            summary="Retrieve all payment requests, optionally filtered by status, group, or member.",
            tags=["Payments"]
        )
        self.router.add_api_route(
            path="/payments/summary",
            endpoint=self.get_payments_summary,
            methods=["GET"],
            summary="Retrieve a summary of collected, pending, and overdue payment amounts.",
            tags=["Payments"]
        )
        self.router.add_api_route(
            path="/payments/member-status",
            endpoint=self.get_payments_member_status,
            methods=["GET"],
            summary="Retrieve payment status details for all club members and their assigned payments.",
            tags=["Payments"]
        )
        self.router.add_api_route(
            path="/payments",
            endpoint=self.create_payment,
            methods=["POST"],
            response_model=schemas.PaymentResponse,
            summary="Create a new payment request for a specific group, member, or club-wide.",
            tags=["Payments"]
        )
        self.router.add_api_route(
            path="/payments/{payment_id}",
            endpoint=self.update_payment,
            methods=["PUT"],
            response_model=schemas.PaymentResponse,
            summary="Update details of an existing payment request, including its amount or status.",
            tags=["Payments"]
        )
        self.router.add_api_route(
            path="/payments/{payment_id}",
            endpoint=self.delete_payment,
            methods=["DELETE"],
            summary="Delete an existing payment request.",
            tags=["Payments"]
        )

    async def get_razorpay_config(self, request: Request, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Get razorpay config router start", step="ROUTER_START", user_info=current_user)
        logic = PaymentsLogic()
        return await logic.get_razorpay_config(request, current_user)

    async def create_razorpay_payment_order(
        self,
        request: Request,
        order_request: schemas.RazorpayOrderCreate,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Create razorpay order router start", step="ROUTER_START", user_info=current_user)
        logic = PaymentsLogic()
        return await logic.create_razorpay_payment_order(request, order_request, current_user)

    async def verify_razorpay_payment(
        self,
        request: Request,
        verification: schemas.RazorpayVerifyRequest,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Verify razorpay payment router start", step="ROUTER_START", user_info=current_user)
        logic = PaymentsLogic()
        return await logic.verify_razorpay_payment(request, verification, current_user)

    async def get_payments(
        self,
        request: Request,
        owner_id: int,
        status: str = "all",
        group_id: Optional[int] = None,
        member_id: Optional[int] = None,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Get payments router start", step="ROUTER_START", user_info=current_user)
        logic = PaymentsLogic()
        return await logic.get_payments(request, owner_id, status, group_id, member_id, current_user)

    async def get_payments_summary(
        self,
        request: Request,
        owner_id: int,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Get payments summary router start", step="ROUTER_START", user_info=current_user)
        logic = PaymentsLogic()
        return await logic.get_payments_summary(request, owner_id, current_user)

    async def get_payments_member_status(
        self,
        request: Request,
        owner_id: int,
        x_is_member: Optional[str] = Header(None),
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Get payments member status router start", step="ROUTER_START", user_info=current_user)
        logic = PaymentsLogic()
        return await logic.get_payments_member_status(request, owner_id, x_is_member, current_user)

    async def create_payment(
        self,
        request: Request,
        payment: schemas.PaymentCreate,
        x_is_member: Optional[str] = Header(None),
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Create payment router start", step="ROUTER_START", user_info=current_user)
        logic = PaymentsLogic()
        return await logic.create_payment(request, payment, x_is_member, current_user)

    async def update_payment(
        self,
        request: Request,
        payment_id: int,
        owner_id: int,
        payment_update: schemas.PaymentUpdate,
        x_is_member: Optional[str] = Header(None),
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Update payment router start", step="ROUTER_START", user_info=current_user)
        logic = PaymentsLogic()
        return await logic.update_payment(request, payment_id, owner_id, payment_update, x_is_member, current_user)

    async def delete_payment(
        self,
        request: Request,
        payment_id: int,
        owner_id: int,
        x_is_member: Optional[str] = Header(None),
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Delete payment router start", step="ROUTER_START", user_info=current_user)
        logic = PaymentsLogic()
        return await logic.delete_payment(request, payment_id, owner_id, x_is_member, current_user)


class PaymentsLogic(ConnectionService):
    def __init__(self) -> None:
        super().__init__()
        logger.log_message_sync(message="PaymentsLogic instance created")

    async def get_razorpay_config(self, request: Request, current_user: dict):
        try:
            with logger.time_operation("GET_RAZORPAY_CONFIG", request=request):
                validate_role_and_permission(self.db_driver, current_user, ["admin", "team_member", "user"])
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

    async def create_razorpay_payment_order(self, request: Request, order_request: schemas.RazorpayOrderCreate, current_user: dict):
        try:
            with logger.time_operation("CREATE_RAZORPAY_ORDER", request=request):
                db = self.db_driver
                validate_role_and_permission(db, current_user, ["admin", "team_member", "user"])
                key_id, _ = get_razorpay_credentials()
                
                payment = db.fetch_one(
                    "SELECT * FROM payments WHERE id = %s AND owner_id = %s",
                    (order_request.payment_id, order_request.owner_id)
                )
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
                
                gateway_order_id = db.insert("payment_gateway_orders", insert_data)

                # Prefill details
                member_name = None
                member_email = None
                member_phone = None
                
                if payment.get("member_id"):
                    member = db.fetch_one("SELECT * FROM members WHERE id = %s", (payment.get("member_id"),))
                    if member:
                        member_name = f"{member.get('first_name')} {member.get('last_name')}".strip()
                        member_email = member.get("email")
                        member_phone = member.get("phone")

                owner = db.fetch_one("SELECT club_name FROM users WHERE id = %s", (payment.get("owner_id"),))
                club_name = owner.get("club_name") if owner and owner.get("club_name") else "Mukijo Club"

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

    async def verify_razorpay_payment(self, request: Request, verification: schemas.RazorpayVerifyRequest, current_user: dict):
        try:
            with logger.time_operation("VERIFY_RAZORPAY_PAYMENT", request=request):
                db = self.db_driver
                validate_role_and_permission(db, current_user, ["admin", "team_member", "user"])
                payment = db.fetch_one(
                    "SELECT * FROM payments WHERE id = %s AND owner_id = %s",
                    (verification.payment_id, verification.owner_id)
                )
                if not payment:
                    raise HTTPException(status_code=404, detail="Payment request not found")

                gateway_order = db.fetch_one(
                    "SELECT * FROM payment_gateway_orders WHERE payment_id = %s AND owner_id = %s AND razorpay_order_id = %s",
                    (payment.get("id"), verification.owner_id, verification.razorpay_order_id)
                )
                if not gateway_order:
                    raise HTTPException(status_code=404, detail="Razorpay order not found for this payment request")

                expected_signature = build_razorpay_signature(
                    gateway_order.get("razorpay_order_id"),
                    verification.razorpay_payment_id
                )
                if not hmac.compare_digest(expected_signature, verification.razorpay_signature):
                    db.execute_query(
                        "UPDATE payment_gateway_orders SET status = 'signature_failed', razorpay_payment_id = %s, razorpay_signature = %s WHERE id = %s",
                        (verification.razorpay_payment_id, verification.razorpay_signature, gateway_order.get("id"))
                    )
                    raise HTTPException(status_code=400, detail="Payment verification failed")

                db.execute_query(
                    "UPDATE payment_gateway_orders SET status = 'paid', razorpay_payment_id = %s, razorpay_signature = %s, verified_at = %s WHERE id = %s",
                    (verification.razorpay_payment_id, verification.razorpay_signature, datetime.utcnow(), gateway_order.get("id"))
                )
                
                db.execute_query(
                    "UPDATE payments SET status = 'paid', payment_method = 'Razorpay', paid_at = %s WHERE id = %s",
                    (date.today().isoformat(), payment.get("id"))
                )

                # Course registration update if applicable
                desc = payment.get("description") or ""
                if "course_registration_id:" in desc:
                    try:
                        parts = dict(part.split(":", 1) for part in desc.split("|") if ":" in part)
                        registration_id = int(parts.get("course_registration_id", "0"))
                        # Trainer-owned registrations may have null owner_id — update by id.
                        db.execute_query(
                            "UPDATE course_registrations SET payment_status = 'paid', status = 'registered' WHERE id = %s",
                            (registration_id,)
                        )
                    except Exception:
                        pass

                updated_payment = db.fetch_one("SELECT * FROM payments WHERE id = %s", (payment.get("id"),))
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
        self,
        request: Request,
        owner_id: int,
        status: str,
        group_id: Optional[int],
        member_id: Optional[int],
        current_user: dict
    ):
        try:
            with logger.time_operation("GET_PAYMENTS", request=request):
                db = self.db_driver
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
                payments = db.fetch_all(query, tuple(params))
                serialized = [serialize_payment(p, db) for p in payments]
                
                if status == "overdue":
                    serialized = [p for p in serialized if p.get("status") == "overdue"]
                return serialized
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to get payments: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_payments_summary(self, request: Request, owner_id: int, current_user: dict):
        try:
            with logger.time_operation("GET_PAYMENTS_SUMMARY", request=request):
                db = self.db_driver
                validate_role_and_permission(db, current_user, ["admin"], owner_id)
                payments = db.fetch_all("SELECT * FROM payments WHERE owner_id = %s", (owner_id,))
                
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

    async def get_payments_member_status(self, request: Request, owner_id: int, x_is_member: Optional[str], current_user: dict):
        try:
            with logger.time_operation("GET_PAYMENTS_MEMBER_STATUS", request=request):
                db = self.db_driver
                validate_role_and_permission(db, current_user, ["admin"], owner_id)
                if x_is_member == "true":
                    raise HTTPException(status_code=403, detail="Members are not allowed to view payment records.")
                
                db = self.db_driver
                groups = db.fetch_all("SELECT * FROM groups WHERE owner_id = %s", (owner_id,))
                group_ids = [g.get("id") for g in groups]
                
                if not group_ids:
                    return []

                placeholders = ", ".join(["%s"] * len(group_ids))
                members = db.fetch_all(
                    f"SELECT * FROM members WHERE group_id IN ({placeholders}) ORDER BY first_name ASC, last_name ASC",
                    tuple(group_ids)
                )
                
                payments = db.fetch_all(
                    "SELECT * FROM payments WHERE owner_id = %s ORDER BY id DESC",
                    (owner_id,)
                )

                group_map = {g.get("id"): g for g in groups}
                payments_by_member = {}
                payments_by_group = {}
                club_wide_payments = []

                for payment in payments:
                    m_id = payment.get("member_id")
                    g_id = payment.get("group_id")
                    if m_id:
                        payments_by_member.setdefault(m_id, []).append(payment)
                    elif g_id:
                        payments_by_group.setdefault(g_id, []).append(payment)
                    else:
                        club_wide_payments.append(payment)

                def display_status(p):
                    return "paid" if get_effective_payment_status(p) == "paid" else "unpaid"

                def member_details(m):
                    g_id = m.get("group_id")
                    group_obj = group_map.get(g_id)
                    return {
                        "member_id": m.get("id"),
                        "full_name": f"{m.get('first_name')} {m.get('last_name')}".strip(),
                        "email": m.get("email"),
                        "role": m.get("role") or "Member",
                        "sport": group_obj.get("activity") if group_obj else "N/A",
                        "group_name": group_obj.get("group_name") if group_obj else "N/A",
                        "member_group_name": group_obj.get("group_name") if group_obj else "N/A",
                    }

                result = []
                for member in members:
                    m_id = member.get("id")
                    g_id = member.get("group_id")
                    applicable_payments = [
                        *payments_by_member.get(m_id, []),
                        *payments_by_group.get(g_id, []),
                        *club_wide_payments,
                    ]

                    if not applicable_payments:
                        result.append({
                            **member_details(member),
                            "payment_for": "No Assigned Payments",
                            "amount": 0,
                            "status": "unpaid",
                            "payment_id": None,
                        })
                    else:
                        for payment in applicable_payments:
                            result.append({
                                **member_details(member),
                                "payment_for": payment.get("title"),
                                "amount": payment.get("amount") or 0,
                                "status": display_status(payment),
                                "raw_status": get_effective_payment_status(payment),
                                "payment_id": payment.get("id"),
                            })
                return result
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed payments member status: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def create_payment(self, request: Request, payment: schemas.PaymentCreate, x_is_member: Optional[str], current_user: dict):
        try:
            with logger.time_operation("CREATE_PAYMENT", request=request):
                validate_role_and_permission(self.db_driver, current_user, ["admin"], payment.owner_id)
                if x_is_member == "true":
                    raise HTTPException(status_code=403, detail="Members are not allowed to create payments.")
                if payment.amount <= 0:
                    raise HTTPException(status_code=400, detail="Amount must be greater than zero")

                status_val = payment.status or "pending"
                if status_val not in PAYMENT_STATUSES:
                    raise HTTPException(status_code=400, detail="Invalid payment status")

                db = self.db_driver
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
                
                payment_id = db.insert("payments", insert_data)
                new_payment = db.fetch_one("SELECT * FROM payments WHERE id = %s", (payment_id,))
                return serialize_payment(new_payment, db)
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to create payment: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def update_payment(
        self,
        request: Request,
        payment_id: int,
        owner_id: int,
        payment_update: schemas.PaymentUpdate,
        x_is_member: Optional[str],
        current_user: dict
    ):
        try:
            with logger.time_operation("UPDATE_PAYMENT", request=request):
                validate_role_and_permission(self.db_driver, current_user, ["admin"], owner_id)
                if x_is_member == "true":
                    raise HTTPException(status_code=403, detail="Members are not allowed to update payments.")
                
                db = self.db_driver
                payment = db.fetch_one(
                    "SELECT * FROM payments WHERE id = %s AND owner_id = %s",
                    (payment_id, owner_id)
                )
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

                if update_data:
                    set_clauses = []
                    params = []
                    for key, val in update_data.items():
                        set_clauses.append(f"{key} = %s")
                        params.append(val)
                    params.append(payment_id)
                    db.execute_query(
                        f"UPDATE payments SET {', '.join(set_clauses)} WHERE id = %s",
                        tuple(params)
                    )

                updated = db.fetch_one("SELECT * FROM payments WHERE id = %s", (payment_id,))
                return serialize_payment(updated, db)
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to update payment: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def delete_payment(
        self,
        request: Request,
        payment_id: int,
        owner_id: int,
        x_is_member: Optional[str],
        current_user: dict
    ):
        try:
            with logger.time_operation("DELETE_PAYMENT", request=request):
                validate_role_and_permission(self.db_driver, current_user, ["admin"], owner_id)
                if x_is_member == "true":
                    raise HTTPException(status_code=403, detail="Members are not allowed to delete payments.")
                
                db = self.db_driver
                payment = db.fetch_one(
                    "SELECT * FROM payments WHERE id = %s AND owner_id = %s",
                    (payment_id, owner_id)
                )
                if not payment:
                    raise HTTPException(status_code=404, detail="Payment request not found")

                db.execute_query("DELETE FROM payments WHERE id = %s", (payment_id,))
                return {"message": "Payment request deleted successfully"}
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to delete payment: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
