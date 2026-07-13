from fastapi import APIRouter, Depends, Request, HTTPException, Form, status
from typing import List, Optional
import json

from app.models import schemas
from app.connectors.connection_service import ConnectionService
from app.auth.authorization import check_user_authorization
from app.core.helpers import (
    get_submission_email,
    normalize_text,
    get_case_insensitive_value,
    find_approved_member_by_email,
    has_pending_submission_for_email,
    parse_submission_data
)
from app.logger import logger


def get_default_fields(role: str):
    role_lower = role.lower()
    if "coach" in role_lower:
        fields = [
            {"name": "first_name", "label": "First Name", "type": "text", "required": True, "placeholder": "Enter first name"},
            {"name": "last_name", "label": "Last Name", "type": "text", "required": True, "placeholder": "Enter last name"},
            {"name": "email", "label": "Email Address", "type": "email", "required": True, "placeholder": "coach@example.com"},
            {"name": "phone", "label": "Phone Number", "type": "tel", "required": True, "placeholder": "10-digit number"},
            {"name": "specialization", "label": "Specialization / Sport", "type": "text", "required": True, "placeholder": "e.g., Football, Cricket"},
            {"name": "experience", "label": "Coaching Experience (Years)", "type": "number", "required": False, "placeholder": "e.g., 5"},
            {"name": "aadhar", "label": "Aadhar Number", "type": "text", "required": False, "placeholder": "12-digit Aadhar"}
        ]
        title = "Coach Registration"
        desc = "Apply to become a coach for our club. Fill in your details below."
    elif "parent" in role_lower:
        fields = [
            {"name": "first_name", "label": "First Name", "type": "text", "required": True, "placeholder": "Enter first name"},
            {"name": "last_name", "label": "Last Name", "type": "text", "required": True, "placeholder": "Enter last name"},
            {"name": "email", "label": "Email Address", "type": "email", "required": True, "placeholder": "parent@example.com"},
            {"name": "phone", "label": "Phone Number", "type": "tel", "required": True, "placeholder": "10-digit number"},
            {"name": "child_name", "label": "Child's Name", "type": "text", "required": True, "placeholder": "Enter child's full name"},
            {"name": "relation", "label": "Relationship to Child", "type": "select", "required": True, "options": ["Father", "Mother", "Guardian"], "placeholder": "Select relationship"},
            {"name": "emergency_contact", "label": "Emergency Contact Number", "type": "tel", "required": True, "placeholder": "Emergency phone"}
        ]
        title = "Parent Registration"
        desc = "Register as a parent/guardian. Fill in your and your child's details below."
    elif "player" in role_lower:
        fields = [
            {"name": "first_name", "label": "First Name", "type": "text", "required": True, "placeholder": "Enter first name"},
            {"name": "last_name", "label": "Last Name", "type": "text", "required": True, "placeholder": "Enter last name"},
            {"name": "email", "label": "Email Address", "type": "email", "required": True, "placeholder": "player@example.com"},
            {"name": "phone", "label": "Phone Number", "type": "tel", "required": True, "placeholder": "10-digit number"},
            {"name": "dob", "label": "Date of Birth", "type": "date", "required": True, "placeholder": "Select date of birth"},
            {"name": "gender", "label": "Gender", "type": "select", "required": True, "options": ["Male", "Female", "Other"], "placeholder": "Select gender"},
            {"name": "position", "label": "Play Position / Skill", "type": "text", "required": False, "placeholder": "e.g., Striker, Goalkeeper, Batsman"}
        ]
        title = "Player Registration"
        desc = "Apply to register as a player in our club. Fill in your details below."
    else:  # referee
        fields = [
            {"name": "first_name", "label": "First Name", "type": "text", "required": True, "placeholder": "Enter first name"},
            {"name": "last_name", "label": "Last Name", "type": "text", "required": True, "placeholder": "Enter last name"},
            {"name": "email", "label": "Email Address", "type": "email", "required": True, "placeholder": "referee@example.com"},
            {"name": "phone", "label": "Phone Number", "type": "tel", "required": True, "placeholder": "10-digit number"},
            {"name": "certification", "label": "Certification Level", "type": "text", "required": True, "placeholder": "e.g., State Level, National Level"},
            {"name": "experience", "label": "Officiating Experience (Years)", "type": "number", "required": False, "placeholder": "e.g., 3"},
            {"name": "aadhar", "label": "Aadhar Number", "type": "text", "required": False, "placeholder": "12-digit Aadhar"}
        ]
        title = "Referee Registration"
        desc = "Apply to become a referee for our club. Fill in your details below."
    return title, desc, json.dumps(fields)


class OnboardingRouting(ConnectionService):
    def __init__(self) -> None:
        super().__init__()
        
        self.router.add_api_route(
            path="/signup-forms",
            endpoint=self.get_signup_forms,
            methods=["GET"],
            summary="Retrieve custom signup forms configured for standard roles (Coach, Parent, Player, Referee).",
            tags=["Onboarding"]
        )
        self.router.add_api_route(
            path="/signup-forms/{role}",
            endpoint=self.get_signup_form_by_role,
            methods=["GET"],
            summary="Retrieve custom signup form fields configured for a specific role.",
            tags=["Onboarding"]
        )
        self.router.add_api_route(
            path="/signup-forms",
            endpoint=self.upsert_signup_form,
            methods=["POST"],
            response_model=schemas.SignupFormResponse,
            summary="Create or update a custom signup form fields configuration for a role.",
            tags=["Onboarding"]
        )
        self.router.add_api_route(
            path="/signup-submissions",
            endpoint=self.create_signup_submission,
            methods=["POST"],
            summary="Create an onboarding application submission for approval by a club administrator.",
            tags=["Onboarding"]
        )
        self.router.add_api_route(
            path="/signup-submissions",
            endpoint=self.get_signup_submissions,
            methods=["GET"],
            summary="Retrieve all pending onboarding application submissions for a club administrator.",
            tags=["Onboarding"]
        )
        self.router.add_api_route(
            path="/signup-submissions/{submission_id}",
            endpoint=self.delete_signup_submission,
            methods=["DELETE"],
            summary="Reject and delete a pending onboarding application submission.",
            tags=["Onboarding"]
        )
        self.router.add_api_route(
            path="/signup-submissions/{submission_id}/approve",
            endpoint=self.approve_signup_submission,
            methods=["POST"],
            summary="Approve a pending onboarding application, creating a verified member account in a club group.",
            tags=["Onboarding"]
        )

    async def get_signup_forms(
        self,
        request: Request,
        owner_id: int,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Get signup forms router start", step="ROUTER_START", user_info=current_user)
        logic = OnboardingLogic()
        return await logic.get_signup_forms(request, owner_id, current_user)

    async def get_signup_form_by_role(
        self,
        request: Request,
        role: str,
        owner_id: int,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Get signup form by role router start", step="ROUTER_START", user_info=current_user)
        logic = OnboardingLogic()
        return await logic.get_signup_form_by_role(request, role, owner_id, current_user)

    async def upsert_signup_form(
        self,
        request: Request,
        form: schemas.SignupFormCreate,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Upsert signup form router start", step="ROUTER_START", user_info=current_user)
        logic = OnboardingLogic()
        return await logic.upsert_signup_form(request, form, current_user)

    async def create_signup_submission(
        self,
        request: Request,
        submission: schemas.SignupSubmissionCreate,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Create signup submission router start", step="ROUTER_START", user_info=current_user)
        logic = OnboardingLogic()
        return await logic.create_signup_submission(request, submission, current_user)

    async def get_signup_submissions(
        self,
        request: Request,
        owner_id: int,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Get signup submissions router start", step="ROUTER_START", user_info=current_user)
        logic = OnboardingLogic()
        return await logic.get_signup_submissions(request, owner_id, current_user)

    async def delete_signup_submission(
        self,
        request: Request,
        submission_id: int,
        owner_id: int,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Delete signup submission router start", step="ROUTER_START", user_info=current_user)
        logic = OnboardingLogic()
        return await logic.delete_signup_submission(request, submission_id, owner_id, current_user)

    async def approve_signup_submission(
        self,
        request: Request,
        submission_id: int,
        owner_id: int,
        group_id: Optional[int] = None,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Approve signup submission router start", step="ROUTER_START", user_info=current_user)
        logic = OnboardingLogic()
        return await logic.approve_signup_submission(request, submission_id, owner_id, group_id, current_user)


class OnboardingLogic(ConnectionService):
    def __init__(self) -> None:
        super().__init__()
        logger.log_message_sync(message="OnboardingLogic instance created")

    async def get_signup_forms(self, request: Request, owner_id: int, current_user: dict):
        try:
            with logger.time_operation("GET_SIGNUP_FORMS", request=request):
                db = self.db_driver
                forms = db.fetch_all("SELECT * FROM signup_forms WHERE owner_id = %s", (owner_id,))
                
                roles = ["Coach", "Parent", "Player", "Referee"]
                result = []
                for role in roles:
                    saved_form = next((f for f in forms if f.get("role", "").lower() == role.lower()), None)
                    if saved_form:
                        result.append({
                            "id": saved_form.get("id"),
                            "owner_id": saved_form.get("owner_id"),
                            "role": saved_form.get("role"),
                            "title": saved_form.get("title"),
                            "description": saved_form.get("description"),
                            "fields": saved_form.get("fields"),
                            "is_customized": True
                        })
                    else:
                        title, desc, fields_json = get_default_fields(role)
                        result.append({
                            "id": 0,
                            "owner_id": owner_id,
                            "role": role,
                            "title": title,
                            "description": desc,
                            "fields": fields_json,
                            "is_customized": False
                        })
                return result
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed getting signup forms: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_signup_form_by_role(self, request: Request, role: str, owner_id: int, current_user: dict):
        try:
            with logger.time_operation("GET_SIGNUP_FORM_BY_ROLE", request=request):
                db = self.db_driver
                saved_form = db.fetch_one(
                    "SELECT * FROM signup_forms WHERE owner_id = %s AND LOWER(role) = %s LIMIT 1",
                    (owner_id, role.lower())
                )
                if saved_form:
                    return {
                        "id": saved_form.get("id"),
                        "owner_id": saved_form.get("owner_id"),
                        "role": saved_form.get("role"),
                        "title": saved_form.get("title"),
                        "description": saved_form.get("description"),
                        "fields": saved_form.get("fields"),
                        "is_customized": True
                    }
                
                title, desc, fields_json = get_default_fields(role)
                return {
                    "id": 0,
                    "owner_id": owner_id,
                    "role": role,
                    "title": title,
                    "description": desc,
                    "fields": fields_json,
                    "is_customized": False
                }
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed getting signup form by role: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def upsert_signup_form(self, request: Request, form: schemas.SignupFormCreate, current_user: dict):
        try:
            with logger.time_operation("UPSERT_SIGNUP_FORM", request=request):
                db = self.db_driver
                existing = db.fetch_one(
                    "SELECT id FROM signup_forms WHERE owner_id = %s AND LOWER(role) = %s LIMIT 1",
                    (form.owner_id, form.role.lower())
                )
                
                if existing:
                    db.execute_query(
                        "UPDATE signup_forms SET title = %s, description = %s, fields = %s WHERE id = %s",
                        (form.title, form.description, form.fields, existing.get("id"))
                    )
                    updated = db.fetch_one("SELECT * FROM signup_forms WHERE id = %s", (existing.get("id"),))
                    return updated
                else:
                    insert_data = {
                        "owner_id": form.owner_id,
                        "role": form.role,
                        "title": form.title,
                        "description": form.description,
                        "fields": form.fields
                    }
                    form_id = db.insert("signup_forms", insert_data)
                    new_form = db.fetch_one("SELECT * FROM signup_forms WHERE id = %s", (form_id,))
                    return new_form
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to upsert signup form: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def create_signup_submission(self, request: Request, submission: schemas.SignupSubmissionCreate, current_user: dict):
        try:
            with logger.time_operation("CREATE_SIGNUP_SUBMISSION", request=request):
                db = self.db_driver
                owner = db.fetch_one("SELECT * FROM users WHERE id = %s LIMIT 1", (submission.owner_id,))
                if not owner:
                    raise HTTPException(status_code=404, detail="Selected club was not found. Please choose a valid club and submit again.")

                try:
                    submitted_data = json.loads(submission.submitted_data)
                except Exception:
                    raise HTTPException(status_code=400, detail="Invalid application data. Please try again.")

                if not isinstance(submitted_data, dict):
                    raise HTTPException(status_code=400, detail="Invalid application data. Please try again.")

                email_clean = get_submission_email(submitted_data)
                password_clean = normalize_text(get_case_insensitive_value(submitted_data, "password"))

                if not email_clean:
                    raise HTTPException(status_code=400, detail="Email is required for member approval and login.")
                if not password_clean:
                    raise HTTPException(status_code=400, detail="Password is required for member approval and login.")

                if find_approved_member_by_email(db, email_clean, submission.owner_id):
                    raise HTTPException(status_code=400, detail="This email is already approved as a club member. Please log in.")

                if has_pending_submission_for_email(db, email_clean, submission.owner_id):
                    raise HTTPException(
                        status_code=400,
                        detail="Your application is already in the onboarding queue. Club admin has to approve your application before you can log in."
                    )

                submitted_data["email"] = email_clean
                submitted_data["password"] = password_clean

                insert_data = {
                    "owner_id": submission.owner_id,
                    "role": submission.role,
                    "submitted_data": json.dumps(submitted_data)
                }
                sub_id = db.insert("signup_submissions", insert_data)
                
                return {
                    "message": "Application submitted. Club admin has to approve your application before you can log in.",
                    "id": sub_id,
                    "role": submission.role,
                    "status": "pending"
                }
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to create signup submission: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_signup_submissions(self, request: Request, owner_id: int, current_user: dict):
        try:
            with logger.time_operation("GET_SIGNUP_SUBMISSIONS", request=request):
                db = self.db_driver
                submissions = db.fetch_all(
                    "SELECT * FROM signup_submissions WHERE owner_id = %s ORDER BY created_at DESC",
                    (owner_id,)
                )
                
                result = []
                for s in submissions:
                    result.append({
                        "id": s.get("id"),
                        "owner_id": s.get("owner_id"),
                        "role": s.get("role"),
                        "submitted_data": s.get("submitted_data"),
                        "created_at": s.get("created_at").isoformat() if s.get("created_at") else None,
                        "status": "pending"
                    })
                return result
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed getting signup submissions: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def delete_signup_submission(self, request: Request, submission_id: int, owner_id: int, current_user: dict):
        try:
            with logger.time_operation("DELETE_SIGNUP_SUBMISSION", request=request):
                db = self.db_driver
                submission = db.fetch_one(
                    "SELECT * FROM signup_submissions WHERE id = %s AND owner_id = %s LIMIT 1",
                    (submission_id, owner_id)
                )
                if not submission:
                    raise HTTPException(status_code=404, detail="Submission not found")

                db.execute_query("DELETE FROM signup_submissions WHERE id = %s", (submission_id,))
                return {"message": "Application rejected/deleted successfully"}
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed delete submission: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def approve_signup_submission(self, request: Request, submission_id: int, owner_id: int, group_id: Optional[int], current_user: dict):
        try:
            with logger.time_operation("APPROVE_SIGNUP_SUBMISSION", request=request):
                db = self.db_driver
                submission = db.fetch_one(
                    "SELECT * FROM signup_submissions WHERE id = %s AND owner_id = %s LIMIT 1",
                    (submission_id, owner_id)
                )
                if not submission:
                    raise HTTPException(status_code=404, detail="Submission not found")

                if group_id:
                    group = db.fetch_one(
                        "SELECT * FROM groups WHERE id = %s AND owner_id = %s LIMIT 1",
                        (group_id, owner_id)
                    )
                    if not group:
                        raise HTTPException(status_code=404, detail="Group not found or access denied")
                else:
                    owner = db.fetch_one("SELECT * FROM users WHERE id = %s LIMIT 1", (owner_id,))
                    if not owner:
                        raise HTTPException(status_code=404, detail="Club admin not found")

                    group = db.fetch_one(
                        "SELECT * FROM groups WHERE owner_id = %s AND group_name = 'Approved Members' LIMIT 1",
                        (owner_id,)
                    )
                    if not group:
                        insert_group = {
                            "owner_id": owner_id,
                            "activity": owner.get("sport") or "Club",
                            "age_group": "All Ages",
                            "group_name": "Approved Members",
                            "sub_group": "Onboarding",
                            "description": "Automatically created for accepted member applications."
                        }
                        group_id_val = db.insert("groups", insert_group)
                        group = db.fetch_one("SELECT * FROM groups WHERE id = %s", (group_id_val,))

                data = parse_submission_data(submission)
                first_name = normalize_text(data.get("first_name") or data.get("firstName")) or "Applicant"
                last_name = normalize_text(data.get("last_name") or data.get("lastName")) or f"#{submission.id}"
                email = get_submission_email(data)
                phone = normalize_text(get_case_insensitive_value(data, "phone"))
                password = normalize_text(get_case_insensitive_value(data, "password"))

                if not email:
                    raise HTTPException(status_code=400, detail="Applicant email is required before approval.")
                if not password:
                    raise HTTPException(status_code=400, detail="Applicant password is required before approval.")

                if find_approved_member_by_email(db, email, owner_id):
                    raise HTTPException(status_code=400, detail="This applicant is already an approved club member.")

                insert_member = {
                    "group_id": group.get("id"),
                    "first_name": first_name,
                    "last_name": last_name,
                    "email": email,
                    "phone": phone,
                    "password": password,
                    "role": submission.get("role")
                }
                member_id = db.insert("members", insert_member)

                db.execute_query("DELETE FROM signup_submissions WHERE id = %s", (submission_id,))

                return {
                    "message": "Applicant accepted. The member can now log in with the registered email and password.",
                    "member_id": member_id,
                    "group_id": group.get("id"),
                    "group_name": group.get("group_name"),
                    "status": "accepted"
                }
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to approve submission: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
