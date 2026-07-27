"""
Authentication API endpoints.
Provides routes for user registration, credentials check, session refresh, logout, and user details retrieval.
"""

from fastapi import APIRouter, Depends, status, Response, Query
from typing import Optional
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user, get_current_admin
from app.features.auth.schemas import (
    UserRegister,
    UserLogin,
    TokenResponse,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserResponse,
    UserStatusUpdate,
    BulkStatusUpdate,
    PaginatedUserList,
    ChangePasswordRequest,
    VerifyEmailRequest,
    ResendVerificationRequest
)
from app.features.auth.service import AuthService
from app.common.schemas.base import SuccessResponse
from app.features.auth.crud import UserCRUD
from app.core.exceptions import NotFoundException

router = APIRouter()
auth_service = AuthService()
user_crud = UserCRUD()

@router.post(
    "/register",
    response_model=SuccessResponse[UserResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Register a new account"
)
async def register(
    data: UserRegister,
    db: Session = Depends(get_db)
):
    """Registers a new Client, Artist/Band, or Venue Owner profile."""
    user, email_sent = auth_service.register_user(db, data)
    msg = "User successfully registered. Verification email sent." if email_sent else "User successfully registered. Verification email failed to send, please try resending."
    return SuccessResponse(
        success=True,
        data=user,
        message=msg,
        email_sent=email_sent
    )



@router.post(
    "/resend-verification",
    response_model=SuccessResponse[None],
    status_code=status.HTTP_200_OK,
    summary="Resend verification email"
)
async def resend_verification(
    data: ResendVerificationRequest,
    db: Session = Depends(get_db)
):
    """Resends email verification token if not already verified with a 60s cooldown limit."""
    email_sent = auth_service.resend_verification_email(db, data.email)
    msg = "Verification email resent successfully." if email_sent else "Verification email failed to send. Please try again later."
    return SuccessResponse(
        success=True,
        data=None,
        message=msg
    )


@router.post(
    "/login",
    response_model=SuccessResponse[TokenResponse],
    status_code=status.HTTP_200_OK,
    summary="Authenticate credentials"
)
async def login(
    response: Response,
    data: UserLogin,
    db: Session = Depends(get_db)
):
    """Authenticates credentials and returns access/refresh session tokens."""
    access_token, refresh_token = auth_service.login_user(db, data)
    
    # Store refresh token in HTTP-only cookie for enhanced security
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=7 * 24 * 60 * 60  # 7 days
    )
    
    return SuccessResponse(
        success=True,
        data=TokenResponse(access_token=access_token, refresh_token=refresh_token),
        message="Successfully authenticated."
    )


@router.post(
    "/refresh",
    response_model=SuccessResponse[TokenResponse],
    status_code=status.HTTP_200_OK,
    summary="Refresh session credentials"
)
async def refresh(
    data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Verifies refresh token and issues a new access token."""
    new_access_token = auth_service.refresh_access_token(db, data.refresh_token)
    return SuccessResponse(
        success=True,
        data=TokenResponse(access_token=new_access_token, refresh_token=data.refresh_token),
        message="Session credentials updated."
    )


@router.post(
    "/logout",
    response_model=SuccessResponse[None],
    status_code=status.HTTP_200_OK,
    summary="Terminate user session"
)
async def logout(
    response: Response,
    data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Revokes refresh session tokens and clears httpOnly cookies."""
    auth_service.logout_user(db, data.refresh_token)
    response.delete_cookie(key="refresh_token")
    return SuccessResponse(
        success=True,
        data=None,
        message="Logged out successfully."
    )


@router.post(
    "/forgot-password",
    response_model=SuccessResponse[None],
    status_code=status.HTTP_200_OK,
    summary="Initiate password reset"
)
async def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """Generates password reset links sandbox logs placeholder."""
    auth_service.initiate_forgot_password(db, data.email)
    return SuccessResponse(
        success=True,
        data=None,
        message="If email exists, a password reset link has been dispatched."
    )


@router.post(
    "/reset-password",
    response_model=SuccessResponse[None],
    status_code=status.HTTP_200_OK,
    summary="Complete password reset"
)
async def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """Resets credentials passwords using valid tokens."""
    auth_service.reset_password(db, data.token, data.new_password)
    return SuccessResponse(
        success=True,
        data=None,
        message="Password successfully reset."
    )


@router.post(
    "/verify-email",
    response_model=SuccessResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Verify user email address"
)
async def verify_email(
    response: Response,
    data: VerifyEmailRequest,
    db: Session = Depends(get_db)
):
    """Verifies user email address using valid JWT token. Handles already-verified gracefully and issues auto-login tokens on first verification."""
    result = auth_service.verify_email_token(db, data.token)
    if result.get("already_verified"):
        msg = "Email already verified."
    else:
        msg = "Email successfully verified. Auto-logged in."
        if result.get("refresh_token"):
            response.set_cookie(
                key="refresh_token",
                value=result["refresh_token"],
                httponly=True,
                secure=True,
                samesite="strict",
                max_age=7 * 24 * 60 * 60
            )

    return SuccessResponse(
        success=True,
        data=result,
        message=msg
    )



@router.get(
    "/me",
    response_model=SuccessResponse[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="Get current user details"
)
async def get_me(
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetches details of the authenticated user session."""
    user = user_crud.get(db, current_user_claims["sub"])
    return SuccessResponse(
        success=True,
        data=user,
        message="User profile retrieved successfully."
    )


@router.post(
    "/change-password",
    response_model=SuccessResponse[None],
    status_code=status.HTTP_200_OK,
    summary="Change user password (authenticated)"
)
async def change_user_password(
    data: ChangePasswordRequest,
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verifies old password and updates it to new password.
    """
    auth_service.change_password(
        db, 
        current_user_claims["sub"], 
        data.old_password, 
        data.new_password
    )
    return SuccessResponse(
        success=True,
        data=None,
        message="Password changed successfully."
    )


@router.delete(
    "/me",
    response_model=SuccessResponse[None],
    status_code=status.HTTP_200_OK,
    summary="Delete own user account (authenticated)"
)
async def delete_own_user(
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Flags the logged-in user account for logical soft deletion.
    """
    auth_service.soft_delete_user(db, current_user_claims["sub"])
    return SuccessResponse(
        success=True,
        data=None,
        message="Your user account has been successfully deleted."
    )

@router.get(
    "/admin/users",
    response_model=SuccessResponse[PaginatedUserList],
    status_code=status.HTTP_200_OK,
    summary="List all users with filters and pagination"
)
async def list_admin_users(
    search: Optional[str] = Query(None, description="Search name or email"),
    role: Optional[str] = Query(None, description="Filter by role name"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_admin_claims: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only endpoint listing all platform users with filtering and pagination."""
    users, total = user_crud.get_filtered_users(
        db, search=search, role_name=role, is_active=is_active, limit=limit, offset=offset
    )
    return SuccessResponse(
        success=True,
        data=PaginatedUserList(items=users, total=total),
        message="Users list retrieved successfully."
    )

@router.get(
    "/admin/users/{user_id}",
    response_model=SuccessResponse[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="Get user profile detail by ID"
)
async def get_admin_user_detail(
    user_id: str,
    current_admin_claims: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only endpoint fetching complete details of a specific user."""
    user = user_crud.get(db, user_id)
    if not user:
        raise NotFoundException("User not found.")
    return SuccessResponse(
        success=True,
        data=user,
        message="User details retrieved successfully."
    )

@router.put(
    "/admin/users/{user_id}/status",
    response_model=SuccessResponse[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="Toggle user active status"
)
async def toggle_admin_user_status(
    user_id: str,
    data: UserStatusUpdate,
    current_admin_claims: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only endpoint to suspend or activate a user account."""
    user = auth_service.toggle_user_activity(db, user_id, data.is_active)
    status_msg = "activated" if data.is_active else "suspended"
    return SuccessResponse(
        success=True,
        data=user,
        message=f"User account successfully {status_msg}."
    )

@router.delete(
    "/admin/users/{user_id}",
    response_model=SuccessResponse[None],
    status_code=status.HTTP_200_OK,
    summary="Soft-delete user account"
)
async def delete_admin_user(
    user_id: str,
    current_admin_claims: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only endpoint flagging a user account for soft-deletion."""
    auth_service.soft_delete_user(db, user_id)
    return SuccessResponse(
        success=True,
        data=None,
        message="User account successfully marked as deleted."
    )

@router.post(
    "/admin/users/bulk-status",
    response_model=SuccessResponse[None],
    status_code=status.HTTP_200_OK,
    summary="Bulk update user active status"
)
async def bulk_toggle_admin_users_status(
    data: BulkStatusUpdate,
    current_admin_claims: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only endpoint to bulk activate or suspend multiple user accounts."""
    auth_service.bulk_toggle_user_activity(db, [str(uid) for uid in data.user_ids], data.is_active)
    status_msg = "activated" if data.is_active else "suspended"
    return SuccessResponse(
        success=True,
        data=None,
        message=f"Successfully bulk {status_msg} {len(data.user_ids)} accounts."
    )
