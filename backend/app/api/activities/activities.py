from fastapi import APIRouter, Depends, Request, HTTPException, Header, status
from typing import List, Optional
from datetime import date, datetime

from app.models import schemas
from app.connectors.connection_service import ConnectionService
from app.auth.authorization import check_user_authorization
from app.logger import logger


def serialize_activity(activity):
    if not activity:
        return None
    a_date = activity.get("date")
    created = activity.get("created_at")
    return {
        "id": activity.get("id"),
        "owner_id": activity.get("owner_id"),
        "venue_id": activity.get("venue_id"),
        "slot_id": activity.get("slot_id"),
        "sport": activity.get("sport"),
        "date": a_date.isoformat() if isinstance(a_date, (date, datetime)) else a_date,
        "time": activity.get("time"),
        "location": activity.get("location"),
        "max_players": activity.get("max_players"),
        "min_players": activity.get("min_players"),
        "skill_level": activity.get("skill_level"),
        "privacy_type": activity.get("privacy_type"),
        "description": activity.get("description"),
        "status": activity.get("status"),
        "created_at": created.isoformat() if isinstance(created, datetime) else created
    }



def serialize_rsvp(rsvp):
    if not rsvp:
        return None
    joined = rsvp.get("joined_at")
    return {
        "id": rsvp.get("id"),
        "activity_id": rsvp.get("activity_id"),
        "user_id": rsvp.get("user_id"),
        "status": rsvp.get("status"),
        "joined_at": joined.isoformat() if isinstance(joined, datetime) else joined
    }


class ActivitiesRouting(ConnectionService):
    def __init__(self) -> None:
        super().__init__()
        
        self.router.add_api_route(
            path="/activities",
            endpoint=self.create_activity,
            methods=["POST"],
            response_model=schemas.ActivityResponse,
            summary="Create a new sports activity and auto-rsvp the creator as confirmed.",
            tags=["Activities"]
        )
        self.router.add_api_route(
            path="/activities",
            endpoint=self.get_activities,
            methods=["GET"],
            response_model=List[schemas.ActivityResponse],
            summary="Discover sports activities filtered by sport and location.",
            tags=["Activities"]
        )
        self.router.add_api_route(
            path="/activities/{activity_id}/rsvp",
            endpoint=self.rsvp_activity,
            methods=["POST"],
            response_model=schemas.ActivityRSVPResponse,
            summary="Join a sports game activity. Places user in waitlist if player limits are exceeded.",
            tags=["Activities"]
        )
        self.router.add_api_route(
            path="/activities/{activity_id}/cancel-rsvp",
            endpoint=self.cancel_rsvp,
            methods=["POST"],
            summary="Cancel a player's RSVP. Auto-promotes the next waitlisted player if a confirmed player leaves.",
            tags=["Activities"]
        )
        self.router.add_api_route(
            path="/activities/{activity_id}",
            endpoint=self.update_activity,
            methods=["PUT"],
            response_model=schemas.ActivityResponse,
            summary="Reschedule or update details of a sports activity. Restricted to club admins only.",
            tags=["Activities"]
        )
        self.router.add_api_route(
            path="/activities/{activity_id}/cancel",
            endpoint=self.cancel_activity,
            methods=["POST"],
            summary="Cancel a sports activity. Restricted to club admins only.",
            tags=["Activities"]
        )

    async def create_activity(
        self,
        request: Request,
        activity: schemas.ActivityCreate,
        x_is_member: Optional[str] = Header(None),
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Create activity router start", step="ROUTER_START", user_info=current_user)
        logic = ActivitiesLogic()
        return await logic.create_activity(request, activity, x_is_member, current_user)

    async def get_activities(
        self,
        request: Request,
        sport: Optional[str] = None,
        location: Optional[str] = None,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Get activities router start", step="ROUTER_START", user_info=current_user)
        logic = ActivitiesLogic()
        return await logic.get_activities(request, sport, location, current_user)

    async def rsvp_activity(
        self,
        request: Request,
        activity_id: int,
        rsvp_data: schemas.ActivityRSVPCreate,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="RSVP activity router start", step="ROUTER_START", user_info=current_user)
        logic = ActivitiesLogic()
        return await logic.rsvp_activity(request, activity_id, rsvp_data, current_user)

    async def cancel_rsvp(
        self,
        request: Request,
        activity_id: int,
        user_id: int,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Cancel RSVP router start", step="ROUTER_START", user_info=current_user)
        logic = ActivitiesLogic()
        return await logic.cancel_rsvp(request, activity_id, user_id, current_user)

    async def update_activity(
        self,
        request: Request,
        activity_id: int,
        activity_update: schemas.ActivityUpdate,
        x_is_member: Optional[str] = Header(None),
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Update activity router start", step="ROUTER_START", user_info=current_user)
        logic = ActivitiesLogic()
        return await logic.update_activity(request, activity_id, activity_update, x_is_member, current_user)

    async def cancel_activity(
        self,
        request: Request,
        activity_id: int,
        x_is_member: Optional[str] = Header(None),
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Cancel activity router start", step="ROUTER_START", user_info=current_user)
        logic = ActivitiesLogic()
        return await logic.cancel_activity(request, activity_id, x_is_member, current_user)


class ActivitiesLogic(ConnectionService):
    def __init__(self) -> None:
        super().__init__()
        logger.log_message_sync(message="ActivitiesLogic instance created")

    async def create_activity(self, request: Request, activity: schemas.ActivityCreate, x_is_member: Optional[str], current_user: dict):
        try:
            with logger.time_operation("CREATE_ACTIVITY", request=request):
                if x_is_member == "true":
                    raise HTTPException(status_code=403, detail="Members are not allowed to create games.")
                
                db = self.db_driver
                insert_data = {
                    "owner_id": activity.owner_id,
                    "venue_id": activity.venue_id,
                    "slot_id": activity.slot_id,
                    "sport": activity.sport,
                    "date": activity.date,
                    "time": activity.time,
                    "location": activity.location,
                    "max_players": activity.max_players,
                    "min_players": activity.min_players or 2,
                    "skill_level": activity.skill_level or "All",
                    "privacy_type": activity.privacy_type or "public",
                    "description": activity.description,
                    "status": "open",
                    "created_at": datetime.utcnow()
                }
                act_id = db.insert("activities", insert_data)

                # Auto join creator
                rsvp_data = {
                    "activity_id": act_id,
                    "user_id": activity.owner_id,
                    "status": "confirmed",
                    "joined_at": datetime.utcnow()
                }
                db.insert("activity_rsvps", rsvp_data)

                new_act = db.fetch_one("SELECT * FROM activities WHERE id = %s", (act_id,))
                return serialize_activity(new_act)
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to create activity: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_activities(self, request: Request, sport: Optional[str], location: Optional[str], current_user: dict):
        try:
            with logger.time_operation("GET_ACTIVITIES", request=request):
                db = self.db_driver
                query = "SELECT * FROM activities"
                params = []
                clauses = []
                
                if sport and sport != "all":
                    clauses.append("sport = %s")
                    params.append(sport)
                if location:
                    clauses.append("location LIKE %s")
                    params.append(f"%{location}%")
                    
                if clauses:
                    query += " WHERE " + " AND ".join(clauses)
                    
                activities = db.fetch_all(query, tuple(params))
                return [serialize_activity(a) for a in activities]
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to get activities: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def rsvp_activity(self, request: Request, activity_id: int, rsvp_data: schemas.ActivityRSVPCreate, current_user: dict):
        try:
            with logger.time_operation("RSVP_ACTIVITY", request=request):
                db = self.db_driver
                # Lock row
                activity = db.fetch_one("SELECT * FROM activities WHERE id = %s FOR UPDATE", (activity_id,))
                if not activity:
                    raise HTTPException(status_code=404, detail="Activity not found.")

                existing = db.fetch_one(
                    "SELECT id FROM activity_rsvps WHERE activity_id = %s AND user_id = %s LIMIT 1",
                    (activity_id, rsvp_data.user_id)
                )
                if existing:
                    raise HTTPException(status_code=400, detail="User already registered for this activity.")

                confirmed_count_res = db.fetch_one(
                    "SELECT COUNT(*) as count FROM activity_rsvps WHERE activity_id = %s AND status = 'confirmed'",
                    (activity_id,)
                )
                confirmed_count = confirmed_count_res.get("count", 0) if confirmed_count_res else 0

                status_val = "confirmed"
                if confirmed_count >= (activity.get("max_players") or 0):
                    status_val = "waitlisted"

                insert_rsvp = {
                    "activity_id": activity_id,
                    "user_id": rsvp_data.user_id,
                    "status": status_val,
                    "joined_at": datetime.utcnow()
                }
                rsvp_id = db.insert("activity_rsvps", insert_rsvp)
                new_rsvp = db.fetch_one("SELECT * FROM activity_rsvps WHERE id = %s", (rsvp_id,))
                return serialize_rsvp(new_rsvp)
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to RSVP: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def cancel_rsvp(self, request: Request, activity_id: int, user_id: int, current_user: dict):
        try:
            with logger.time_operation("CANCEL_RSVP", request=request):
                db = self.db_driver
                activity = db.fetch_one("SELECT * FROM activities WHERE id = %s FOR UPDATE", (activity_id,))
                if not activity:
                    raise HTTPException(status_code=404, detail="Activity not found.")

                rsvp = db.fetch_one(
                    "SELECT * FROM activity_rsvps WHERE activity_id = %s AND user_id = %s LIMIT 1",
                    (activity_id, user_id)
                )
                if not rsvp:
                    raise HTTPException(status_code=404, detail="RSVP registration not found.")

                old_status = rsvp.get("status")
                db.execute_query("DELETE FROM activity_rsvps WHERE id = %s", (rsvp.get("id"),))

                if old_status == "confirmed":
                    next_waitlisted = db.fetch_one(
                        "SELECT * FROM activity_rsvps WHERE activity_id = %s AND status = 'waitlisted' "
                        "ORDER BY joined_at ASC LIMIT 1",
                        (activity_id,)
                    )
                    if next_waitlisted:
                        db.execute_query(
                            "UPDATE activity_rsvps SET status = 'confirmed' WHERE id = %s",
                            (next_waitlisted.get("id"),)
                        )

                return {"detail": "RSVP cancelled successfully."}
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed cancel RSVP: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def update_activity(
        self,
        request: Request,
        activity_id: int,
        activity_update: schemas.ActivityUpdate,
        x_is_member: Optional[str],
        current_user: dict
    ):
        try:
            with logger.time_operation("UPDATE_ACTIVITY", request=request):
                if x_is_member == "true":
                    raise HTTPException(status_code=403, detail="Members are not allowed to reschedule games.")
                
                db = self.db_driver
                activity = db.fetch_one("SELECT * FROM activities WHERE id = %s LIMIT 1", (activity_id,))
                if not activity:
                    raise HTTPException(status_code=404, detail="Activity not found.")

                update_data = activity_update.dict(exclude_unset=True)
                if update_data:
                    set_clauses = []
                    params = []
                    for key, val in update_data.items():
                        set_clauses.append(f"{key} = %s")
                        params.append(val)
                    params.append(activity_id)
                    db.execute_query(
                        f"UPDATE activities SET {', '.join(set_clauses)} WHERE id = %s",
                        tuple(params)
                    )

                updated = db.fetch_one("SELECT * FROM activities WHERE id = %s", (activity_id,))
                return serialize_activity(updated)
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed update activity: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def cancel_activity(self, request: Request, activity_id: int, x_is_member: Optional[str], current_user: dict):
        try:
            with logger.time_operation("CANCEL_ACTIVITY", request=request):
                if x_is_member == "true":
                    raise HTTPException(status_code=403, detail="Members are not allowed to cancel games.")
                
                db = self.db_driver
                activity = db.fetch_one("SELECT * FROM activities WHERE id = %s LIMIT 1", (activity_id,))
                if not activity:
                    raise HTTPException(status_code=404, detail="Activity not found.")

                db.execute_query("UPDATE activities SET status = 'cancelled' WHERE id = %s", (activity_id,))

                if activity.get("slot_id"):
                    booking = db.fetch_one(
                        "SELECT DISTINCT b.* FROM bookings b JOIN booking_slots bs ON b.id = bs.booking_id "
                        "WHERE bs.slot_id = %s AND b.status = 'reserved' LIMIT 1",
                        (activity.get("slot_id"),)
                    )
                    if booking:
                        db.execute_query("UPDATE bookings SET status = 'cancelled' WHERE id = %s", (booking.get("id"),))
                        # Free all slots for this booking
                        slots = db.fetch_all("SELECT slot_id FROM booking_slots WHERE booking_id = %s", (booking.get("id"),))
                        for slot in slots:
                            db.execute_query(
                                "UPDATE slots SET status = 'AVAILABLE', held_until = NULL, held_by_user_id = NULL WHERE id = %s",
                                (slot.get("slot_id"),)
                            )

                return {"message": "Activity cancelled successfully.", "status": "cancelled"}
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed cancel activity: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
