from fastapi import APIRouter, Depends, Request, HTTPException, status, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.models import schemas
from sqlalchemy.orm import Session
from app.auth.authorization import check_user_authorization, validate_role_and_permission
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


from app.api.mokijo.events import crud

async def create_event(request: Request, db: Session, group_id: int, owner_id: int, event: schemas.EventCreate, current_user: dict):
    try:
        with logger.time_operation("CREATE_EVENT", request=request):
            validate_role_and_permission(db, current_user, ["admin"], owner_id)
            db_group = crud.get_group_by_id_and_owner(db, group_id, owner_id)
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
                "time": event.time or event.start_time or "09:00",
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
            
            event_id = crud.create_event(db, insert_data)
            new_event = crud.get_event(db, event_id)
            return serialize_event(new_event, db)
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to create event: {e}")
        raise HTTPException(status_code=500, detail=str(e) if str(e) else "Failed to create event")

async def get_group_events(request: Request, db: Session, group_id: str, owner_id: int, current_user: dict):
    try:
        with logger.time_operation("GET_GROUP_EVENTS", request=request):
            validate_role_and_permission(db, current_user, ["admin", "team_member"], owner_id)
            group = None
            if group_id.isdigit():
                group = crud.get_group_by_id_and_owner(db, int(group_id), owner_id)
            if not group:
                group = crud.get_group_by_name_and_owner(db, group_id, owner_id)
            if not group:
                raise HTTPException(status_code=404, detail="Group not found or access denied")

            events = crud.get_events_by_group(db, group.get("id"))
            return [serialize_event(e, db) for e in events]
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to get group events: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_all_events(request: Request, db: Session, owner_id: int, member_email: Optional[str], current_user: dict):
    try:
        with logger.time_operation("GET_ALL_EVENTS", request=request):
            validate_role_and_permission(db, current_user, ["admin", "team_member"], owner_id)
            role = (current_user.get("role") or "").lower()

            if role == "team_member":
                member = None
                if member_email:
                    email_clean = member_email.replace(" ", "").lower()
                    member = crud.get_member_by_email(db, email_clean)
                else:
                    member = crud.get_member_by_id(db, current_user.get("id"))

                if not member:
                    return []

                events = crud.get_events_by_owner(db, owner_id)
                visible_events = []
                for event in events:
                    registration = crud.get_registration_by_event_and_member_id(db, event.get("id"), member.get("id"))
                    if registration:
                        event_payload = dict(event)
                        event_payload["visible_to_member"] = True
                        visible_events.append(event_payload)

                return [serialize_event(e, db) for e in visible_events]

            if member_email:
                email_clean = member_email.replace(" ", "").lower()
                registrations = crud.get_registration_by_email_and_status(db, email_clean, "accepted")
                event_ids = [r.get("event_id") for r in registrations]
                
                member = crud.get_member_by_email(db, email_clean)
                if member:
                    reg_member = crud.get_registrations_by_member_and_status(db, member.get("id"), "accepted")
                    event_ids.extend([r.get("event_id") for r in reg_member])
                    
                event_ids = list(set(event_ids))
                if event_ids:
                    placeholders = ", ".join(["%s"] * len(event_ids))
                    events = crud.get_events_by_ids(db, event_ids)
                else:
                    events = []
            else:
                events = crud.get_events_by_owner(db, owner_id)
                if not events:
                    groups = crud.get_groups_by_owner(db, owner_id)
                    group_ids = [g.get("id") for g in groups]
                    if group_ids:
                        placeholders = ", ".join(["%s"] * len(group_ids))
                        events = crud.get_events_by_group_ids(db, group_ids)
                    else:
                        events = []
                        
            return [serialize_event(e, db) for e in events]
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to get all events: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_event(request: Request, db: Session, event_id: int, owner_id: int, current_user: dict):
    try:
        with logger.time_operation("GET_EVENT", request=request):
            event = crud.get_event(db, event_id)
            if not event:
                raise HTTPException(status_code=404, detail="Event not found")

            return serialize_event(event, db)
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to get event: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
        await logger.log_error(request=request, message=f"Failed to get event: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def update_event(request: Request, db: Session, event_id: int, owner_id: int, event_update: schemas.EventUpdate, current_user: dict):
    try:
        with logger.time_operation("UPDATE_EVENT", request=request):
            validate_role_and_permission(db, current_user, ["admin"], owner_id)
            db_event = crud.get_event(db, event_id)
            if not db_event:
                raise HTTPException(status_code=404, detail="Event not found")

            if db_event.get("owner_id") != owner_id:
                group = crud.get_group_by_id_and_owner(db, db_event.get("group_id"), owner_id)
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
                crud.update_event(db, event_id, update_data)

            updated = crud.get_event(db, event_id)
            return serialize_event(updated, db)
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to update event: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def delete_event(request: Request, db: Session, event_id: int, owner_id: int, current_user: dict):
    try:
        with logger.time_operation("DELETE_EVENT", request=request):
            validate_role_and_permission(db, current_user, ["admin"], owner_id)
            db_event = crud.get_event(db, event_id)
            if not db_event:
                raise HTTPException(status_code=404, detail="Event not found")

            if db_event.get("owner_id") != owner_id:
                group = crud.get_group_by_id_and_owner(db, db_event.get("group_id"), owner_id)
                if not group:
                    raise HTTPException(status_code=403, detail="Access denied")

            crud.delete_event(db, event_id)
            return {"message": "Event deleted successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to delete event: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def invite_to_event(request: Request, db: Session, event_id: int, req: EventInviteRequest, current_user: dict):
    try:
        with logger.time_operation("INVITE_TO_EVENT", request=request):
            event = crud.get_event(db, event_id)
            if not event:
                raise HTTPException(status_code=404, detail="Event not found")
            validate_role_and_permission(db, current_user, ["admin"], event.get("owner_id"))

            members = []
            if req.invite_type == "all_members":
                groups = crud.get_groups_by_owner(db, event.get("owner_id"))
                g_ids = [g.get("id") for g in groups]
                if g_ids:
                    placeholders = ", ".join(["%s"] * len(g_ids))
                    members = crud.get_members_by_group_ids(db, g_ids)
            elif req.invite_type == "parents":
                groups = crud.get_groups_by_owner(db, event.get("owner_id"))
                g_ids = [g.get("id") for g in groups]
                if g_ids:
                    placeholders = ", ".join(["%s"] * len(g_ids))
                    members = crud.get_members_by_group_ids_and_role_parent(db, g_ids)
            elif req.invite_type == "coaches":
                groups = crud.get_groups_by_owner(db, event.get("owner_id"))
                g_ids = [g.get("id") for g in groups]
                if g_ids:
                    placeholders = ", ".join(["%s"] * len(g_ids))
                    members = crud.get_members_by_group_ids_and_role_coach(db, g_ids)
            elif req.invite_type in ["groups", "teams"]:
                if req.group_ids:
                    placeholders = ", ".join(["%s"] * len(req.group_ids))
                    members = crud.get_members_by_group_ids(db, req.group_ids)
            elif req.invite_type == "specific_members":
                if req.member_ids:
                    placeholders = ", ".join(["%s"] * len(req.member_ids))
                    members = crud.get_members_by_ids(db, req.member_ids)

            invited_count = 0
            for m in members:
                exists = crud.get_registration_by_event_and_member_id(db, event_id, m.get("id"))
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
                    crud.create_registration(db, insert_data)
                    invited_count += 1

            return {"message": f"Successfully invited {invited_count} participants.", "count": invited_count}
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed inviting participants: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def respond_to_event(request: Request, db: Session, event_id: int, req: EventResponseRequest, current_user: dict):
    try:
        with logger.time_operation("RESPOND_TO_EVENT", request=request):
            event = crud.get_event(db, event_id)
            if not event:
                raise HTTPException(status_code=404, detail="Event not found")
            validate_role_and_permission(db, current_user, ["admin", "team_member"])
            
            # Check email matches token for team member
            if current_user.get("role") == "team_member":
                token_member = crud.get_member_by_id(db, current_user.get("id"))
                if not token_member or token_member.get("email", "").replace(" ", "").lower() != req.member_email.replace(" ", "").lower():
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Access denied: You cannot RSVP for another member's email."
                    )

            if req.status not in ["accepted", "declined", "maybe"]:
                raise HTTPException(status_code=400, detail="Invalid response status")

            member_email_clean = req.member_email.replace(" ", "").lower() if req.member_email else ""
            member = crud.get_member_by_email(db, member_email_clean)

            registration = None
            if member:
                registration = crud.get_registration_by_event_and_member_id(db, event_id, member.get("id"))

            if not registration:
                registration = crud.get_registration_by_event_and_member(db, event_id, member_email_clean)

            new_status = req.status
            if req.status == "accepted" and event.get("max_participants"):
                count_res = {"count": crud.get_accepted_registrations_count(db, event_id)}
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
                    crud.create_registration(db, insert_data)
                else:
                    raise HTTPException(status_code=403, detail="Guest registration is disabled for this event.")
            else:
                crud.update_registration_status_with_time(db, registration.get("id"), new_status, datetime.utcnow())

            return {"message": f"Successfully updated your response to {new_status}.", "status": new_status}
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed responding to event: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def register_guest_to_event(request: Request, db: Session, event_id: int, req: GuestRegisterRequest, current_user: dict):
    try:
        with logger.time_operation("REGISTER_GUEST", request=request):
            validate_role_and_permission(db, current_user, ["admin", "team_member", "user"])
            event = crud.get_event(db, event_id)
            if not event:
                raise HTTPException(status_code=404, detail="Event not found")

            if not event.get("allow_guest"):
                raise HTTPException(status_code=403, detail="Guest registration is disabled for this event.")

            exists = crud.get_registration_by_event_and_member(db, event_id, req.email)
            if exists:
                raise HTTPException(status_code=400, detail="This email is already registered.")

            status_val = "accepted"
            if event.get("max_participants"):
                count_res = {"count": crud.get_accepted_registrations_count(db, event_id)}
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
            crud.create_registration(db, insert_data)
            return {"message": "Registered successfully!", "status": status_val}
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed guest registration: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def mark_attendance(request: Request, db: Session, event_id: int, req: AttendanceMarkRequest, current_user: dict):
    try:
        with logger.time_operation("MARK_ATTENDANCE", request=request):
            event = crud.get_event(db, event_id)
            if not event:
                raise HTTPException(status_code=404, detail="Event not found")
            validate_role_and_permission(db, current_user, ["admin"], event.get("owner_id"))
            
            reg = crud.get_registration_by_id(db, req.registration_id, event_id)
            if not reg:
                raise HTTPException(status_code=404, detail="Registration not found")

            if req.attendance not in ["present", "absent", "late", "not_marked"]:
                raise HTTPException(status_code=400, detail="Invalid attendance value")

            crud.update_registration_attendance(db, req.registration_id, req.attendance)
            return {"message": "Attendance marked successfully", "attendance": req.attendance}
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed marking attendance: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_event_participants(request: Request, db: Session, event_id: int, current_user: dict):
    try:
        with logger.time_operation("GET_EVENT_PARTICIPANTS", request=request):
            event = crud.get_event(db, event_id)
            if not event:
                raise HTTPException(status_code=404, detail="Event not found")
            validate_role_and_permission(db, current_user, ["admin", "team_member"], event.get("owner_id"))
            
            registrations = crud.get_registrations_by_event(db, event_id)
            
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
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed getting participants: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def message_participants(request: Request, db: Session, event_id: int, req: MessageParticipantsRequest, current_user: dict):
    try:
        with logger.time_operation("MESSAGE_PARTICIPANTS", request=request):
            event = crud.get_event(db, event_id)
            if not event:
                raise HTTPException(status_code=404, detail="Event not found")
            validate_role_and_permission(db, current_user, ["admin"], event.get("owner_id"))
            
            query = "SELECT participant_email FROM event_registrations WHERE event_id = %s"
            params = [event_id]
            if req.recipient_group == "confirmed":
                query += " AND status = 'accepted'"
            elif req.recipient_group == "non_attendees":
                query += " AND status IN ('declined', 'pending')"

            recipients = crud.get_event_participants(db, event_id, status_filter)
            recipient_emails = [r.get("participant_email") for r in recipients if r.get("participant_email")]

            print(f"SMTP Message to {len(recipient_emails)}: {req.message}")
            return {"message": f"Successfully sent message to {len(recipient_emails)} recipients.", "count": len(recipient_emails)}
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed messaging participants: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def send_reminder(request: Request, db: Session, event_id: int, current_user: dict):
    try:
        with logger.time_operation("SEND_REMINDER", request=request):
            event = crud.get_event(db, event_id)
            if not event:
                raise HTTPException(status_code=404, detail="Event not found")
            validate_role_and_permission(db, current_user, ["admin"], event.get("owner_id"))
            
            recipients = [{"participant_email": email} for email in crud.get_accepted_and_pending_emails(db, event_id)]
            recipient_emails = [r.get("participant_email") for r in recipients if r.get("participant_email")]
            print(f"Automatic Reminder Sent to {len(recipient_emails)} for event '{event.get('name')}'")
            return {"message": f"Event reminder successfully sent to {len(recipient_emails)} participants.", "count": len(recipient_emails)}
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed sending reminder: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_member_registrations(request: Request, db: Session, member_email: Optional[str], current_user: dict):
    try:
        with logger.time_operation("GET_MEMBER_REGISTRATIONS", request=request):
            target_email = member_email
            if not target_email or not target_email.strip():
                user_id = current_user.get("id")
                user = crud.get_user_by_id(db, user_id)
                if user and user.get("email"):
                    target_email = user.get("email")
                else:
                    member = crud.get_member_by_id(db, user_id)
                    if member and member.get("email"):
                        target_email = member.get("email")
                    else:
                        target_email = current_user.get("email", "")

            email_clean = (target_email or "").replace(" ", "").lower()
            if not email_clean:
                return []

            registrations = crud.get_registrations_by_email(db, email_clean)
            
            member = crud.get_member_by_email(db, email_clean)
            if member:
                reg_member = crud.get_registrations_by_member(db, member.get("id"))
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
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed member registrations lookup: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
