from fastapi import APIRouter, Depends, Request, HTTPException, BackgroundTasks, status
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.connectors.connection_service import ConnectionService
from app.auth.authorization import check_user_authorization
from app.logger import logger


# ── Pydantic request bodies ──────────────────────────────────────────────────

class GPSLocationPayload(BaseModel):
    latitude: float
    longitude: float

class DocumentPayload(BaseModel):
    document_type: str       # ownership_proof | lease_agreement | business_registration | other
    document_label: Optional[str] = None
    file_path: Optional[str] = None
    original_filename: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None

class SubmitVerificationPayload(BaseModel):
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    city: Optional[str] = None
    state_name: Optional[str] = None
    postal_code: Optional[str] = None
    description: Optional[str] = None

class AdminActionPayload(BaseModel):
    reason: Optional[str] = None
    notes: Optional[str] = None
    checklist: Optional[dict] = None


# ── Auth helpers ──────────────────────────────────────────────────────────────

def _require_mukijo_admin(current_user: dict):
    """Only mukijo_admin role can approve/reject/suspend venues."""
    role = current_user.get("role", "")
    if role != "mukijo_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only Mukijo Platform Admins can perform this action."
        )

def _require_venue_owner(current_user: dict):
    role = current_user.get("role", "")
    if role != "venue_owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only venue owners can perform this action."
        )

def _get_venue_for_owner(db, venue_id: int, owner_id: int):
    venue = db.fetch_one(
        "SELECT * FROM venues WHERE id = %s AND venue_owner_id = %s LIMIT 1",
        (venue_id, owner_id)
    )
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found or access denied.")
    return venue

def _get_venue(db, venue_id: int):
    venue = db.fetch_one("SELECT * FROM venues WHERE id = %s LIMIT 1", (venue_id,))
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found.")
    return venue

def _get_owner_email(db, venue_id: int) -> Optional[str]:
    row = db.fetch_one(
        "SELECT vo.email FROM venues v JOIN venue_owners vo ON vo.id = v.venue_owner_id WHERE v.id = %s LIMIT 1",
        (venue_id,)
    )
    return row.get("email") if row else None

def _log_action(db, venue_id: int, action: str, actor_id, actor_role: str, actor_name: str, reason=None, notes=None):
    db.insert("venue_verification_logs", {
        "venue_id": venue_id,
        "action": action,
        "actor_id": actor_id,
        "actor_role": actor_role,
        "actor_name": actor_name,
        "reason": reason,
        "notes": notes,
        "created_at": datetime.utcnow()
    })


# ── Routing class ─────────────────────────────────────────────────────────────

class VenueVerificationRouting(ConnectionService):
    def __init__(self):
        super().__init__()

        routes = [
            ("/venues/{venue_id}/submit-verification", self.submit_verification, ["POST"], "Submit venue for verification"),
            ("/venues/{venue_id}/verification-status", self.get_verification_status, ["GET"], "Get venue verification status"),
            ("/venues/{venue_id}/gps-location", self.save_gps_location, ["POST"], "Save venue GPS coordinates"),
            ("/venues/{venue_id}/documents", self.add_document, ["POST"], "Add document to venue"),
            ("/venues/{venue_id}/documents", self.get_documents, ["GET"], "Get venue documents"),
            ("/admin/venues/verification-queue", self.get_verification_queue, ["GET"], "Get venues by verification status"),
            ("/admin/venues/{venue_id}/review", self.get_venue_review, ["GET"], "Get full venue review detail"),
            ("/admin/venues/{venue_id}/start-review", self.start_review, ["POST"], "Mark venue as UNDER_REVIEW"),
            ("/admin/venues/{venue_id}/approve", self.approve_venue, ["POST"], "Approve venue (VERIFIED)"),
            ("/admin/venues/{venue_id}/reject", self.reject_venue, ["POST"], "Reject venue"),
            ("/admin/venues/{venue_id}/request-info", self.request_more_info, ["POST"], "Request more information"),
            ("/admin/venues/{venue_id}/suspend", self.suspend_venue, ["POST"], "Suspend a verified venue"),
            ("/mukijo-admin/register", self.register_mukijo_admin, ["POST"], "Register a Mukijo platform admin"),
            ("/mukijo-admin/login", self.login_mukijo_admin, ["POST"], "Login as Mukijo platform admin"),
        ]
        for path, ep, methods, summary in routes:
            self.router.add_api_route(path=path, endpoint=ep, methods=methods, summary=summary, tags=["Venue Verification"])

    # ── Venue Owner endpoints ────────────────────────────────────────────────

    async def submit_verification(self, request: Request, venue_id: int, payload: SubmitVerificationPayload, background_tasks: BackgroundTasks, current_user: dict = Depends(check_user_authorization)):
        _require_venue_owner(current_user)
        logic = VenueVerificationLogic()
        return await logic.submit_verification(request, venue_id, payload, background_tasks, current_user)

    async def get_verification_status(self, request: Request, venue_id: int, current_user: dict = Depends(check_user_authorization)):
        _require_venue_owner(current_user)
        logic = VenueVerificationLogic()
        return await logic.get_verification_status(request, venue_id, current_user)

    async def save_gps_location(self, request: Request, venue_id: int, payload: GPSLocationPayload, current_user: dict = Depends(check_user_authorization)):
        _require_venue_owner(current_user)
        logic = VenueVerificationLogic()
        return await logic.save_gps_location(request, venue_id, payload, current_user)

    async def add_document(self, request: Request, venue_id: int, payload: DocumentPayload, current_user: dict = Depends(check_user_authorization)):
        _require_venue_owner(current_user)
        logic = VenueVerificationLogic()
        return await logic.add_document(request, venue_id, payload, current_user)

    async def get_documents(self, request: Request, venue_id: int, current_user: dict = Depends(check_user_authorization)):
        logic = VenueVerificationLogic()
        return await logic.get_documents(request, venue_id, current_user)

    # ── Mukijo Admin endpoints ───────────────────────────────────────────────

    async def get_verification_queue(self, request: Request, verification_status: Optional[str] = None, current_user: dict = Depends(check_user_authorization)):
        _require_mukijo_admin(current_user)
        logic = VenueVerificationLogic()
        return await logic.get_verification_queue(request, verification_status)

    async def get_venue_review(self, request: Request, venue_id: int, current_user: dict = Depends(check_user_authorization)):
        _require_mukijo_admin(current_user)
        logic = VenueVerificationLogic()
        return await logic.get_venue_review(request, venue_id)

    async def start_review(self, request: Request, venue_id: int, payload: AdminActionPayload, current_user: dict = Depends(check_user_authorization)):
        _require_mukijo_admin(current_user)
        logic = VenueVerificationLogic()
        return await logic.start_review(request, venue_id, payload, current_user)

    async def approve_venue(self, request: Request, venue_id: int, payload: AdminActionPayload, background_tasks: BackgroundTasks, current_user: dict = Depends(check_user_authorization)):
        _require_mukijo_admin(current_user)
        logic = VenueVerificationLogic()
        return await logic.approve_venue(request, venue_id, payload, background_tasks, current_user)

    async def reject_venue(self, request: Request, venue_id: int, payload: AdminActionPayload, background_tasks: BackgroundTasks, current_user: dict = Depends(check_user_authorization)):
        _require_mukijo_admin(current_user)
        logic = VenueVerificationLogic()
        return await logic.reject_venue(request, venue_id, payload, background_tasks, current_user)

    async def request_more_info(self, request: Request, venue_id: int, payload: AdminActionPayload, background_tasks: BackgroundTasks, current_user: dict = Depends(check_user_authorization)):
        _require_mukijo_admin(current_user)
        logic = VenueVerificationLogic()
        return await logic.request_more_info(request, venue_id, payload, background_tasks, current_user)

    async def suspend_venue(self, request: Request, venue_id: int, payload: AdminActionPayload, background_tasks: BackgroundTasks, current_user: dict = Depends(check_user_authorization)):
        _require_mukijo_admin(current_user)
        logic = VenueVerificationLogic()
        return await logic.suspend_venue(request, venue_id, payload, background_tasks, current_user)

    # ── Mukijo Admin Auth ────────────────────────────────────────────────────

    async def register_mukijo_admin(self, request: Request, payload: dict):
        logic = VenueVerificationLogic()
        return await logic.register_mukijo_admin(request, payload)

    async def login_mukijo_admin(self, request: Request, payload: dict):
        logic = VenueVerificationLogic()
        return await logic.login_mukijo_admin(request, payload)


# ── Logic class ───────────────────────────────────────────────────────────────

class VenueVerificationLogic(ConnectionService):
    def __init__(self):
        super().__init__()

    async def submit_verification(self, request, venue_id, payload, background_tasks, current_user):
        try:
            db = self.db_driver
            owner_id = current_user.get("id")
            venue = _get_venue_for_owner(db, venue_id, owner_id)

            # Validate minimum requirements
            photos_raw = venue.get("venue_images") or "[]"
            try:
                import json
                photos = json.loads(photos_raw) if isinstance(photos_raw, str) else photos_raw
            except Exception:
                photos = []
            if len(photos) < 3:
                raise HTTPException(status_code=400, detail="At least 3 venue photos are required before submitting for verification.")

            doc_count = db.fetch_one("SELECT COUNT(*) as cnt FROM venue_documents WHERE venue_id = %s", (venue_id,))
            if not doc_count or (doc_count.get("cnt") or 0) < 1:
                raise HTTPException(status_code=400, detail="At least 1 verification document is required before submitting.")

            current_status = venue.get("verification_status", "DRAFT")
            allowed = ["DRAFT", "MORE_INFO_REQUIRED", "REJECTED"]
            if current_status not in allowed:
                raise HTTPException(status_code=400, detail=f"Cannot submit from status '{current_status}'.")

            update_fields = {
                "verification_status": "PENDING_VERIFICATION",
                "verification_submitted_at": datetime.utcnow(),
                "rejection_reason": None,
                "verification_notes": None,
            }
            if payload.contact_phone:
                update_fields["contact_phone"] = payload.contact_phone
            if payload.contact_email:
                update_fields["contact_email"] = payload.contact_email
            if payload.city:
                update_fields["city"] = payload.city
            if payload.state_name:
                update_fields["state_name"] = payload.state_name
            if payload.postal_code:
                update_fields["postal_code"] = payload.postal_code
            if payload.description:
                update_fields["description"] = payload.description

            set_clause = ", ".join([f"{k} = %s" for k in update_fields])
            values = list(update_fields.values()) + [venue_id]
            db.execute_query(f"UPDATE venues SET {set_clause} WHERE id = %s", tuple(values))

            action = "RESUBMITTED" if current_status in ["MORE_INFO_REQUIRED", "REJECTED"] else "SUBMITTED"
            owner_name = current_user.get("username") or str(owner_id)
            _log_action(db, venue_id, action, owner_id, "venue_owner", owner_name)

            owner_email = _get_owner_email(db, venue_id)
            if owner_email:
                from app.services.email import send_venue_submitted_email
                background_tasks.add_task(send_venue_submitted_email, owner_email, venue.get("name", ""))

            return {"message": "Venue submitted for verification successfully.", "verification_status": "PENDING_VERIFICATION"}
        except HTTPException:
            raise
        except Exception as e:
            await logger.log_error(request, message=f"submit_verification error: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_verification_status(self, request, venue_id, current_user):
        try:
            db = self.db_driver
            owner_id = current_user.get("id")
            venue = _get_venue_for_owner(db, venue_id, owner_id)
            doc_count = db.fetch_one("SELECT COUNT(*) as cnt FROM venue_documents WHERE venue_id = %s", (venue_id,))
            return {
                "venue_id": venue_id,
                "venue_name": venue.get("name"),
                "verification_status": venue.get("verification_status", "DRAFT"),
                "verification_submitted_at": venue.get("verification_submitted_at"),
                "verified_at": venue.get("verified_at"),
                "rejection_reason": venue.get("rejection_reason"),
                "verification_notes": venue.get("verification_notes"),
                "documents_count": doc_count.get("cnt", 0) if doc_count else 0,
                "gps_captured": bool(venue.get("gps_latitude")),
            }
        except HTTPException:
            raise
        except Exception as e:
            await logger.log_error(request, message=f"get_verification_status error: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def save_gps_location(self, request, venue_id, payload, current_user):
        try:
            db = self.db_driver
            owner_id = current_user.get("id")
            _get_venue_for_owner(db, venue_id, owner_id)
            db.execute_query(
                "UPDATE venues SET gps_latitude = %s, gps_longitude = %s, gps_captured_at = %s WHERE id = %s",
                (payload.latitude, payload.longitude, datetime.utcnow(), venue_id)
            )
            return {"message": "GPS location saved.", "latitude": payload.latitude, "longitude": payload.longitude}
        except HTTPException:
            raise
        except Exception as e:
            await logger.log_error(request, message=f"save_gps_location error: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def add_document(self, request, venue_id, payload, current_user):
        try:
            db = self.db_driver
            owner_id = current_user.get("id")
            _get_venue_for_owner(db, venue_id, owner_id)
            doc_id = db.insert("venue_documents", {
                "venue_id": venue_id,
                "document_type": payload.document_type,
                "document_label": payload.document_label,
                "file_path": payload.file_path,
                "original_filename": payload.original_filename,
                "file_size": payload.file_size,
                "mime_type": payload.mime_type,
                "is_confidential": True,
                "uploaded_at": datetime.utcnow()
            })
            db.execute_query("UPDATE venues SET documents_submitted = TRUE WHERE id = %s", (venue_id,))
            return {"message": "Document added.", "document_id": doc_id}
        except HTTPException:
            raise
        except Exception as e:
            await logger.log_error(request, message=f"add_document error: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_documents(self, request, venue_id, current_user):
        try:
            db = self.db_driver
            role = current_user.get("role", "")
            if role == "venue_owner":
                owner_id = current_user.get("id")
                _get_venue_for_owner(db, venue_id, owner_id)
            elif role != "mukijo_admin":
                raise HTTPException(status_code=403, detail="Access denied.")
            docs = db.fetch_all("SELECT * FROM venue_documents WHERE venue_id = %s ORDER BY uploaded_at DESC", (venue_id,))
            return docs or []
        except HTTPException:
            raise
        except Exception as e:
            await logger.log_error(request, message=f"get_documents error: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_verification_queue(self, request, verification_status):
        try:
            db = self.db_driver
            if verification_status:
                rows = db.fetch_all(
                    "SELECT v.*, vo.full_name as owner_name, vo.email as owner_email FROM venues v "
                    "LEFT JOIN venue_owners vo ON vo.id = v.venue_owner_id "
                    "WHERE v.verification_status = %s ORDER BY v.verification_submitted_at DESC",
                    (verification_status.upper(),)
                )
            else:
                rows = db.fetch_all(
                    "SELECT v.*, vo.full_name as owner_name, vo.email as owner_email FROM venues v "
                    "LEFT JOIN venue_owners vo ON vo.id = v.venue_owner_id "
                    "WHERE v.venue_owner_id IS NOT NULL ORDER BY v.verification_submitted_at DESC"
                )
            return rows or []
        except Exception as e:
            await logger.log_error(request, message=f"get_verification_queue error: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_venue_review(self, request, venue_id):
        try:
            db = self.db_driver
            venue = db.fetch_one(
                "SELECT v.*, vo.full_name as owner_name, vo.email as owner_email, vo.phone as owner_phone "
                "FROM venues v LEFT JOIN venue_owners vo ON vo.id = v.venue_owner_id WHERE v.id = %s LIMIT 1",
                (venue_id,)
            )
            if not venue:
                raise HTTPException(status_code=404, detail="Venue not found.")
            docs = db.fetch_all("SELECT * FROM venue_documents WHERE venue_id = %s", (venue_id,))
            logs = db.fetch_all("SELECT * FROM venue_verification_logs WHERE venue_id = %s ORDER BY created_at DESC", (venue_id,))
            return {"venue": venue, "documents": docs or [], "audit_log": logs or []}
        except HTTPException:
            raise
        except Exception as e:
            await logger.log_error(request, message=f"get_venue_review error: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def start_review(self, request, venue_id, payload, current_user):
        try:
            db = self.db_driver
            venue = _get_venue(db, venue_id)
            if venue.get("verification_status") != "PENDING_VERIFICATION":
                raise HTTPException(status_code=400, detail="Venue must be in PENDING_VERIFICATION to start review.")
            db.execute_query("UPDATE venues SET verification_status = 'UNDER_REVIEW' WHERE id = %s", (venue_id,))
            admin_name = current_user.get("username") or str(current_user.get("id"))
            _log_action(db, venue_id, "REVIEW_STARTED", current_user.get("id"), "mukijo_admin", admin_name, notes=payload.notes)
            return {"message": "Venue marked as UNDER_REVIEW.", "verification_status": "UNDER_REVIEW"}
        except HTTPException:
            raise
        except Exception as e:
            await logger.log_error(request, message=f"start_review error: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def approve_venue(self, request, venue_id, payload, background_tasks, current_user):
        try:
            db = self.db_driver
            venue = _get_venue(db, venue_id)
            allowed = ["PENDING_VERIFICATION", "UNDER_REVIEW"]
            if venue.get("verification_status") not in allowed:
                raise HTTPException(status_code=400, detail=f"Cannot approve from status '{venue.get('verification_status')}'.")
            admin_id = current_user.get("id")
            db.execute_query(
                "UPDATE venues SET verification_status = 'VERIFIED', verified_at = %s, verified_by = %s, rejection_reason = NULL, verification_notes = %s WHERE id = %s",
                (datetime.utcnow(), admin_id, payload.notes, venue_id)
            )
            admin_name = current_user.get("username") or str(admin_id)
            _log_action(db, venue_id, "APPROVED", admin_id, "mukijo_admin", admin_name, notes=payload.notes)
            owner_email = _get_owner_email(db, venue_id)
            if owner_email:
                from app.services.email import send_venue_approved_email
                background_tasks.add_task(send_venue_approved_email, owner_email, venue.get("name", ""))
            return {"message": "Venue approved and is now publicly visible.", "verification_status": "VERIFIED"}
        except HTTPException:
            raise
        except Exception as e:
            await logger.log_error(request, message=f"approve_venue error: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def reject_venue(self, request, venue_id, payload, background_tasks, current_user):
        try:
            db = self.db_driver
            venue = _get_venue(db, venue_id)
            if not payload.reason:
                raise HTTPException(status_code=400, detail="A rejection reason is required.")
            db.execute_query(
                "UPDATE venues SET verification_status = 'REJECTED', rejection_reason = %s, verification_notes = %s WHERE id = %s",
                (payload.reason, payload.notes, venue_id)
            )
            admin_name = current_user.get("username") or str(current_user.get("id"))
            _log_action(db, venue_id, "REJECTED", current_user.get("id"), "mukijo_admin", admin_name, reason=payload.reason, notes=payload.notes)
            owner_email = _get_owner_email(db, venue_id)
            if owner_email:
                from app.services.email import send_venue_rejected_email
                background_tasks.add_task(send_venue_rejected_email, owner_email, venue.get("name", ""), payload.reason)
            return {"message": "Venue rejected.", "verification_status": "REJECTED"}
        except HTTPException:
            raise
        except Exception as e:
            await logger.log_error(request, message=f"reject_venue error: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def request_more_info(self, request, venue_id, payload, background_tasks, current_user):
        try:
            db = self.db_driver
            venue = _get_venue(db, venue_id)
            if not payload.notes:
                raise HTTPException(status_code=400, detail="A message describing required information is needed.")
            db.execute_query(
                "UPDATE venues SET verification_status = 'MORE_INFO_REQUIRED', verification_notes = %s WHERE id = %s",
                (payload.notes, venue_id)
            )
            admin_name = current_user.get("username") or str(current_user.get("id"))
            _log_action(db, venue_id, "MORE_INFO_REQUESTED", current_user.get("id"), "mukijo_admin", admin_name, notes=payload.notes)
            owner_email = _get_owner_email(db, venue_id)
            if owner_email:
                from app.services.email import send_venue_more_info_email
                background_tasks.add_task(send_venue_more_info_email, owner_email, venue.get("name", ""), payload.notes)
            return {"message": "More information requested.", "verification_status": "MORE_INFO_REQUIRED"}
        except HTTPException:
            raise
        except Exception as e:
            await logger.log_error(request, message=f"request_more_info error: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def suspend_venue(self, request, venue_id, payload, background_tasks, current_user):
        try:
            db = self.db_driver
            venue = _get_venue(db, venue_id)
            if venue.get("verification_status") != "VERIFIED":
                raise HTTPException(status_code=400, detail="Only VERIFIED venues can be suspended.")
            if not payload.reason:
                raise HTTPException(status_code=400, detail="A suspension reason is required.")
            db.execute_query(
                "UPDATE venues SET verification_status = 'SUSPENDED', rejection_reason = %s WHERE id = %s",
                (payload.reason, venue_id)
            )
            admin_name = current_user.get("username") or str(current_user.get("id"))
            _log_action(db, venue_id, "SUSPENDED", current_user.get("id"), "mukijo_admin", admin_name, reason=payload.reason)
            owner_email = _get_owner_email(db, venue_id)
            if owner_email:
                from app.services.email import send_venue_suspended_email
                background_tasks.add_task(send_venue_suspended_email, owner_email, venue.get("name", ""), payload.reason)
            return {"message": "Venue suspended. Existing bookings preserved; new bookings blocked.", "verification_status": "SUSPENDED"}
        except HTTPException:
            raise
        except Exception as e:
            await logger.log_error(request, message=f"suspend_venue error: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def register_mukijo_admin(self, request, payload):
        try:
            from app.core.security import hash_password
            db = self.db_driver
            email = payload.get("email", "").lower().strip()
            existing = db.fetch_one("SELECT id FROM mukijo_admins WHERE LOWER(email) = %s LIMIT 1", (email,))
            if existing:
                raise HTTPException(status_code=400, detail="Email already registered.")
            admin_id = db.insert("mukijo_admins", {
                "full_name": payload.get("full_name", "").strip(),
                "email": email,
                "password": hash_password(payload.get("password", "").strip()),
                "is_active": True,
                "created_at": datetime.utcnow()
            })
            return {"message": "Mukijo admin registered.", "admin_id": admin_id}
        except HTTPException:
            raise
        except Exception as e:
            await logger.log_error(request, message=f"register_mukijo_admin error: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def login_mukijo_admin(self, request, payload):
        try:
            from app.core.security import verify_password, create_access_token
            import json
            db = self.db_driver
            email = payload.get("email", "").lower().strip()
            admin = db.fetch_one("SELECT * FROM mukijo_admins WHERE LOWER(email) = %s LIMIT 1", (email,))
            if not admin or not verify_password(payload.get("password", "").strip(), admin.get("password")):
                raise HTTPException(status_code=400, detail="Invalid email or password.")
            if not admin.get("is_active"):
                raise HTTPException(status_code=403, detail="Admin account is deactivated.")
            sub_claim = json.dumps({"id": admin.get("id"), "username": admin.get("full_name"), "role": "mukijo_admin"})
            token = create_access_token({"sub": sub_claim})
            return {"message": "Login successful", "adminId": admin.get("id"), "adminName": admin.get("full_name"), "role": "mukijo_admin", "access_token": token, "token_type": "bearer"}
        except HTTPException:
            raise
        except Exception as e:
            await logger.log_error(request, message=f"login_mukijo_admin error: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
