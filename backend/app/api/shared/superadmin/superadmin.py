from fastapi import APIRouter, Request, HTTPException, status
from typing import Optional
from datetime import datetime
from pydantic import BaseModel

from app.connectors.connection_service import ConnectionService
from app.logger import logger

router = APIRouter(prefix="", tags=["SuperAdmin"])


class SuperAdminLoginPayload(BaseModel):
    username: str
    password: str


class ClubActionPayload(BaseModel):
    reason: Optional[str] = None


class SuperAdminService(ConnectionService):
    def __init__(self) -> None:
        super().__init__()
        self._columns_checked = False

    def _ensure_columns(self):
        if getattr(self, "_columns_checked", False):
            return
        self._columns_checked = True
        db = self.db_driver
        # Add approval_status to users
        try:
            db.execute_query("ALTER TABLE users ADD COLUMN approval_status VARCHAR(255) DEFAULT 'APPROVED'")
        except Exception:
            pass
        # Add approved_at to users (try TIMESTAMP for PostgreSQL, DATETIME for SQLite)
        try:
            db.execute_query("ALTER TABLE users ADD COLUMN approved_at TIMESTAMP")
        except Exception:
            try:
                db.execute_query("ALTER TABLE users ADD COLUMN approved_at DATETIME")
            except Exception:
                pass
        # Add rejection_reason to users
        try:
            db.execute_query("ALTER TABLE users ADD COLUMN rejection_reason VARCHAR(255)")
        except Exception:
            pass
        # Add approval_status to members
        try:
            db.execute_query("ALTER TABLE members ADD COLUMN approval_status VARCHAR(255) DEFAULT 'APPROVED'")
        except Exception:
            pass
        # Add approved_at to members
        try:
            db.execute_query("ALTER TABLE members ADD COLUMN approved_at TIMESTAMP")
        except Exception:
            try:
                db.execute_query("ALTER TABLE members ADD COLUMN approved_at DATETIME")
            except Exception:
                pass
        # Add approval_status to venue_owners
        try:
            db.execute_query("ALTER TABLE venue_owners ADD COLUMN approval_status VARCHAR(255) DEFAULT 'APPROVED'")
        except Exception:
            pass
        # Add approved_at to venue_owners
        try:
            db.execute_query("ALTER TABLE venue_owners ADD COLUMN approved_at TIMESTAMP")
        except Exception:
            try:
                db.execute_query("ALTER TABLE venue_owners ADD COLUMN approved_at DATETIME")
            except Exception:
                pass
        # Add rejection_reason to venue_owners
        try:
            db.execute_query("ALTER TABLE venue_owners ADD COLUMN rejection_reason VARCHAR(255)")
        except Exception:
            pass

    async def login(self, request: Request, payload: SuperAdminLoginPayload):
        username = payload.username.strip()
        password = payload.password.strip()

        # Fixed SuperAdmin Credentials
        if username.lower() not in ["superadmin", "superadmin@mukijo.com"] or password != "superadmin123":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid SuperAdmin credentials."
            )

        return {
            "message": "SuperAdmin login successful",
            "accessToken": "superadmin-secret-access-token",
            "userRole": "superadmin",
            "userName": "Super Admin",
            "userEmail": "superadmin@mukijo.com"
        }

    async def get_dashboard_stats(self, request: Request):
        try:
            self._ensure_columns()
            db = self.db_driver
            total_clubs = db.fetch_one("SELECT COUNT(*) as count FROM users")
            pending_clubs = db.fetch_one("SELECT COUNT(*) as count FROM users WHERE approval_status = 'PENDING_APPROVAL'")
            approved_clubs = db.fetch_one("SELECT COUNT(*) as count FROM users WHERE approval_status = 'APPROVED' OR approval_status IS NULL OR approval_status = ''")
            total_members = db.fetch_one("SELECT COUNT(*) as count FROM members")

            return {
                "total_clubs": total_clubs.get("count", 0) if total_clubs else 0,
                "pending_clubs": pending_clubs.get("count", 0) if pending_clubs else 0,
                "approved_clubs": approved_clubs.get("count", 0) if approved_clubs else 0,
                "total_members": total_members.get("count", 0) if total_members else 0,
            }
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to get SuperAdmin stats: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_pending_clubs(self, request: Request):
        try:
            self._ensure_columns()
            db = self.db_driver
            clubs = db.fetch_all(
                "SELECT id, club_name, first_name, last_name, email, phone, sport, country, state, member_count, approval_status FROM users WHERE approval_status = 'PENDING_APPROVAL' ORDER BY id DESC"
            )
            return clubs or []
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to get pending clubs: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_approved_clubs(self, request: Request):
        try:
            self._ensure_columns()
            db = self.db_driver
            clubs = db.fetch_all(
                "SELECT id, club_name, first_name, last_name, email, phone, sport, country, state, member_count, approval_status, approved_at FROM users WHERE approval_status = 'APPROVED' OR approval_status IS NULL OR approval_status = '' ORDER BY id DESC"
            )
            formatted_clubs = []
            for c in (clubs or []):
                club_dict = dict(c)
                if isinstance(club_dict.get("approved_at"), datetime):
                    club_dict["approved_at"] = club_dict["approved_at"].isoformat()
                formatted_clubs.append(club_dict)
            return formatted_clubs
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to get approved clubs: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_all_clubs(self, request: Request):
        try:
            self._ensure_columns()
            db = self.db_driver
            clubs = db.fetch_all(
                "SELECT id, club_name, first_name, last_name, email, phone, sport, country, state, member_count, approval_status FROM users ORDER BY id DESC"
            )
            return clubs or []
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to get all clubs: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def approve_club(self, request: Request, user_id: int):
        try:
            self._ensure_columns()
            db = self.db_driver
            user = db.fetch_one("SELECT id FROM users WHERE id = %s", (user_id,))
            if not user:
                raise HTTPException(status_code=404, detail="Club Admin account not found.")

            db.execute_query(
                "UPDATE users SET approval_status = 'APPROVED', approved_at = %s WHERE id = %s",
                (datetime.utcnow(), user_id)
            )
            return {"message": "Club Admin approved successfully.", "user_id": user_id, "approval_status": "APPROVED"}
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to approve club: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def reject_club(self, request: Request, user_id: int, payload: Optional[ClubActionPayload] = None):
        try:
            self._ensure_columns()
            db = self.db_driver
            user = db.fetch_one("SELECT id FROM users WHERE id = %s", (user_id,))
            if not user:
                raise HTTPException(status_code=404, detail="Club Admin account not found.")

            reason = payload.reason if payload else None
            db.execute_query(
                "UPDATE users SET approval_status = 'REJECTED', rejection_reason = %s WHERE id = %s",
                (reason, user_id)
            )
            return {"message": "Club Admin registration rejected.", "user_id": user_id, "approval_status": "REJECTED"}
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to reject club: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_pending_venue_owners(self, request: Request):
        try:
            self._ensure_columns()
            db = self.db_driver
            owners = db.fetch_all(
                "SELECT id, full_name, email, phone, aadhar_number, approval_status, created_at FROM venue_owners WHERE approval_status = 'PENDING_APPROVAL' ORDER BY id DESC"
            )
            result = []
            for o in (owners or []):
                o_dict = dict(o)
                venues = db.fetch_all("SELECT id, name, location, sports_supported FROM venues WHERE venue_owner_id = %s", (o_dict["id"],))
                o_dict["venues"] = [dict(v) for v in (venues or [])]
                result.append(o_dict)
            return result
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to get pending venue owners: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_approved_venue_owners(self, request: Request):
        try:
            self._ensure_columns()
            db = self.db_driver
            owners = db.fetch_all(
                "SELECT id, full_name, email, phone, aadhar_number, approval_status, approved_at FROM venue_owners WHERE approval_status = 'APPROVED' OR approval_status IS NULL OR approval_status = '' ORDER BY id DESC"
            )
            result = []
            for o in (owners or []):
                o_dict = dict(o)
                if isinstance(o_dict.get("approved_at"), datetime):
                    o_dict["approved_at"] = o_dict["approved_at"].isoformat()
                venues = db.fetch_all("SELECT id, name, location, sports_supported FROM venues WHERE venue_owner_id = %s", (o_dict["id"],))
                o_dict["venues"] = [dict(v) for v in (venues or [])]
                result.append(o_dict)
            return result
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to get approved venue owners: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def approve_venue_owner(self, request: Request, owner_id: int):
        try:
            self._ensure_columns()
            db = self.db_driver
            owner = db.fetch_one("SELECT id FROM venue_owners WHERE id = %s", (owner_id,))
            if not owner:
                raise HTTPException(status_code=404, detail="Venue Owner account not found.")

            db.execute_query(
                "UPDATE venue_owners SET approval_status = 'APPROVED', approved_at = %s WHERE id = %s",
                (datetime.utcnow(), owner_id)
            )
            db.execute_query(
                "UPDATE venues SET verification_status = 'VERIFIED' WHERE venue_owner_id = %s",
                (owner_id,)
            )
            return {"message": "Venue Owner approved successfully.", "owner_id": owner_id, "approval_status": "APPROVED"}
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to approve venue owner: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def reject_venue_owner(self, request: Request, owner_id: int, payload: Optional[ClubActionPayload] = None):
        try:
            self._ensure_columns()
            db = self.db_driver
            owner = db.fetch_one("SELECT id FROM venue_owners WHERE id = %s", (owner_id,))
            if not owner:
                raise HTTPException(status_code=404, detail="Venue Owner account not found.")

            reason = payload.reason if payload else None
            db.execute_query(
                "UPDATE venue_owners SET approval_status = 'REJECTED', rejection_reason = %s WHERE id = %s",
                (reason, owner_id)
            )
            return {"message": "Venue Owner registration rejected.", "owner_id": owner_id, "approval_status": "REJECTED"}
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to reject venue owner: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")


service = SuperAdminService()


@router.post("/superadmin/login")
async def login(request: Request, payload: SuperAdminLoginPayload):
    return await service.login(request, payload)


@router.get("/superadmin/dashboard-stats")
async def get_dashboard_stats(request: Request):
    return await service.get_dashboard_stats(request)


@router.get("/superadmin/pending-clubs")
async def get_pending_clubs(request: Request):
    return await service.get_pending_clubs(request)


@router.get("/superadmin/approved-clubs")
async def get_approved_clubs(request: Request):
    return await service.get_approved_clubs(request)


@router.get("/superadmin/all-clubs")
async def get_all_clubs(request: Request):
    return await service.get_all_clubs(request)


@router.post("/superadmin/approve-club/{user_id}")
async def approve_club(request: Request, user_id: int):
    return await service.approve_club(request, user_id)


@router.post("/superadmin/reject-club/{user_id}")
async def reject_club(request: Request, user_id: int, payload: Optional[ClubActionPayload] = None):
    return await service.reject_club(request, user_id, payload)


@router.get("/superadmin/pending-venue-owners")
async def get_pending_venue_owners(request: Request):
    return await service.get_pending_venue_owners(request)


@router.get("/superadmin/approved-venue-owners")
async def get_approved_venue_owners(request: Request):
    return await service.get_approved_venue_owners(request)


@router.post("/superadmin/approve-venue-owner/{owner_id}")
async def approve_venue_owner(request: Request, owner_id: int):
    return await service.approve_venue_owner(request, owner_id)


@router.post("/superadmin/reject-venue-owner/{owner_id}")
async def reject_venue_owner(request: Request, owner_id: int, payload: Optional[ClubActionPayload] = None):
    return await service.reject_venue_owner(request, owner_id, payload)
