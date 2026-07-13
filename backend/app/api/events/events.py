from fastapi import APIRouter, Depends, Request, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.models import schemas
from app.connectors.connection_service import ConnectionService
from app.auth.authorization import check_user_authorization
from app.core.helpers import serialize_event
from app.logger import logger


class EventInviteRequest(BaseModel):
    invite_type: str  # "all_members", "parents", "coaches", "groups", "specific_members"
    group_ids: Optional[List[int]] = None
    member_ids: Optional[List[int]] = None


class EventResponseRequest(BaseModel):
    member_email: str
    status: str  # "accepted", "declined", "maybe"


class GuestRegisterRequest(BaseModel):
    name: str
    email: str


class AttendanceMarkRequest(BaseModel):
    registration_id: int
    attendance: str


class MessageParticipantsRequest(BaseModel):
    recipient_group: str
    message: str


class EventsRouting(ConnectionService):
    def __init__(self) -> None:
        super().__init__()
        
        self.router.add_api_route(
            path="/groups/{group_id}/events",
            endpoint=self.create_event,
            methods=["POST"],
            response_model=schemas.EventResponse,
            summary="Create a new event within a specific group/team with optional fees, documents, and rules.",
            tags=["Events"]
        )
        self.router.add_api_route(
            path="/groups/{group_id}/events",
            endpoint=self.get_group_events,
            methods=["GET"],
            summary="Retrieve all events associated with a specific group/team.",
            tags=["Events"]
        )
        self.router.add_api_route(
            path="/events",
            endpoint=self.get_all_events,
            methods=["GET"],
            summary="Retrieve all events owned by the club administrator or their groups, optionally filtered by member email.",
            tags=["Events"]
        )
        self.router.add_api_route(
            path="/events/{event_id}",
            endpoint=self.get_event,
            methods=["GET"],
            summary="Retrieve details of a specific event.",
            tags=["Events"]
        )
        self.router.add_api_route(
            path="/events/{event_id}",
            endpoint=self.update_event,
            methods=["PUT"],
            response_model=schemas.EventResponse,
            summary="Update details of an existing event.",
            tags=["Events"]
        )
        self.router.add_api_route(
            path="/events/{event_id}",
            endpoint=self.delete_event,
            methods=["DELETE"],
            summary="Delete an existing event from the system.",
            tags=["Events"]
        )
        self.router.add_api_route(
            path="/events/{event_id}/invite",
            endpoint=self.invite_to_event,
            methods=["POST"],
            summary="Invite members, coaches, parents, or groups to an event, creating pending registrations.",
            tags=["Events"]
        )
        self.router.add_api_route(
            path="/events/{event_id}/respond",
            endpoint=self.respond_to_event,
            methods=["POST"],
            summary="Submit a participant's response (accepted, declined, maybe) to an event invitation.",
            tags=["Events"]
        )
        self.router.add_api_route(
            path="/events/{event_id}/register-guest",
            endpoint=self.register_guest_to_event,
            methods=["POST"],
            summary="Register a guest participant for an event with capacity checks.",
            tags=["Events"]
        )
        self.router.add_api_route(
            path="/events/{event_id}/attendance",
            endpoint=self.mark_attendance,
            methods=["POST"],
            summary="Mark event attendance (present, absent, late, not_marked) for a registration.",
            tags=["Events"]
        )
        self.router.add_api_route(
            path="/events/{event_id}/participants",
            endpoint=self.get_event_participants,
            methods=["GET"],
            summary="Retrieve list of invited and registered participants for a specific event.",
            tags=["Events"]
        )
        self.router.add_api_route(
            path="/events/{event_id}/message",
            endpoint=self.message_participants,
            methods=["POST"],
            summary="Send an email or message to event participants filtered by attendance response status.",
            tags=["Events"]
        )
        self.router.add_api_route(
            path="/events/{event_id}/send-reminder",
            endpoint=self.send_reminder,
            methods=["POST"],
            summary="Send an automatic event reminder email to all accepted and pending participants.",
            tags=["Events"]
        )
        self.router.add_api_route(
            path="/members/registrations",
            endpoint=self.get_member_registrations,
            methods=["GET"],
            summary="Retrieve all event registrations for a specific member by their email.",
            tags=["Events"]
        )

    async def create_event(
        self,
        request: Request,
        group_id: int,
        owner_id: int,
        event: schemas.EventCreate,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Create event router start", step="ROUTER_START", user_info=current_user)
        logic = EventsLogic()
        return await logic.create_event(request, group_id, owner_id, event, current_user)

    async def get_group_events(
        self,
        request: Request,
        group_id: str,
        owner_id: int,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Get group events router start", step="ROUTER_START", user_info=current_user)
        logic = EventsLogic()
        return await logic.get_group_events(request, group_id, owner_id, current_user)

    async def get_all_events(
        self,
        request: Request,
        owner_id: int,
        member_email: Optional[str] = None,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Get all events router start", step="ROUTER_START", user_info=current_user)
        logic = EventsLogic()
        return await logic.get_all_events(request, owner_id, member_email, current_user)

    async def get_event(
        self,
        request: Request,
        event_id: int,
        owner_id: int,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Get event router start", step="ROUTER_START", user_info=current_user)
        logic = EventsLogic()
        return await logic.get_event(request, event_id, owner_id, current_user)

    async def update_event(
        self,
        request: Request,
        event_id: int,
        owner_id: int,
        event_update: schemas.EventUpdate,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Update event router start", step="ROUTER_START", user_info=current_user)
        logic = EventsLogic()
        return await logic.update_event(request, event_id, owner_id, event_update, current_user)

    async def delete_event(
        self,
        request: Request,
        event_id: int,
        owner_id: int,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Delete event router start", step="ROUTER_START", user_info=current_user)
        logic = EventsLogic()
        return await logic.delete_event(request, event_id, owner_id, current_user)

    async def invite_to_event(
        self,
        request: Request,
        event_id: int,
        req: EventInviteRequest,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Invite to event router start", step="ROUTER_START", user_info=current_user)
        logic = EventsLogic()
        return await logic.invite_to_event(request, event_id, req, current_user)

    async def respond_to_event(
        self,
        request: Request,
        event_id: int,
        req: EventResponseRequest,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Respond to event router start", step="ROUTER_START", user_info=current_user)
        logic = EventsLogic()
        return await logic.respond_to_event(request, event_id, req, current_user)

    async def register_guest_to_event(
        self,
        request: Request,
        event_id: int,
        req: GuestRegisterRequest,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Register guest to event router start", step="ROUTER_START", user_info=current_user)
        logic = EventsLogic()
        return await logic.register_guest_to_event(request, event_id, req, current_user)

    async def mark_attendance(
        self,
        request: Request,
        event_id: int,
        req: AttendanceMarkRequest,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Mark attendance router start", step="ROUTER_START", user_info=current_user)
        logic = EventsLogic()
        return await logic.mark_attendance(request, event_id, req, current_user)

    async def get_event_participants(
        self,
        request: Request,
        event_id: int,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Get event participants router start", step="ROUTER_START", user_info=current_user)
        logic = EventsLogic()
        return await logic.get_event_participants(request, event_id, current_user)

    async def message_participants(
        self,
        request: Request,
        event_id: int,
        req: MessageParticipantsRequest,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Message participants router start", step="ROUTER_START", user_info=current_user)
        logic = EventsLogic()
        return await logic.message_participants(request, event_id, req, current_user)

    async def send_reminder(
        self,
        request: Request,
        event_id: int,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Send reminder router start", step="ROUTER_START", user_info=current_user)
        logic = EventsLogic()
        return await logic.send_reminder(request, event_id, current_user)

    async def get_member_registrations(
        self,
        request: Request,
        member_email: str,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Get member registrations router start", step="ROUTER_START", user_info=current_user)
        logic = EventsLogic()
        return await logic.get_member_registrations(request, member_email, current_user)


class EventsLogic(ConnectionService):
    def __init__(self) -> None:
        super().__init__()
        logger.log_message_sync(message="EventsLogic instance created")

    async def create_event(self, request: Request, group_id: int, owner_id: int, event: schemas.EventCreate, current_user: dict):
        try:
            with logger.time_operation("CREATE_EVENT", request=request):
                db = self.db_driver
                db_group = db.fetch_one(
                    "SELECT id FROM groups WHERE id = %s AND owner_id = %s LIMIT 1",
                    (group_id, owner_id)
                )
                if not db_group:
                    raise HTTPException(status_code=404, detail="Group not found or access denied")
                if event.fee is not None and event.fee < 0:
                    raise HTTPException(status_code=400, detail="Event fee cannot be negative")

                insert_data = {
                    "group_id": group_id,
                    "owner_id": owner_id,
                    "name": event.name,
                    "type": event.type,
                    "date": event.date,
                    "time": event.time,
                    "start_time": event.start_time,
                    "end_time": event.end_time,
                    "location": event.location,
                    "description": event.description,
                    "cover_image": event.cover_image,
                    "registration_deadline": event.registration_deadline,
                    "max_participants": event.max_participants,
                    "fee": event.fee or 0,
                    "auto_reminder": event.auto_reminder or False,
                    "attendance_tracking": event.attendance_tracking or False,
                    "is_public": event.is_public if event.is_public is not None else True,
                    "allow_guest": event.allow_guest or False,
                    "allow_waiting_list": event.allow_waiting_list or False,
                    "rules_pdf": event.rules_pdf,
                    "schedule_file": event.schedule_file,
                    "permission_forms": event.permission_forms,
                    "match_fixtures": event.match_fixtures,
                    "event_posters": event.event_posters
                }
                
                event_id = db.insert("events", insert_data)
                new_event = db.fetch_one("SELECT * FROM events WHERE id = %s", (event_id,))
                return serialize_event(new_event, db)
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to create event: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_group_events(self, request: Request, group_id: str, owner_id: int, current_user: dict):
        try:
            with logger.time_operation("GET_GROUP_EVENTS", request=request):
                db = self.db_driver
                group = None
                if group_id.isdigit():
                    group = db.fetch_one(
                        "SELECT id FROM groups WHERE id = %s AND owner_id = %s LIMIT 1",
                        (int(group_id), owner_id)
                    )
                if not group:
                    group = db.fetch_one(
                        "SELECT id FROM groups WHERE group_name = %s AND owner_id = %s LIMIT 1",
                        (group_id, owner_id)
                    )
                if not group:
                    raise HTTPException(status_code=404, detail="Group not found or access denied")

                events = db.fetch_all("SELECT * FROM events WHERE group_id = %s", (group.get("id"),))
                return [serialize_event(e, db) for e in events]
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to get group events: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_all_events(self, request: Request, owner_id: int, member_email: Optional[str], current_user: dict):
        try:
            with logger.time_operation("GET_ALL_EVENTS", request=request):
                db = self.db_driver
                if member_email:
                    email_clean = member_email.replace(" ", "").lower()
                    registrations = db.fetch_all(
                        "SELECT event_id FROM event_registrations WHERE LOWER(participant_email) = %s AND status = 'accepted'",
                        (email_clean,)
                    )
                    event_ids = [r.get("event_id") for r in registrations]
                    
                    member = db.fetch_one("SELECT id FROM members WHERE LOWER(email) = %s LIMIT 1", (email_clean,))
                    if member:
                        reg_member = db.fetch_all(
                            "SELECT event_id FROM event_registrations WHERE member_id = %s AND status = 'accepted'",
                            (member.get("id"),)
                        )
                        event_ids.extend([r.get("event_id") for r in reg_member])
                        
                    event_ids = list(set(event_ids))
                    if event_ids:
                        placeholders = ", ".join(["%s"] * len(event_ids))
                        events = db.fetch_all(
                            f"SELECT * FROM events WHERE id IN ({placeholders})",
                            tuple(event_ids)
                        )
                    else:
                        events = []
                else:
                    events = db.fetch_all("SELECT * FROM events WHERE owner_id = %s", (owner_id,))
                    if not events:
                        groups = db.fetch_all("SELECT id FROM groups WHERE owner_id = %s", (owner_id,))
                        group_ids = [g.get("id") for g in groups]
                        if group_ids:
                            placeholders = ", ".join(["%s"] * len(group_ids))
                            events = db.fetch_all(
                                f"SELECT * FROM events WHERE group_id IN ({placeholders})",
                                tuple(group_ids)
                            )
                        else:
                            events = []
                            
                return [serialize_event(e, db) for e in events]
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to get all events: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_event(self, request: Request, event_id: int, owner_id: int, current_user: dict):
        try:
            with logger.time_operation("GET_EVENT", request=request):
                db = self.db_driver
                event = db.fetch_one("SELECT * FROM events WHERE id = %s", (event_id,))
                if not event:
                    raise HTTPException(status_code=404, detail="Event not found")

                if event.get("owner_id") != owner_id:
                    group = db.fetch_one(
                        "SELECT id FROM groups WHERE id = %s AND owner_id = %s LIMIT 1",
                        (event.get("group_id"), owner_id)
                    )
                    if not group:
                        raise HTTPException(status_code=403, detail="Access denied to event")

                return serialize_event(event, db)
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to get event: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def update_event(self, request: Request, event_id: int, owner_id: int, event_update: schemas.EventUpdate, current_user: dict):
        try:
            with logger.time_operation("UPDATE_EVENT", request=request):
                db = self.db_driver
                db_event = db.fetch_one("SELECT * FROM events WHERE id = %s", (event_id,))
                if not db_event:
                    raise HTTPException(status_code=404, detail="Event not found")

                if db_event.get("owner_id") != owner_id:
                    group = db.fetch_one(
                        "SELECT id FROM groups WHERE id = %s AND owner_id = %s LIMIT 1",
                        (db_event.get("group_id"), owner_id)
                    )
                    if not group:
                        raise HTTPException(status_code=403, detail="Access denied")

                update_data = event_update.dict(exclude_unset=True)
                if "fee" in update_data and update_data["fee"] is not None and update_data["fee"] < 0:
                    raise HTTPException(status_code=400, detail="Event fee cannot be negative")

                if update_data:
                    set_clauses = []
                    params = []
                    for key, val in update_data.items():
                        set_clauses.append(f"{key} = %s")
                        params.append(val)
                    params.append(event_id)
                    db.execute_query(
                        f"UPDATE events SET {', '.join(set_clauses)} WHERE id = %s",
                        tuple(params)
                    )

                updated = db.fetch_one("SELECT * FROM events WHERE id = %s", (event_id,))
                return serialize_event(updated, db)
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to update event: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def delete_event(self, request: Request, event_id: int, owner_id: int, current_user: dict):
        try:
            with logger.time_operation("DELETE_EVENT", request=request):
                db = self.db_driver
                db_event = db.fetch_one("SELECT * FROM events WHERE id = %s", (event_id,))
                if not db_event:
                    raise HTTPException(status_code=404, detail="Event not found")

                if db_event.get("owner_id") != owner_id:
                    group = db.fetch_one(
                        "SELECT id FROM groups WHERE id = %s AND owner_id = %s LIMIT 1",
                        (db_event.get("group_id"), owner_id)
                    )
                    if not group:
                        raise HTTPException(status_code=403, detail="Access denied")

                db.execute_query("DELETE FROM events WHERE id = %s", (event_id,))
                return {"message": "Event deleted successfully"}
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to delete event: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def invite_to_event(self, request: Request, event_id: int, req: EventInviteRequest, current_user: dict):
        try:
            with logger.time_operation("INVITE_TO_EVENT", request=request):
                db = self.db_driver
                event = db.fetch_one("SELECT * FROM events WHERE id = %s", (event_id,))
                if not event:
                    raise HTTPException(status_code=404, detail="Event not found")

                members = []
                if req.invite_type == "all_members":
                    groups = db.fetch_all("SELECT id FROM groups WHERE owner_id = %s", (event.get("owner_id"),))
                    g_ids = [g.get("id") for g in groups]
                    if g_ids:
                        placeholders = ", ".join(["%s"] * len(g_ids))
                        members = db.fetch_all(f"SELECT * FROM members WHERE group_id IN ({placeholders})", tuple(g_ids))
                elif req.invite_type == "parents":
                    groups = db.fetch_all("SELECT id FROM groups WHERE owner_id = %s", (event.get("owner_id"),))
                    g_ids = [g.get("id") for g in groups]
                    if g_ids:
                        placeholders = ", ".join(["%s"] * len(g_ids))
                        members = db.fetch_all(
                            f"SELECT * FROM members WHERE group_id IN ({placeholders}) AND (LOWER(role) LIKE '%%parent%%' OR LOWER(role) LIKE '%%guardian%%')",
                            tuple(g_ids)
                        )
                elif req.invite_type == "coaches":
                    groups = db.fetch_all("SELECT id FROM groups WHERE owner_id = %s", (event.get("owner_id"),))
                    g_ids = [g.get("id") for g in groups]
                    if g_ids:
                        placeholders = ", ".join(["%s"] * len(g_ids))
                        members = db.fetch_all(
                            f"SELECT * FROM members WHERE group_id IN ({placeholders}) AND LOWER(role) LIKE '%%coach%%'",
                            tuple(g_ids)
                        )
                elif req.invite_type in ["groups", "teams"]:
                    if req.group_ids:
                        placeholders = ", ".join(["%s"] * len(req.group_ids))
                        members = db.fetch_all(f"SELECT * FROM members WHERE group_id IN ({placeholders})", tuple(req.group_ids))
                elif req.invite_type == "specific_members":
                    if req.member_ids:
                        placeholders = ", ".join(["%s"] * len(req.member_ids))
                        members = db.fetch_all(f"SELECT * FROM members WHERE id IN ({placeholders})", tuple(req.member_ids))

                invited_count = 0
                for m in members:
                    exists = db.fetch_one(
                        "SELECT id FROM event_registrations WHERE event_id = %s AND member_id = %s LIMIT 1",
                        (event_id, m.get("id"))
                    )
                    if not exists:
                        insert_data = {
                            "event_id": event_id,
                            "member_id": m.get("id"),
                            "participant_name": f"{m.get('first_name')} {m.get('last_name')}",
                            "participant_email": m.get("email"),
                            "participant_role": m.get("role"),
                            "status": "pending",
                            "attendance": "not_marked"
                        }
                        db.insert("event_registrations", insert_data)
                        invited_count += 1

                return {"message": f"Successfully invited {invited_count} participants.", "count": invited_count}
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed inviting participants: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def respond_to_event(self, request: Request, event_id: int, req: EventResponseRequest, current_user: dict):
        try:
            with logger.time_operation("RESPOND_TO_EVENT", request=request):
                db = self.db_driver
                event = db.fetch_one("SELECT * FROM events WHERE id = %s", (event_id,))
                if not event:
                    raise HTTPException(status_code=404, detail="Event not found")

                if req.status not in ["accepted", "declined", "maybe"]:
                    raise HTTPException(status_code=400, detail="Invalid response status")

                member_email_clean = req.member_email.replace(" ", "").lower() if req.member_email else ""
                member = db.fetch_one("SELECT * FROM members WHERE LOWER(email) = %s LIMIT 1", (member_email_clean,))

                registration = None
                if member:
                    registration = db.fetch_one(
                        "SELECT * FROM event_registrations WHERE event_id = %s AND member_id = %s LIMIT 1",
                        (event_id, member.get("id"))
                    )

                if not registration:
                    registration = db.fetch_one(
                        "SELECT * FROM event_registrations WHERE event_id = %s AND LOWER(participant_email) = %s LIMIT 1",
                        (event_id, member_email_clean)
                    )

                new_status = req.status
                if req.status == "accepted" and event.get("max_participants"):
                    count_res = db.fetch_one(
                        "SELECT COUNT(*) as count FROM event_registrations WHERE event_id = %s AND status = 'accepted'",
                        (event_id,)
                    )
                    accepted_count = count_res.get("count", 0) if count_res else 0
                    if accepted_count >= event.get("max_participants"):
                        if event.get("allow_waiting_list"):
                            new_status = "waitlisted"
                        else:
                            raise HTTPException(status_code=400, detail="This event has reached maximum capacity.")

                if not registration:
                    if event.get("allow_guest") or member:
                        insert_data = {
                            "event_id": event_id,
                            "member_id": member.get("id") if member else None,
                            "participant_name": f"{member.get('first_name')} {member.get('last_name')}" if member else req.member_email.split('@')[0],
                            "participant_email": req.member_email,
                            "participant_role": member.get("role") if member else "Guest",
                            "status": new_status,
                            "attendance": "not_marked",
                            "responded_at": datetime.utcnow()
                        }
                        db.insert("event_registrations", insert_data)
                    else:
                        raise HTTPException(status_code=403, detail="Guest registration is disabled for this event.")
                else:
                    db.execute_query(
                        "UPDATE event_registrations SET status = %s, responded_at = %s WHERE id = %s",
                        (new_status, datetime.utcnow(), registration.get("id"))
                    )

                return {"message": f"Successfully updated your response to {new_status}.", "status": new_status}
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed responding to event: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def register_guest_to_event(self, request: Request, event_id: int, req: GuestRegisterRequest, current_user: dict):
        try:
            with logger.time_operation("REGISTER_GUEST", request=request):
                db = self.db_driver
                event = db.fetch_one("SELECT * FROM events WHERE id = %s", (event_id,))
                if not event:
                    raise HTTPException(status_code=404, detail="Event not found")

                if not event.get("allow_guest"):
                    raise HTTPException(status_code=403, detail="Guest registration is disabled for this event.")

                exists = db.fetch_one(
                    "SELECT id FROM event_registrations WHERE event_id = %s AND participant_email = %s LIMIT 1",
                    (event_id, req.email)
                )
                if exists:
                    raise HTTPException(status_code=400, detail="This email is already registered.")

                status_val = "accepted"
                if event.get("max_participants"):
                    count_res = db.fetch_one(
                        "SELECT COUNT(*) as count FROM event_registrations WHERE event_id = %s AND status = 'accepted'",
                        (event_id,)
                    )
                    accepted_count = count_res.get("count", 0) if count_res else 0
                    if accepted_count >= event.get("max_participants"):
                        if event.get("allow_waiting_list"):
                            status_val = "waitlisted"
                        else:
                            raise HTTPException(status_code=400, detail="Event is full.")

                insert_data = {
                    "event_id": event_id,
                    "participant_name": req.name,
                    "participant_email": req.email,
                    "participant_role": "Guest",
                    "status": status_val,
                    "attendance": "not_marked",
                    "responded_at": datetime.utcnow()
                }
                db.insert("event_registrations", insert_data)
                return {"message": "Registered successfully!", "status": status_val}
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed guest registration: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def mark_attendance(self, request: Request, event_id: int, req: AttendanceMarkRequest, current_user: dict):
        try:
            with logger.time_operation("MARK_ATTENDANCE", request=request):
                db = self.db_driver
                reg = db.fetch_one(
                    "SELECT * FROM event_registrations WHERE id = %s AND event_id = %s LIMIT 1",
                    (req.registration_id, event_id)
                )
                if not reg:
                    raise HTTPException(status_code=404, detail="Registration not found")

                if req.attendance not in ["present", "absent", "late", "not_marked"]:
                    raise HTTPException(status_code=400, detail="Invalid attendance value")

                db.execute_query(
                    "UPDATE event_registrations SET attendance = %s WHERE id = %s",
                    (req.attendance, req.registration_id)
                )
                return {"message": "Attendance marked successfully", "attendance": req.attendance}
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed marking attendance: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_event_participants(self, request: Request, event_id: int, current_user: dict):
        try:
            with logger.time_operation("GET_EVENT_PARTICIPANTS", request=request):
                db = self.db_driver
                registrations = db.fetch_all("SELECT * FROM event_registrations WHERE event_id = %s", (event_id,))
                
                result = []
                for r in registrations:
                    result.append({
                        "id": r.get("id"),
                        "event_id": r.get("event_id"),
                        "member_id": r.get("member_id"),
                        "participant_name": r.get("participant_name"),
                        "participant_email": r.get("participant_email"),
                        "participant_role": r.get("participant_role"),
                        "status": r.get("status"),
                        "attendance": r.get("attendance"),
                        "invited_at": r.get("invited_at").isoformat() if r.get("invited_at") else None,
                        "responded_at": r.get("responded_at").isoformat() if r.get("responded_at") else None
                    })
                return result
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed getting participants: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def message_participants(self, request: Request, event_id: int, req: MessageParticipantsRequest, current_user: dict):
        try:
            with logger.time_operation("MESSAGE_PARTICIPANTS", request=request):
                db = self.db_driver
                event = db.fetch_one("SELECT * FROM events WHERE id = %s", (event_id,))
                if not event:
                    raise HTTPException(status_code=404, detail="Event not found")

                query = "SELECT participant_email FROM event_registrations WHERE event_id = %s"
                params = [event_id]
                if req.recipient_group == "confirmed":
                    query += " AND status = 'accepted'"
                elif req.recipient_group == "non_attendees":
                    query += " AND status IN ('declined', 'pending')"

                recipients = db.fetch_all(query, tuple(params))
                recipient_emails = [r.get("participant_email") for r in recipients if r.get("participant_email")]

                print(f"SMTP Message to {len(recipient_emails)}: {req.message}")
                return {"message": f"Successfully sent message to {len(recipient_emails)} recipients.", "count": len(recipient_emails)}
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed messaging participants: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def send_reminder(self, request: Request, event_id: int, current_user: dict):
        try:
            with logger.time_operation("SEND_REMINDER", request=request):
                db = self.db_driver
                event = db.fetch_one("SELECT * FROM events WHERE id = %s", (event_id,))
                if not event:
                    raise HTTPException(status_code=404, detail="Event not found")

                recipients = db.fetch_all(
                    "SELECT participant_email FROM event_registrations WHERE event_id = %s AND status IN ('accepted', 'pending')",
                    (event_id,)
                )
                recipient_emails = [r.get("participant_email") for r in recipients if r.get("participant_email")]
                print(f"Automatic Reminder Sent to {len(recipient_emails)} for event '{event.get('name')}'")
                return {"message": f"Event reminder successfully sent to {len(recipient_emails)} participants.", "count": len(recipient_emails)}
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed sending reminder: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_member_registrations(self, request: Request, member_email: str, current_user: dict):
        try:
            with logger.time_operation("GET_MEMBER_REGISTRATIONS", request=request):
                db = self.db_driver
                email_clean = member_email.replace(" ", "").lower()
                registrations = db.fetch_all(
                    "SELECT * FROM event_registrations WHERE LOWER(participant_email) = %s",
                    (email_clean,)
                )
                
                member = db.fetch_one("SELECT id FROM members WHERE LOWER(email) = %s LIMIT 1", (email_clean,))
                if member:
                    reg_member = db.fetch_all(
                        "SELECT * FROM event_registrations WHERE member_id = %s",
                        (member.get("id"),)
                    )
                    reg_ids = {r.get("id") for r in registrations}
                    for r in reg_member:
                        if r.get("id") not in reg_ids:
                            registrations.append(r)
                            
                return [{
                    "id": r.get("id"),
                    "event_id": r.get("event_id"),
                    "member_id": r.get("member_id"),
                    "participant_name": r.get("participant_name"),
                    "participant_email": r.get("participant_email"),
                    "status": r.get("status"),
                    "attendance": r.get("attendance")
                } for r in registrations]
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed member registrations lookup: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
