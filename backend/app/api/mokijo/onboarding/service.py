from fastapi import APIRouter, Depends, Request, HTTPException, Form, status, BackgroundTasks
from typing import List, Optional
from sqlalchemy.orm import Session
import json
import secrets
from datetime import datetime, timezone

from app.models import schemas
from sqlalchemy.orm import Session
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
from app.core.security import hash_password
from app.core.validators import (
is_valid_email,
is_strong_password,
is_valid_person_name,
is_valid_phone,
is_valid_aadhaar,
EMAIL_MESSAGE,
STRONG_PASSWORD_MESSAGE,
PERSON_NAME_MESSAGE,
AADHAAR_MESSAGE,
phone_length_message,
)
from app.services.email import send_signup_verification_email
from app.api.mokijo.onboarding import crud


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
            {"name": "aadhar", "label": "Aadhar Number", "type": "text", "required": True, "placeholder": "12-digit Aadhar"}
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
            {"name": "emergency_contact", "label": "Emergency Contact Number", "type": "tel", "required": True, "placeholder": "Emergency phone"},
            {"name": "dob", "label": "Date of Birth (DD/MM/YYYY)", "type": "date", "required": True, "placeholder": "DD/MM/YYYY"},
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
            {"name": "aadhar", "label": "Aadhar Number", "type": "text", "required": True, "placeholder": "12-digit Aadhar"}
        ]
        title = "Referee Registration"
        desc = "Apply to become a referee for our club. Fill in your details below."
    return title, desc, json.dumps(fields)


    from app.api.mokijo.onboarding import crud

async def get_signup_forms(request: Request, db: Session, owner_id: int, current_user: dict):
    try:
        with logger.time_operation("GET_SIGNUP_FORMS", request=request):
            forms = crud.get_signup_forms_by_owner(db, owner_id)

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

async def get_signup_form_by_role(request: Request, db: Session, role: str, owner_id: int, current_user: dict = None):
    try:
        with logger.time_operation("GET_SIGNUP_FORM_BY_ROLE", request=request):
            saved_form = crud.get_signup_form_by_role_and_owner(db, role, owner_id)
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

async def upsert_signup_form(request: Request, db: Session, form: schemas.SignupFormCreate, current_user: dict):
    try:
        with logger.time_operation("UPSERT_SIGNUP_FORM", request=request):
            existing = crud.get_signup_form_by_role_and_owner(db, form.role, form.owner_id)

            if existing:
                crud.update_signup_form_full(db, existing.get("id"), form.title, form.description, form.fields)
                updated = crud.get_signup_form_by_id(db, existing.get("id"))
                return updated
            else:
                insert_data = {
                    "owner_id": form.owner_id,
                    "role": form.role,
                    "title": form.title,
                    "description": form.description,
                    "fields": form.fields
                }
                form_id = crud.create_signup_form(db, insert_data)
                new_form = crud.get_signup_form_by_id(db, form_id)
                return new_form
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to upsert signup form: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def create_signup_submission(request: Request, db: Session, submission: schemas.SignupSubmissionCreate, background_tasks: BackgroundTasks):
    try:
        with logger.time_operation("CREATE_SIGNUP_SUBMISSION", request=request):
            owner = crud.get_user_by_id(db, submission.owner_id)
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
            first_name = normalize_text(get_case_insensitive_value(submitted_data, "first_name") or get_case_insensitive_value(submitted_data, "firstName"))
            last_name = normalize_text(get_case_insensitive_value(submitted_data, "last_name") or get_case_insensitive_value(submitted_data, "lastName"))
            phone = normalize_text(get_case_insensitive_value(submitted_data, "phone"))
            aadhaar = normalize_text(get_case_insensitive_value(submitted_data, "aadhar") or get_case_insensitive_value(submitted_data, "aadharNumber"))

            if not email_clean:
                raise HTTPException(status_code=400, detail="Email is required for member approval and login.")
            if not is_valid_email(email_clean):
                raise HTTPException(status_code=400, detail=EMAIL_MESSAGE)
            if not password_clean:
                raise HTTPException(status_code=400, detail="Password is required for member approval and login.")
            if not is_strong_password(password_clean):
                raise HTTPException(status_code=400, detail=STRONG_PASSWORD_MESSAGE)
            if first_name and not is_valid_person_name(first_name):
                raise HTTPException(status_code=400, detail=PERSON_NAME_MESSAGE)
            if last_name and not is_valid_person_name(last_name):
                raise HTTPException(status_code=400, detail=PERSON_NAME_MESSAGE)
            if phone and not is_valid_phone(phone):
                raise HTTPException(status_code=400, detail=phone_length_message())

            role_lower = (submission.role or "").lower()
            if role_lower in ("coach", "referee"):
                if not aadhaar:
                    raise HTTPException(status_code=400, detail="Aadhaar number is required for this role.")
                if not is_valid_aadhaar(aadhaar):
                    raise HTTPException(status_code=400, detail=AADHAAR_MESSAGE)
            elif aadhaar and not is_valid_aadhaar(aadhaar):
                raise HTTPException(status_code=400, detail=AADHAAR_MESSAGE)

            if find_approved_member_by_email(db, email_clean, submission.owner_id):
                raise HTTPException(status_code=400, detail="This email is already approved as a club member. Please log in.")

            if has_pending_submission_for_email(db, email_clean, submission.owner_id):
                raise HTTPException(
                    status_code=400,
                    detail="Your application is already in the onboarding queue. Club admin has to approve your application before you can log in."
                )

            submitted_data["email"] = email_clean
            submitted_data["password"] = password_clean
            submitted_data["email_verify_token"] = None
            submitted_data["email_verified_at"] = datetime.now(timezone.utc).isoformat()

            insert_data = {
                "owner_id": submission.owner_id,
                "role": submission.role,
                "submitted_data": json.dumps(submitted_data)
            }
            sub_id = crud.create_submission(db, insert_data)

            return {
                "message": "Application submitted successfully! The club admin will review and approve your application.",
                "id": sub_id,
                "role": submission.role,
                "status": "pending"
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to create signup submission: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def verify_signup_submission_email(request: Request, db: Session, token: str):
    try:
        with logger.time_operation("VERIFY_SIGNUP_SUBMISSION_EMAIL", request=request):
            submissions = crud.get_all_submissions(db)

            matched_submission = None
            matched_data = None
            for sub in submissions:
                try:
                    data = json.loads(sub.get("submitted_data"))
                except Exception:
                    continue
                if isinstance(data, dict) and data.get("email_verify_token") == token:
                    matched_submission = sub
                    matched_data = data
                    break

            if not matched_submission:
                raise HTTPException(status_code=400, detail="Invalid or expired verification link.")

            if matched_data.get("email_verified_at"):
                return {"message": "Your email has already been verified."}

            matched_data["email_verified_at"] = datetime.now(timezone.utc).isoformat()

            crud.update_submission_data(db, matched_submission.get("id"), json.dumps(matched_data))

            return {"message": "Your email has been successfully verified! Club admin still has to approve your application before you can log in."}
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to verify signup submission email: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_signup_submissions(request: Request, db: Session, owner_id: int, current_user: dict):
    try:
        with logger.time_operation("GET_SIGNUP_SUBMISSIONS", request=request):
            submissions = crud.get_submissions_by_owner_ordered(db, owner_id)

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

async def delete_signup_submission(request: Request, db: Session, submission_id: int, owner_id: int, current_user: dict):
    try:
        with logger.time_operation("DELETE_SIGNUP_SUBMISSION", request=request):
            submission = crud.get_submission_by_id_and_owner(db, submission_id, owner_id)
            if not submission:
                raise HTTPException(status_code=404, detail="Submission not found")

            crud.delete_submission(db, submission_id)
            return {"message": "Application rejected/deleted successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed delete submission: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def approve_signup_submission(request: Request, db: Session, submission_id: int, owner_id: int, group_id: Optional[int], current_user: dict):
    try:
        with logger.time_operation("APPROVE_SIGNUP_SUBMISSION", request=request):
            submission = crud.get_submission_by_id_and_owner(db, submission_id, owner_id)
            if not submission:
                raise HTTPException(status_code=404, detail="Submission not found")

            if group_id:
                group = crud.get_group_by_id_and_owner(db, group_id, owner_id)
                if not group:
                    raise HTTPException(status_code=404, detail="Group not found or access denied")
            else:
                owner = crud.get_user_by_id(db, owner_id)
                if not owner:
                    raise HTTPException(status_code=404, detail="Club admin not found")

                group = crud.get_group_by_name_and_owner(db, "Approved Members", owner_id)
                if not group:
                    insert_group = {
                        "owner_id": owner_id,
                        "activity": owner.get("sport") or "Club",
                        "age_group": "All Ages",
                        "group_name": "Approved Members",
                        "sub_group": "Onboarding",
                        "description": "Automatically created for accepted member applications."
                    }
                    group_id_val = crud.create_group(db, insert_group)
                    group = crud.get_group_by_id_and_owner(db, group_id_val, owner_id)

            data = parse_submission_data(submission.get("submitted_data"))
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

            hashed_password = hash_password(password.strip()) if password else ""
            insert_member = {
                "group_id": group.get("id"),
                "first_name": first_name,
                "last_name": last_name,
                "email": email,
                "phone": phone,
                "password": hashed_password,
                "role": submission.get("role")
            }
            member_id = crud.create_member(db, insert_member)

            crud.delete_submission(db, submission_id)

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
