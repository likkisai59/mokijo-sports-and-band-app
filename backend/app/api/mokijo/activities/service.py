from fastapi import Request, HTTPException
from typing import Optional
from datetime import date, datetime
from sqlalchemy.orm import Session

from app.models import schemas
from app.logger import logger
from app.api.mokijo.activities import crud

def serialize_activity(activity):
    if not activity:
        return None
    a_date = activity.date
    created = activity.created_at
    return {
        "id": activity.id,
        "owner_id": activity.owner_id,
        "venue_id": activity.venue_id,
        "slot_id": activity.slot_id,
        "sport": activity.sport,
        "date": a_date.isoformat() if isinstance(a_date, (date, datetime)) else a_date,
        "time": activity.time,
        "location": activity.location,
        "max_players": activity.max_players,
        "min_players": activity.min_players,
        "skill_level": activity.skill_level,
        "privacy_type": activity.privacy_type,
        "description": activity.description,
        "status": activity.status,
        "created_at": created.isoformat() if isinstance(created, datetime) else created
    }

def serialize_rsvp(rsvp):
    if not rsvp:
        return None
    joined = rsvp.joined_at
    return {
        "id": rsvp.id,
        "activity_id": rsvp.activity_id,
        "user_id": rsvp.user_id,
        "status": rsvp.status,
        "joined_at": joined.isoformat() if isinstance(joined, datetime) else joined
    }

async def create_activity(request: Request, db: Session, activity: schemas.ActivityCreate, x_is_member: Optional[str], current_user: dict):
    try:
        with logger.time_operation("CREATE_ACTIVITY", request=request):
            if x_is_member == "true":
                raise HTTPException(status_code=403, detail="Members are not allowed to create games.")
            
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
            act_id = crud.create_activity(db, insert_data)

            # Auto join creator
            rsvp_data = {
                "activity_id": act_id,
                "user_id": activity.owner_id,
                "status": "confirmed",
                "joined_at": datetime.utcnow()
            }
            crud.create_rsvp(db, rsvp_data)

            new_act = crud.get_activity(db, act_id)
            return serialize_activity(new_act)
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to create activity: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_activities(request: Request, db: Session, sport: Optional[str], location: Optional[str], current_user: dict):
    try:
        with logger.time_operation("GET_ACTIVITIES", request=request):
            activities = crud.get_activities(db, sport, location)
            return [serialize_activity(a) for a in activities]
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to get activities: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def rsvp_activity(request: Request, db: Session, activity_id: int, rsvp_data: schemas.ActivityRSVPCreate, current_user: dict):
    try:
        with logger.time_operation("RSVP_ACTIVITY", request=request):
            # Lock row
            activity = crud.get_activity_for_update(db, activity_id)
            if not activity:
                raise HTTPException(status_code=404, detail="Activity not found.")

            existing = crud.get_rsvp_by_user(db, activity_id, rsvp_data.user_id)
            if existing:
                raise HTTPException(status_code=400, detail="User already registered for this activity.")

            confirmed_count = crud.get_confirmed_rsvp_count(db, activity_id)

            status_val = "confirmed"
            if confirmed_count >= (activity.max_players or 0):
                status_val = "waitlisted"

            insert_rsvp = {
                "activity_id": activity_id,
                "user_id": rsvp_data.user_id,
                "status": status_val,
                "joined_at": datetime.utcnow()
            }
            rsvp_id = crud.create_rsvp(db, insert_rsvp)
            new_rsvp = crud.get_rsvp(db, rsvp_id)
            return serialize_rsvp(new_rsvp)
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to RSVP: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def cancel_rsvp(request: Request, db: Session, activity_id: int, user_id: int, current_user: dict):
    try:
        with logger.time_operation("CANCEL_RSVP", request=request):
            activity = crud.get_activity_for_update(db, activity_id)
            if not activity:
                raise HTTPException(status_code=404, detail="Activity not found.")

            rsvp = crud.get_rsvp_by_user(db, activity_id, user_id)
            if not rsvp:
                raise HTTPException(status_code=404, detail="RSVP registration not found.")

            old_status = rsvp.status
            crud.delete_rsvp(db, rsvp.id)

            if old_status == "confirmed":
                next_waitlisted = crud.get_next_waitlisted_rsvp(db, activity_id)
                if next_waitlisted:
                    crud.update_rsvp_status(db, next_waitlisted.id, "confirmed")

            return {"detail": "RSVP cancelled successfully."}
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed cancel RSVP: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def update_activity(
    request: Request,
    db: Session,
    activity_id: int,
    activity_update: schemas.ActivityUpdate,
    x_is_member: Optional[str],
    current_user: dict
):
    try:
        with logger.time_operation("UPDATE_ACTIVITY", request=request):
            if x_is_member == "true":
                raise HTTPException(status_code=403, detail="Members are not allowed to reschedule games.")
            
            activity = crud.get_activity(db, activity_id)
            if not activity:
                raise HTTPException(status_code=404, detail="Activity not found.")

            update_data = activity_update.dict(exclude_unset=True)
            if update_data:
                crud.update_activity(db, activity_id, update_data)

            updated = crud.get_activity(db, activity_id)
            return serialize_activity(updated)
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed update activity: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def cancel_activity(request: Request, db: Session, activity_id: int, x_is_member: Optional[str], current_user: dict):
    try:
        with logger.time_operation("CANCEL_ACTIVITY", request=request):
            if x_is_member == "true":
                raise HTTPException(status_code=403, detail="Members are not allowed to cancel games.")
            
            activity = crud.get_activity(db, activity_id)
            if not activity:
                raise HTTPException(status_code=404, detail="Activity not found.")

            crud.cancel_activity(db, activity_id)

            if activity.slot_id:
                booking = crud.get_reserved_booking_for_slot(db, activity.slot_id)
                if booking:
                    crud.cancel_booking(db, booking.id)
                    # Free all slots for this booking
                    slots = crud.get_slots_for_booking(db, booking.id)
                    for slot in slots:
                        crud.release_slot(db, slot.get("slot_id"))

            return {"message": "Activity cancelled successfully.", "status": "cancelled"}
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed cancel activity: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
