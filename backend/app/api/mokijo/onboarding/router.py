from fastapi import APIRouter, Depends, Request, BackgroundTasks
from typing import Optional

from app.models import schemas
from app.api.mokijo.onboarding import service
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.auth.authorization import check_user_authorization, optional_user_authorization

router = APIRouter()

@router.get("/signup-forms", summary="Retrieve custom signup forms configured for standard roles (Coach, Parent, Player, Referee).", tags=["Onboarding"])
async def get_signup_forms(
    request: Request,
    owner_id: int,
    current_user: dict = Depends(optional_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_signup_forms(request, db, owner_id, current_user)

@router.get("/signup-forms/{role}", summary="Retrieve custom signup form fields configured for a specific role.", tags=["Onboarding"])
async def get_signup_form_by_role(
    request: Request,
    role: str,
    owner_id: int,
    db: Session = Depends(get_db)
):
    return await service.get_signup_form_by_role(request, db, role, owner_id)

@router.post("/signup-forms", response_model=schemas.SignupFormResponse, summary="Create or update a custom signup form fields configuration for a role.", tags=["Onboarding"])
async def upsert_signup_form(
    request: Request,
    form: schemas.SignupFormCreate,
    current_user: dict = Depends(optional_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.upsert_signup_form(request, db, form, current_user)

@router.post("/signup-submissions", summary="Create an onboarding application submission for approval by a club administrator.", tags=["Onboarding"])
async def create_signup_submission(
    request: Request,
    submission: schemas.SignupSubmissionCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    return await service.create_signup_submission(request, db, submission, background_tasks)

@router.get("/signup-submissions", summary="Retrieve all pending onboarding application submissions for a club administrator.", tags=["Onboarding"])
async def get_signup_submissions(
    request: Request,
    owner_id: int,
    current_user: dict = Depends(optional_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_signup_submissions(request, db, owner_id, current_user)

@router.get("/signup-submissions/verify-email", summary="Verify the applicant's email address for a pending onboarding application using a token.", tags=["Onboarding"])
async def verify_signup_submission_email(
    request: Request,
    token: str,
    db: Session = Depends(get_db)
):
    return await service.verify_signup_submission_email(request, db, token)

@router.delete("/signup-submissions/{submission_id}", summary="Reject and delete a pending onboarding application submission.", tags=["Onboarding"])
async def delete_signup_submission(
    request: Request,
    submission_id: int,
    owner_id: int,
    current_user: dict = Depends(optional_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.delete_signup_submission(request, db, submission_id, owner_id, current_user)

@router.post("/signup-submissions/{submission_id}/approve", summary="Approve a pending onboarding application, creating a verified member account in a club group.", tags=["Onboarding"])
async def approve_signup_submission(
    request: Request,
    submission_id: int,
    owner_id: int,
    group_id: Optional[int] = None,
    current_user: dict = Depends(optional_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.approve_signup_submission(request, db, submission_id, owner_id, group_id, current_user)
