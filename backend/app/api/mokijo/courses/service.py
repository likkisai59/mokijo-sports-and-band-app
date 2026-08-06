from fastapi import APIRouter, Depends, Request, HTTPException, status
from typing import List, Optional
from datetime import date, datetime
import hmac
import json
import uuid

from app.models import schemas
from sqlalchemy.orm import Session
from app.auth.authorization import check_user_authorization, validate_role_and_permission
from app.core.helpers import (
serialize_course,
serialize_course_registration,
validate_course_group,
get_course_registration_count
)
from app.core.config import get_settings
from app.services.razorpay import get_razorpay_credentials, call_razorpay_api, build_razorpay_signature
from app.logger import logger

COURSE_STATUSES = {"draft", "open", "full", "closed", "completed"}
COURSE_REGISTRATION_STATUSES = {"registered", "waitlisted", "cancelled", "completed"}
COURSE_PAYMENT_STATUSES = {"unpaid", "paid", "waived"}
settings = get_settings()

from app.api.mokijo.courses import crud

async def get_courses_summary(request: Request, db: Session, owner_id: int, current_user: dict):
    try:
        with logger.time_operation("GET_COURSES_SUMMARY", request=request):
            validate_role_and_permission(db, current_user, ["admin", "team_member"], owner_id)
            courses = crud.get_courses_by_owner(db, owner_id)
            registrations = crud.get_registrations_by_owner(db, owner_id)
            
            # Fetch course lookup
            course_map = {c.get("id"): c for c in courses}
            
            revenue = 0
            for r in registrations:
                if r.get("payment_status") == "paid":
                    course = course_map.get(r.get("course_id"))
                    if course:
                        revenue += (course.get("fee") or 0)

            serialized_courses = [serialize_course(c, db) for c in courses]
            open_courses_count = sum(1 for c in serialized_courses if c.get("status") == "open")
            active_registrations_count = sum(1 for r in registrations if r.get("status") in {"registered", "waitlisted"})
            waitlisted_count = sum(1 for r in registrations if r.get("status") == "waitlisted")

            return {
                "total_courses": len(courses),
                "open_courses": open_courses_count,
                "active_registrations": active_registrations_count,
                "waitlisted": waitlisted_count,
                "course_revenue": revenue,
            }
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed courses summary: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_trainer_trainings(request: Request, db: Session, owner_id: Optional[int], current_user: dict):
    try:
        with logger.time_operation("GET_TRAINER_TRAININGS", request=request):
            role = current_user.get("role")
            allowed_roles = ["admin", "club_admin", "user", "team_member", "trainer"]
            if role not in allowed_roles:
                raise HTTPException(status_code=403, detail="Access denied.")

            if owner_id is not None and role in ("admin", "club_admin"):
                validate_role_and_permission(db, current_user, ["admin", "club_admin"], owner_id)

            courses = crud.get_courses_with_trainers(db)
            return [serialize_course(c, db) for c in courses]
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to get trainer trainings: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

def _public_trainer_profile(db: Session, trainer_id):
    if not trainer_id:
        return None
    trainer = crud.get_trainer_by_id(db, trainer_id)
    if not trainer:
        return None
    sports = trainer.get("sports")
    sports_list = None
    if isinstance(sports, list):
        sports_list = sports
    elif isinstance(sports, str) and sports.strip():
        try:
            parsed = json.loads(sports)
            sports_list = parsed if isinstance(parsed, list) else [sports]
        except Exception:
            sports_list = [s.strip() for s in sports.split(",") if s.strip()]
    return {
        "id": trainer.get("id"),
        "first_name": trainer.get("first_name"),
        "last_name": trainer.get("last_name"),
        "specialization": trainer.get("specialization"),
        "experience": trainer.get("experience"),
        "sports": sports_list,
        "phone": trainer.get("phone"),
    }

async def get_trainer_training_detail(request: Request, db: Session, course_id: int, current_user: dict):
    try:
        with logger.time_operation("GET_TRAINER_TRAINING_DETAIL", request=request):
            role = current_user.get("role")
            allowed_roles = ["admin", "club_admin", "user", "team_member", "trainer"]
            if role not in allowed_roles:
                raise HTTPException(status_code=403, detail="Access denied.")

            course = crud.get_course_by_id(db, course_id)
            if not course:
                raise HTTPException(status_code=404, detail="Training not found")

            payload = serialize_course(course, db)
            payload["trainer"] = _public_trainer_profile(db, course.get("trainer_id"))
            return payload
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to get trainer training detail: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_user_training_registrations(request: Request, db: Session, user_id: int, current_user: dict):
    try:
        with logger.time_operation("GET_USER_TRAINING_REGISTRATIONS", request=request):
            current_id = current_user.get("id")
            if current_id is None:
                raise HTTPException(status_code=401, detail="User id missing from token.")

            target_user_id = int(user_id)
            if int(current_id) != target_user_id and current_user.get("role") not in ["admin", "club_admin", "mukijo_admin"]:
                target_user_id = int(current_id)

            user = crud.get_user_by_id(db, target_user_id)
            user_email = user.get("email") if user else None if user else None

            if not user_email:
                member = crud.get_member_by_id(db, target_user_id)
                if member:
                    user_email = member.get("email")
                else:
                    member_cur = crud.get_member_by_id(db, current_id)
                    if member_cur:
                        user_email = member_cur.get("email")

            email_clean = (user_email or "").replace(" ", "").lower() or None
            notes_pattern = f"%user_id:{target_user_id}%"

            rows = crud.get_course_registrations_filtered(db, notes_pattern, target_user_id, current_id, email_clean)

            results = []
            seen_ids = set()
            for reg in rows or []:
                reg_id = reg.get("id")
                if reg_id in seen_ids:
                    continue
                seen_ids.add(reg_id)

                course = crud.get_course_by_id(db, reg.get("course_id"))
                if not course:
                    continue
                course_data = serialize_course(course, db)
                registered_at = reg.get("registered_at")
                if isinstance(registered_at, (datetime, date)):
                    registered_at_str = registered_at.isoformat()
                else:
                    registered_at_str = str(registered_at) if registered_at else None

                results.append({
                    "id": reg.get("id"),
                    "course_id": reg.get("course_id"),
                    "status": reg.get("status"),
                    "payment_status": reg.get("payment_status") or "unpaid",
                    "registered_at": registered_at_str,
                    "title": course_data.get("title"),
                    "category": course_data.get("category"),
                    "location": course_data.get("location"),
                    "start_date": course_data.get("start_date"),
                    "end_date": course_data.get("end_date"),
                    "schedule": course_data.get("schedule"),
                    "start_time": course_data.get("start_time"),
                    "end_time": course_data.get("end_time"),
                    "days": course_data.get("days"),
                    "fee": course_data.get("fee") or 0,
                    "cover_image": course_data.get("cover_image"),
                    "trainer_name": course_data.get("trainer_name"),
                    "trainer_phone": course_data.get("trainer_phone"),
                    "level": course_data.get("level"),
                    "description": course_data.get("description"),
                })
            return results
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed getting user training registrations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def create_trainer_training_enroll_order(request: Request, db: Session, course_id: int, current_user: dict):
    try:
        with logger.time_operation("CREATE_TRAINER_TRAINING_ENROLL_ORDER", request=request):
            validate_role_and_permission(db, current_user, ["user", "member", "club_member", "admin", "club_admin", "team_member"])

            user_id = current_user.get("id") or current_user.get("userId")
            if not user_id:
                raise HTTPException(status_code=401, detail="User id missing from token.")

            course = crud.get_course_by_id(db, course_id)
            if not course:
                raise HTTPException(status_code=404, detail="Training not found")

            serialized = serialize_course(course, db)
            if serialized.get("status") not in {"open", "full"}:
                raise HTTPException(status_code=400, detail="Training is not open for registrations")

            user = crud.get_user_by_id(db, int(user_id)) if user_id else None
            member = None
            if not user and user_id:
                try:
                    member = crud.get_member_by_id(db, int(user_id))
                except Exception:
                    member = None

            email_clean = (
                (user.get("email") if user else (member.get("email") if member else None))
                or current_user.get("email")
                or ""
            ).replace(" ", "").lower()

            first_name = (user.get("first_name") if user else (member.get("first_name") if member else "")) or ""
            last_name = (user.get("last_name") if user else (member.get("last_name") if member else "")) or ""
            participant_name = f"{first_name} {last_name}".strip()
            if not participant_name:
                participant_name = (member.get("name") if member else None) or current_user.get("username") or email_clean or f"User {user_id}"
            user_phone = (user.get("phone") if user else (member.get("phone") if member else None)) or current_user.get("phone")

            existing = None
            if email_clean:
                existing = crud.get_existing_course_registration_by_email(db, course_id, email_clean)
            if existing and existing.get("payment_status") in {"paid", "waived"}:
                raise HTTPException(status_code=400, detail="You are already registered for this training")

            active_count = get_course_registration_count(course_id, db)
            capacity = course.get("capacity") or 0
            status_val = "registered"
            if capacity and active_count >= capacity:
                if not existing:
                    status_val = "waitlisted"

            if existing:
                reg_id = existing.get("id")
                registration = existing
            else:
                member_id_val = int(user_id) if member else None
                user_id_val = int(user_id) if user else None
                insert_data = {
                    "owner_id": None,
                    "user_id": user_id_val,
                    "course_id": course_id,
                    "member_id": member_id_val,
                    "participant_name": participant_name,
                    "participant_email": email_clean or None,
                    "participant_phone": user_phone,
                    "status": status_val,
                    "payment_status": "unpaid",
                    "notes": f"user_id:{user_id}",
                }
                reg_id = crud.create_registration(db, insert_data)
                registration = crud.get_registration_by_id(db, reg_id)

            fee = int(course.get("fee") or 0)
            if fee <= 0:
                payment_status = "waived"
                crud.update_course_registration_status_new(db, reg_id, payment_status, "registered" if status_val != "waitlisted" else status_val)
                registration = crud.get_registration_by_id(db, reg_id)
                return {
                    "free": True,
                    "registration_id": reg_id,
                    "registration": serialize_course_registration(registration, db),
                }

            if registration.get("payment_status") in {"paid", "waived"}:
                raise HTTPException(status_code=400, detail="This enrollment is already paid")

            key_id, _ = get_razorpay_credentials()
            amount_in_paise = fee * 100
            receipt = f"trn_enroll_{reg_id}_{uuid.uuid4().hex[:10]}"
            razorpay_order = call_razorpay_api("POST", "/orders", {
                "amount": amount_in_paise,
                "currency": settings.RAZORPAY_CURRENCY,
                "receipt": receipt,
                "notes": {
                    "registration_id": str(reg_id),
                    "course_id": str(course_id),
                    "user_id": str(user_id),
                    "type": "trainer_training_enroll",
                },
            })

            local_order_id = crud.insert(db, "training_enrollment_orders", {
                "registration_id": reg_id,
                "course_id": course_id,
                "user_id": int(user_id) if user else None,
                "razorpay_order_id": razorpay_order["id"],
                "amount": amount_in_paise,
                "currency": razorpay_order.get("currency", settings.RAZORPAY_CURRENCY),
                "status": razorpay_order.get("status", "created"),
            })

            prefill_name = participant_name
            prefill_email = email_clean
            prefill_contact = user_phone

            return {
                "free": False,
                "registration_id": reg_id,
                "registration": serialize_course_registration(registration, db),
                "key_id": key_id,
                "razorpay_order_id": razorpay_order["id"],
                "local_order_id": local_order_id,
                "amount": amount_in_paise,
                "currency": razorpay_order.get("currency", settings.RAZORPAY_CURRENCY),
                "name": "Mukijo Trainings",
                "description": f"Training fee: {course.get('title')}",
                "prefill_name": prefill_name,
                "prefill_email": prefill_email,
                "prefill_contact": prefill_contact,
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed trainer training enroll order: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def verify_trainer_training_enroll_payment(
    request: Request,
    db: Session,
    course_id: int,
    verification: schemas.TrainingEnrollVerifyRequest,
    current_user: dict,
):
    try:
        with logger.time_operation("VERIFY_TRAINER_TRAINING_ENROLL_PAYMENT", request=request):
            validate_role_and_permission(db, current_user, ["user", "member", "club_member", "admin", "club_admin", "team_member"])

            user_id = current_user.get("id") or current_user.get("userId")
            registration = crud.get_course_registration_by_id_and_course(db, verification.registration_id, course_id)
            if not registration:
                raise HTTPException(status_code=404, detail="Registration not found")

            notes = registration.get("notes") or ""
            if f"user_id:{user_id}" not in notes:
                user = crud.get_user_by_id(db, user_id) if user_id else None
                member = None
                if not user and user_id:
                    try:
                        member = crud.get_member_by_id(db, user_id)
                    except Exception:
                        member = None

                email_clean = (
                    (user.get("email") if user else (member.get("email") if member else None))
                    or current_user.get("email")
                    or ""
                ).replace(" ", "").lower()
                reg_email = (registration.get("participant_email") or "").replace(" ", "").lower()
                reg_member_id = registration.get("member_id")
                reg_user_id = registration.get("user_id")

                is_match = (
                    (reg_user_id and user_id and int(reg_user_id) == int(user_id)) or
                    (reg_member_id and user_id and int(reg_member_id) == int(user_id)) or
                    (email_clean and reg_email and email_clean == reg_email)
                )

                if not is_match and current_user.get("role") not in ["admin", "club_admin", "mukijo_admin"]:
                    raise HTTPException(status_code=403, detail="Access denied for this registration")

            gateway_order = crud.get_training_enrollment_order(db, verification.registration_id, verification.razorpay_order_id, user_id)
            if not gateway_order:
                raise HTTPException(status_code=404, detail="Razorpay order not found for this enrollment")

            expected_signature = build_razorpay_signature(
                gateway_order.get("razorpay_order_id"),
                verification.razorpay_payment_id,
            )
            if not hmac.compare_digest(expected_signature, verification.razorpay_signature):
                crud.update_training_enrollment_order_failed(db, gateway_order.get("id"), verification.razorpay_payment_id, verification.razorpay_signature)
                raise HTTPException(status_code=400, detail="Payment verification failed")

            crud.update_training_enrollment_order_success(db, gateway_order.get("id"), verification.razorpay_payment_id, verification.razorpay_signature, datetime.utcnow())
            crud.update_course_registration_paid(db, verification.registration_id)
            updated = crud.get_registration_by_id(db, verification.registration_id)
            return serialize_course_registration(updated, db)
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed trainer training enroll verify: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_courses(
    request: Request,
    db: Session,
    owner_id: int,
    status: str,
    group_id: Optional[int],
    member_email: Optional[str],
    current_user: dict
):
    try:
        with logger.time_operation("GET_COURSES", request=request):
            validate_role_and_permission(db, current_user, ["admin", "team_member"], owner_id)
            
            if member_email:
                email_clean = member_email.replace(" ", "").lower()
                registrations = crud.get_registered_course_ids_by_email(db, email_clean)
                course_ids = [r.get("course_id") for r in registrations]
                
                member = crud.get_member_by_email(db, email_clean)
                if member:
                    reg_member = crud.get_registered_course_ids_by_member(db, member.get("id"))
                    course_ids.extend([r.get("course_id") for r in reg_member])
                    
                course_ids = list(set(course_ids))
                if not course_ids:
                    return []
                    
                placeholders = ", ".join(["%s"] * len(course_ids))
                courses = crud.get_courses_by_ids(db, course_ids)
            else:
                courses = crud.get_filtered_courses_by_owner(db, owner_id, group_id, status)
                
            serialized = [serialize_course(course, db) for course in courses]
            if status == "full":
                serialized = [c for c in serialized if c.get("status") == "full"]
            return serialized
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to get courses: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def create_course(request: Request, db: Session, course: schemas.CourseCreate, current_user: dict):
    try:
        with logger.time_operation("CREATE_COURSE", request=request):
            if course.owner_id is None:
                raise HTTPException(status_code=400, detail="owner_id is required for club courses")
            validate_role_and_permission(db, current_user, ["admin"], course.owner_id)
            if not course.title.strip():
                raise HTTPException(status_code=400, detail="Course title is required")
            if course.capacity is not None and course.capacity <= 0:
                raise HTTPException(status_code=400, detail="Capacity must be greater than zero")
            if course.fee is not None and course.fee < 0:
                raise HTTPException(status_code=400, detail="Fee cannot be negative")

            status_val = course.status or "open"
            if status_val not in COURSE_STATUSES:
                raise HTTPException(status_code=400, detail="Invalid course status")

            group_id = validate_course_group(course.owner_id, course.group_id, db)

            insert_data = {
                "owner_id": course.owner_id,
                "group_id": group_id,
                "title": course.title.strip(),
                "code": course.code,
                "category": course.category or "Training",
                "level": course.level,
                "description": course.description,
                "instructor": course.instructor,
                "start_date": course.start_date,
                "end_date": course.end_date,
                "schedule": course.schedule,
                "location": course.location,
                "capacity": course.capacity or 20,
                "fee": course.fee or 0,
                "status": status_val
            }
            
            course_id = crud.create_course(db, insert_data)
            new_course = crud.get_course_by_id(db, course_id)
            return serialize_course(new_course, db)
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to create course: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_course(request: Request, db: Session, course_id: int, owner_id: int, current_user: dict):
    try:
        with logger.time_operation("GET_COURSE", request=request):
            validate_role_and_permission(db, current_user, ["admin", "team_member"], owner_id)
            course = crud.get_course_by_id_and_owner(db, course_id, owner_id)
            if not course:
                raise HTTPException(status_code=404, detail="Course not found")
            return serialize_course(course, db)
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to get course: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def update_course(
    request: Request,
    db: Session,
    course_id: int,
    owner_id: int,
    course_update: schemas.CourseUpdate,
    current_user: dict
):
    try:
        with logger.time_operation("UPDATE_COURSE", request=request):
            validate_role_and_permission(db, current_user, ["admin"], owner_id)
            course = crud.get_course_by_id_and_owner(db, course_id, owner_id)
            if not course:
                raise HTTPException(status_code=404, detail="Course not found")

            update_data = course_update.dict(exclude_unset=True)
            if "title" in update_data and (not update_data["title"] or not update_data["title"].strip()):
                raise HTTPException(status_code=400, detail="Course title is required")
            if "capacity" in update_data and update_data["capacity"] is not None and update_data["capacity"] <= 0:
                raise HTTPException(status_code=400, detail="Capacity must be greater than zero")
            if "fee" in update_data and update_data["fee"] is not None and update_data["fee"] < 0:
                raise HTTPException(status_code=400, detail="Fee cannot be negative")
            if "status" in update_data and update_data["status"] not in COURSE_STATUSES:
                raise HTTPException(status_code=400, detail="Invalid course status")
            if "group_id" in update_data:
                update_data["group_id"] = validate_course_group(owner_id, update_data["group_id"], db)

            if update_data:
                set_clauses = []
                params = []
                for key, val in update_data.items():
                    if key == "title" and isinstance(val, str):
                        val = val.strip()
                    set_clauses.append(f"{key} = %s")
                    params.append(val)
                
                params.append(course_id)
                crud.update_course(db, course_id, update_data)

            updated = crud.get_course_by_id(db, course_id)
            return serialize_course(updated, db)
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to update course: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def delete_course(request: Request, db: Session, course_id: int, owner_id: int, current_user: dict):
    try:
        with logger.time_operation("DELETE_COURSE", request=request):
            validate_role_and_permission(db, current_user, ["admin"], owner_id)
            course = crud.get_course_by_id_and_owner(db, course_id, owner_id)
            if not course:
                raise HTTPException(status_code=404, detail="Course not found")

            crud.delete_course(db, course_id)
            return {"message": "Course deleted successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to delete course: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_course_registrations(request: Request, db: Session, course_id: int, owner_id: int, current_user: dict):
    try:
        with logger.time_operation("GET_COURSE_REGISTRATIONS", request=request):
            validate_role_and_permission(db, current_user, ["admin", "team_member"], owner_id)
            course = crud.get_course_by_id_and_owner(db, course_id, owner_id)
            if not course:
                raise HTTPException(status_code=404, detail="Course not found")

            registrations = crud.get_course_registrations_by_course_and_owner(db, course_id, owner_id)
            return [serialize_course_registration(r, db) for r in registrations]
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed course registrations: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def create_course_registration(
    request: Request,
    db: Session,
    course_id: int,
    registration: schemas.CourseRegistrationCreate,
    current_user: dict
):
    try:
        with logger.time_operation("CREATE_COURSE_REGISTRATION", request=request):
            validate_role_and_permission(db, current_user, ["admin", "team_member", "user"])
            if registration.owner_id is None:
                raise HTTPException(status_code=400, detail="owner_id is required for club course registrations")
            course = crud.get_course_by_id_and_owner(db, course_id, registration.owner_id)
            if not course:
                raise HTTPException(status_code=404, detail="Course not found")

            if course.get("status") not in {"open", "full"}:
                raise HTTPException(status_code=400, detail="Course is not open for registrations")

            status_val = registration.status or "registered"
            if status_val not in COURSE_REGISTRATION_STATUSES:
                raise HTTPException(status_code=400, detail="Invalid registration status")

            payment_status = "unpaid"
            participant_name = (registration.participant_name or "").strip()
            participant_email = registration.participant_email
            participant_phone = registration.participant_phone
            member_id = registration.member_id

            if member_id:
                member = crud.get_member_by_id_and_group_owner(db, member_id, registration.owner_id)
                if not member:
                    raise HTTPException(status_code=404, detail="Member not found or access denied")
                
                if course.get("group_id") and member.get("group_id") != course.get("group_id"):
                    raise HTTPException(status_code=400, detail="Member does not belong to this course group")
                
                existing = crud.get_existing_course_registration_by_member(db, course_id, member_id)
                if existing:
                    raise HTTPException(status_code=400, detail="Member is already registered for this course")
                
                participant_name = f"{member.get('first_name')} {member.get('last_name')}".strip()
                participant_email = member.get("email")
                participant_phone = member.get("phone")

            if not participant_name:
                raise HTTPException(status_code=400, detail="Participant name is required")

            active_count = get_course_registration_count(course_id, db)
            if active_count >= (course.get("capacity") or 0) and status_val == "registered":
                status_val = "waitlisted"

            insert_data = {
                "owner_id": registration.owner_id,
                "course_id": course_id,
                "member_id": member_id,
                "participant_name": participant_name,
                "participant_email": participant_email,
                "participant_phone": participant_phone,
                "status": status_val,
                "payment_status": payment_status,
                "notes": registration.notes
            }
            
            reg_id = crud.create_registration(db, insert_data)
            new_reg = crud.get_registration_by_id(db, reg_id)
            return serialize_course_registration(new_reg, db)
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to create course registration: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def update_course_registration(
    request: Request,
    db: Session,
    registration_id: int,
    owner_id: int,
    registration_update: schemas.CourseRegistrationUpdate,
    current_user: dict
):
    try:
        with logger.time_operation("UPDATE_COURSE_REGISTRATION", request=request):
            validate_role_and_permission(db, current_user, ["admin"], owner_id)
            registration = crud.get_registration_by_id(db, registration_id)
            if not registration:
                raise HTTPException(status_code=404, detail="Registration not found")

            update_data = registration_update.dict(exclude_unset=True)
            if "status" in update_data and update_data["status"] not in COURSE_REGISTRATION_STATUSES:
                raise HTTPException(status_code=400, detail="Invalid registration status")
            if "payment_status" in update_data:
                raise HTTPException(status_code=400, detail="Course payment status is updated automatically after online payment")

            if update_data:
                set_clauses = []
                params = []
                for key, val in update_data.items():
                    set_clauses.append(f"{key} = %s")
                    params.append(val)
                params.append(registration_id)
                crud.update_registration_status(db, registration_id, update_data.get("status"), update_data.get("payment_status"))

            updated = crud.get_registration_by_id(db, registration_id)
            return serialize_course_registration(updated, db)
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to update course registration: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def delete_course_registration(request: Request, db: Session, registration_id: int, owner_id: int, current_user: dict):
    try:
        with logger.time_operation("DELETE_COURSE_REGISTRATION", request=request):
            validate_role_and_permission(db, current_user, ["admin"], owner_id)
            registration = crud.get_registration_by_id(db, registration_id)
            if not registration:
                raise HTTPException(status_code=404, detail="Registration not found")

            crud.delete_registration(db, registration_id)
            return {"message": "Registration removed successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed delete registration: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def create_training_enroll_order(request: Request, db: Session, course_id: int, current_user: dict):
    try:
        with logger.time_operation("CREATE_TRAINING_ENROLL_ORDER", request=request):
            user_id = current_user.get("id") or current_user.get("userId")
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid token - user id missing")

            course = crud.get_course_by_id(db, course_id)
            if not course:
                raise HTTPException(status_code=404, detail="Training course not found")

            fee = course.get("fee") or 0
            user = crud.get_user_by_id(db, int(user_id)) if hasattr(crud, "get_user_by_id") else None

            # Register user in course_registrations
            existing_reg = crud.get_existing_course_registration_by_user(db, course_id, int(user_id)) if hasattr(crud, "get_existing_course_registration_by_user") else None
            
            if not existing_reg:
                participant_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() if user else "User"
                participant_email = user.get("email") if user else None
                participant_phone = user.get("phone") if user else None

                reg_data = {
                    "course_id": course_id,
                    "user_id": int(user_id),
                    "participant_name": participant_name or "User",
                    "participant_email": participant_email,
                    "participant_phone": participant_phone,
                    "status": "registered",
                    "payment_status": "free" if fee <= 0 else "unpaid"
                }
                reg_id = crud.create_registration(db, reg_data)
            else:
                reg_id = existing_reg.get("id")

            if fee <= 0:
                crud.update_registration_status(db, reg_id, "registered", "paid")
                return {
                    "free": True,
                    "registration_id": reg_id,
                    "message": "Free training enrolled successfully"
                }

            # Create Razorpay Order
            key_id, key_secret = get_razorpay_credentials()
            amount_in_paise = int(fee * 100)
            receipt_id = f"trn_{course_id}_{reg_id}_{uuid.uuid4().hex[:6]}"

            razorpay_res = call_razorpay_api(
                "POST",
                "/orders",
                {
                    "amount": amount_in_paise,
                    "currency": "INR",
                    "receipt": receipt_id,
                    "notes": {
                        "course_id": str(course_id),
                        "registration_id": str(reg_id),
                        "user_id": str(user_id),
                    }
                },
                key_id,
                key_secret
            )

            return {
                "free": False,
                "key_id": key_id,
                "amount": amount_in_paise,
                "currency": "INR",
                "razorpay_order_id": razorpay_res.get("id"),
                "registration_id": reg_id,
                "name": "Mokijo Sports",
                "description": f"Enrollment for {course.get('title')}",
                "prefill_name": f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() if user else "",
                "prefill_email": user.get("email") if user else "",
                "prefill_contact": user.get("phone") if user else ""
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to create training enrollment order: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def verify_training_enrollment(request: Request, db: Session, course_id: int, payload: schemas.TrainingEnrollVerifyRequest, current_user: dict):
    try:
        with logger.time_operation("VERIFY_TRAINING_ENROLLMENT", request=request):
            key_id, key_secret = get_razorpay_credentials()
            is_valid = build_razorpay_signature(
                payload.razorpay_order_id,
                payload.razorpay_payment_id,
                payload.razorpay_signature,
                key_secret
            )
            if not is_valid:
                raise HTTPException(status_code=400, detail="Invalid Razorpay payment signature")

            crud.update_registration_status(db, payload.registration_id, "registered", "paid")
            reg = crud.get_registration_by_id(db, payload.registration_id)
            return serialize_course_registration(reg, db)
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to verify training enrollment: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
