from fastapi import APIRouter, Depends, Request, HTTPException, status
from typing import List, Optional
from datetime import date, datetime

from app.models import schemas
from app.connectors.connection_service import ConnectionService
from app.auth.authorization import check_user_authorization
from app.core.helpers import (
    serialize_course,
    serialize_course_registration,
    validate_course_group,
    get_course_registration_count
)
from app.logger import logger

COURSE_STATUSES = {"draft", "open", "full", "closed", "completed"}
COURSE_REGISTRATION_STATUSES = {"registered", "waitlisted", "cancelled", "completed"}
COURSE_PAYMENT_STATUSES = {"unpaid", "paid", "waived"}


class CoursesRouting(ConnectionService):
    def __init__(self) -> None:
        super().__init__()
        
        self.router.add_api_route(
            path="/courses/summary",
            endpoint=self.get_courses_summary,
            methods=["GET"],
            summary="Retrieve a summary of course registration counts and active course revenue.",
            tags=["Courses"]
        )
        self.router.add_api_route(
            path="/courses",
            endpoint=self.get_courses,
            methods=["GET"],
            response_model=List[schemas.CourseResponse],
            summary="Retrieve all courses, optionally filtered by status, group, or member registration email.",
            tags=["Courses"]
        )
        self.router.add_api_route(
            path="/courses",
            endpoint=self.create_course,
            methods=["POST"],
            response_model=schemas.CourseResponse,
            summary="Create a new course with specific capacity, fee, schedule, and level details.",
            tags=["Courses"]
        )
        self.router.add_api_route(
            path="/courses/{course_id}",
            endpoint=self.get_course,
            methods=["GET"],
            response_model=schemas.CourseResponse,
            summary="Retrieve details of a specific course.",
            tags=["Courses"]
        )
        self.router.add_api_route(
            path="/courses/{course_id}",
            endpoint=self.update_course,
            methods=["PUT"],
            response_model=schemas.CourseResponse,
            summary="Update the configuration and details of an existing course.",
            tags=["Courses"]
        )
        self.router.add_api_route(
            path="/courses/{course_id}",
            endpoint=self.delete_course,
            methods=["DELETE"],
            summary="Delete an existing course from the system.",
            tags=["Courses"]
        )
        self.router.add_api_route(
            path="/courses/{course_id}/registrations",
            endpoint=self.get_course_registrations,
            methods=["GET"],
            response_model=List[schemas.CourseRegistrationResponse],
            summary="Retrieve all member registrations for a specific course.",
            tags=["Courses"]
        )
        self.router.add_api_route(
            path="/courses/{course_id}/registrations",
            endpoint=self.create_course_registration,
            methods=["POST"],
            response_model=schemas.CourseRegistrationResponse,
            summary="Register a club member or guest participant for a specific course.",
            tags=["Courses"]
        )
        self.router.add_api_route(
            path="/course-registrations/{registration_id}",
            endpoint=self.update_course_registration,
            methods=["PUT"],
            response_model=schemas.CourseRegistrationResponse,
            summary="Update the status or notes of an existing course registration.",
            tags=["Courses"]
        )
        self.router.add_api_route(
            path="/course-registrations/{registration_id}",
            endpoint=self.delete_course_registration,
            methods=["DELETE"],
            summary="Cancel and delete an existing course registration.",
            tags=["Courses"]
        )

    async def get_courses_summary(
        self,
        request: Request,
        owner_id: int,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Get courses summary router start", step="ROUTER_START", user_info=current_user)
        logic = CoursesLogic()
        return await logic.get_courses_summary(request, owner_id, current_user)

    async def get_courses(
        self,
        request: Request,
        owner_id: int,
        status: str = "all",
        group_id: Optional[int] = None,
        member_email: Optional[str] = None,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Get courses router start", step="ROUTER_START", user_info=current_user)
        logic = CoursesLogic()
        return await logic.get_courses(request, owner_id, status, group_id, member_email, current_user)

    async def create_course(
        self,
        request: Request,
        course: schemas.CourseCreate,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Create course router start", step="ROUTER_START", user_info=current_user)
        logic = CoursesLogic()
        return await logic.create_course(request, course, current_user)

    async def get_course(
        self,
        request: Request,
        course_id: int,
        owner_id: int,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Get course router start", step="ROUTER_START", user_info=current_user)
        logic = CoursesLogic()
        return await logic.get_course(request, course_id, owner_id, current_user)

    async def update_course(
        self,
        request: Request,
        course_id: int,
        owner_id: int,
        course_update: schemas.CourseUpdate,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Update course router start", step="ROUTER_START", user_info=current_user)
        logic = CoursesLogic()
        return await logic.update_course(request, course_id, owner_id, course_update, current_user)

    async def delete_course(
        self,
        request: Request,
        course_id: int,
        owner_id: int,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Delete course router start", step="ROUTER_START", user_info=current_user)
        logic = CoursesLogic()
        return await logic.delete_course(request, course_id, owner_id, current_user)

    async def get_course_registrations(
        self,
        request: Request,
        course_id: int,
        owner_id: int,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Get course registrations router start", step="ROUTER_START", user_info=current_user)
        logic = CoursesLogic()
        return await logic.get_course_registrations(request, course_id, owner_id, current_user)

    async def create_course_registration(
        self,
        request: Request,
        course_id: int,
        registration: schemas.CourseRegistrationCreate,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Create course registration router start", step="ROUTER_START", user_info=current_user)
        logic = CoursesLogic()
        return await logic.create_course_registration(request, course_id, registration, current_user)

    async def update_course_registration(
        self,
        request: Request,
        registration_id: int,
        owner_id: int,
        registration_update: schemas.CourseRegistrationUpdate,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Update course registration router start", step="ROUTER_START", user_info=current_user)
        logic = CoursesLogic()
        return await logic.update_course_registration(request, registration_id, owner_id, registration_update, current_user)

    async def delete_course_registration(
        self,
        request: Request,
        registration_id: int,
        owner_id: int,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Delete course registration router start", step="ROUTER_START", user_info=current_user)
        logic = CoursesLogic()
        return await logic.delete_course_registration(request, registration_id, owner_id, current_user)


class CoursesLogic(ConnectionService):
    def __init__(self) -> None:
        super().__init__()
        logger.log_message_sync(message="CoursesLogic instance created")

    async def get_courses_summary(self, request: Request, owner_id: int, current_user: dict):
        try:
            with logger.time_operation("GET_COURSES_SUMMARY", request=request):
                db = self.db_driver
                courses = db.fetch_all("SELECT * FROM courses WHERE owner_id = %s", (owner_id,))
                registrations = db.fetch_all("SELECT * FROM course_registrations WHERE owner_id = %s", (owner_id,))
                
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

    async def get_courses(
        self,
        request: Request,
        owner_id: int,
        status: str,
        group_id: Optional[int],
        member_email: Optional[str],
        current_user: dict
    ):
        try:
            with logger.time_operation("GET_COURSES", request=request):
                db = self.db_driver
                
                if member_email:
                    email_clean = member_email.replace(" ", "").lower()
                    registrations = db.fetch_all(
                        "SELECT course_id FROM course_registrations WHERE LOWER(participant_email) = %s AND status = 'registered'",
                        (email_clean,)
                    )
                    course_ids = [r.get("course_id") for r in registrations]
                    
                    member = db.fetch_one("SELECT id FROM members WHERE LOWER(email) = %s LIMIT 1", (email_clean,))
                    if member:
                        reg_member = db.fetch_all(
                            "SELECT course_id FROM course_registrations WHERE member_id = %s AND status = 'registered'",
                            (member.get("id"),)
                        )
                        course_ids.extend([r.get("course_id") for r in reg_member])
                        
                    course_ids = list(set(course_ids))
                    if not course_ids:
                        return []
                        
                    placeholders = ", ".join(["%s"] * len(course_ids))
                    courses = db.fetch_all(
                        f"SELECT * FROM courses WHERE id IN ({placeholders}) ORDER BY id DESC",
                        tuple(course_ids)
                    )
                else:
                    query = "SELECT * FROM courses WHERE owner_id = %s"
                    params = [owner_id]
                    if group_id:
                        query += " AND group_id = %s"
                        params.append(group_id)
                    if status != "all":
                        if status not in COURSE_STATUSES:
                            raise HTTPException(status_code=400, detail="Invalid course status")
                        query += " AND status = %s"
                        params.append(status)
                        
                    query += " ORDER BY id DESC"
                    courses = db.fetch_all(query, tuple(params))
                    
                serialized = [serialize_course(course, db) for course in courses]
                if status == "full":
                    serialized = [c for c in serialized if c.get("status") == "full"]
                return serialized
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to get courses: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def create_course(self, request: Request, course: schemas.CourseCreate, current_user: dict):
        try:
            with logger.time_operation("CREATE_COURSE", request=request):
                db = self.db_driver
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
                
                course_id = db.insert("courses", insert_data)
                new_course = db.fetch_one("SELECT * FROM courses WHERE id = %s", (course_id,))
                return serialize_course(new_course, db)
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to create course: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_course(self, request: Request, course_id: int, owner_id: int, current_user: dict):
        try:
            with logger.time_operation("GET_COURSE", request=request):
                db = self.db_driver
                course = db.fetch_one(
                    "SELECT * FROM courses WHERE id = %s AND owner_id = %s",
                    (course_id, owner_id)
                )
                if not course:
                    raise HTTPException(status_code=404, detail="Course not found")
                return serialize_course(course, db)
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to get course: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def update_course(
        self,
        request: Request,
        course_id: int,
        owner_id: int,
        course_update: schemas.CourseUpdate,
        current_user: dict
    ):
        try:
            with logger.time_operation("UPDATE_COURSE", request=request):
                db = self.db_driver
                course = db.fetch_one(
                    "SELECT * FROM courses WHERE id = %s AND owner_id = %s",
                    (course_id, owner_id)
                )
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
                    db.execute_query(
                        f"UPDATE courses SET {', '.join(set_clauses)} WHERE id = %s",
                        tuple(params)
                    )

                updated = db.fetch_one("SELECT * FROM courses WHERE id = %s", (course_id,))
                return serialize_course(updated, db)
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to update course: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def delete_course(self, request: Request, course_id: int, owner_id: int, current_user: dict):
        try:
            with logger.time_operation("DELETE_COURSE", request=request):
                db = self.db_driver
                course = db.fetch_one(
                    "SELECT * FROM courses WHERE id = %s AND owner_id = %s",
                    (course_id, owner_id)
                )
                if not course:
                    raise HTTPException(status_code=404, detail="Course not found")

                db.execute_query("DELETE FROM courses WHERE id = %s", (course_id,))
                return {"message": "Course deleted successfully"}
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to delete course: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_course_registrations(self, request: Request, course_id: int, owner_id: int, current_user: dict):
        try:
            with logger.time_operation("GET_COURSE_REGISTRATIONS", request=request):
                db = self.db_driver
                course = db.fetch_one(
                    "SELECT * FROM courses WHERE id = %s AND owner_id = %s",
                    (course_id, owner_id)
                )
                if not course:
                    raise HTTPException(status_code=404, detail="Course not found")

                registrations = db.fetch_all(
                    "SELECT * FROM course_registrations WHERE course_id = %s AND owner_id = %s ORDER BY id DESC",
                    (course_id, owner_id)
                )
                return [serialize_course_registration(r, db) for r in registrations]
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed course registrations: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def create_course_registration(
        self,
        request: Request,
        course_id: int,
        registration: schemas.CourseRegistrationCreate,
        current_user: dict
    ):
        try:
            with logger.time_operation("CREATE_COURSE_REGISTRATION", request=request):
                db = self.db_driver
                course = db.fetch_one(
                    "SELECT * FROM courses WHERE id = %s AND owner_id = %s",
                    (course_id, registration.owner_id)
                )
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
                    member = db.fetch_one(
                        "SELECT m.* FROM members m JOIN groups g ON m.group_id = g.id "
                        "WHERE m.id = %s AND g.owner_id = %s LIMIT 1",
                        (member_id, registration.owner_id)
                    )
                    if not member:
                        raise HTTPException(status_code=404, detail="Member not found or access denied")
                    
                    if course.get("group_id") and member.get("group_id") != course.get("group_id"):
                        raise HTTPException(status_code=400, detail="Member does not belong to this course group")
                    
                    existing = db.fetch_one(
                        "SELECT id FROM course_registrations WHERE course_id = %s AND member_id = %s AND status != 'cancelled' LIMIT 1",
                        (course_id, member_id)
                    )
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
                
                reg_id = db.insert("course_registrations", insert_data)
                new_reg = db.fetch_one("SELECT * FROM course_registrations WHERE id = %s", (reg_id,))
                return serialize_course_registration(new_reg, db)
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to create course registration: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def update_course_registration(
        self,
        request: Request,
        registration_id: int,
        owner_id: int,
        registration_update: schemas.CourseRegistrationUpdate,
        current_user: dict
    ):
        try:
            with logger.time_operation("UPDATE_COURSE_REGISTRATION", request=request):
                db = self.db_driver
                registration = db.fetch_one(
                    "SELECT * FROM course_registrations WHERE id = %s AND owner_id = %s",
                    (registration_id, owner_id)
                )
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
                    db.execute_query(
                        f"UPDATE course_registrations SET {', '.join(set_clauses)} WHERE id = %s",
                        tuple(params)
                    )

                updated = db.fetch_one("SELECT * FROM course_registrations WHERE id = %s", (registration_id,))
                return serialize_course_registration(updated, db)
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to update course registration: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def delete_course_registration(self, request: Request, registration_id: int, owner_id: int, current_user: dict):
        try:
            with logger.time_operation("DELETE_COURSE_REGISTRATION", request=request):
                db = self.db_driver
                registration = db.fetch_one(
                    "SELECT * FROM course_registrations WHERE id = %s AND owner_id = %s",
                    (registration_id, owner_id)
                )
                if not registration:
                    raise HTTPException(status_code=404, detail="Registration not found")

                db.execute_query("DELETE FROM course_registrations WHERE id = %s", (registration_id,))
                return {"message": "Registration removed successfully"}
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed delete registration: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
