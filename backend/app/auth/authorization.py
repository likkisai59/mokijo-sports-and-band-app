"""
authorization.py — JWT Bearer token authorization dependency.

Usage in any endpoint:
    current_user: dict = Depends(check_user_authorization)
"""

import uuid
import json
from fastapi import HTTPException, Request, status

from app.jwt.jwt import jwt_manager
from app.logger import logger


async def check_user_authorization(request: Request) -> dict:
    """
    FastAPI dependency — validates the JWT Bearer token from Authorization header.
    If the header is missing, falls back to parsing query/path params for backward compatibility.
    """
    await logger.log_message(request=request, message="Feature: Verification: Starting Access Token Validation")

    try:
        # Step 1: Get Authorization header
        auth_header = request.headers.get("Authorization")

        if not auth_header or not auth_header.startswith("Bearer "):
            await logger.log_warning(request=request, message="Authorization header missing or invalid.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication credentials were not provided or are invalid.",
            )

        # Step 2: Extract token
        access_token = auth_header.split(" ")[1]

        # Step 3: Verify and decode token
        token_data = await jwt_manager.verify_token(request=request, token=access_token)

        # Step 4: Parse user data from 'sub' field
        token_str = token_data.get("sub")
        user_data = None
        if token_str:
            if isinstance(token_str, dict):
                user_data = token_str
            else:
                try:
                    loaded = json.loads(token_str)
                    if isinstance(loaded, dict):
                        user_data = loaded
                except Exception:
                    pass
                
                if not user_data:
                    try:
                        loaded = eval(token_str.replace("ObjectId(", "").replace(")", ""))
                        if isinstance(loaded, dict):
                            user_data = loaded
                    except Exception:
                        pass
                
                if not user_data:
                    # Fallback if it's a raw string
                    user_data = {"id": token_str, "username": token_str}
        
        if not user_data:
            await logger.log_error(request=request, message="Feature: Verification: Invalid Access token - no user data found")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid access token",
            )

        # Extract role from token_data if not present in user_data
        if "role" not in user_data and "role" in token_data:
            user_data["role"] = token_data["role"]

        # Ensure id is present in user_data
        if "id" not in user_data and "userId" in user_data:
            user_data["id"] = user_data["userId"]

        # Normalize id to integer if numeric
        if "id" in user_data:
            try:
                user_data["id"] = int(user_data["id"])
            except (ValueError, TypeError):
                pass

        await logger.log_message(
            request=request,
            message=f"Feature: Verification: Access token verified successfully for user: {user_data.get('username', 'unknown')} with role: {user_data.get('role', 'unknown')}"
        )

        # Step 5: Attach user to request state + generate request ID
        request.state.user_details = user_data
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        await logger.log_message(request=request, message=f"Feature: Verification: Generated unique request ID: {request_id}")

        return user_data

    except HTTPException as http_e:
        await logger.log_error(request=request, message=f"Feature: Verification: Exception during token verification: {str(http_e.detail)}")
        raise http_e

    except Exception as e:
        await logger.log_error(
            request=request,
            message=f"Feature: Verification: Unexpected error during token verification: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify access token",
        )


def validate_role_and_permission(db, current_user: dict, allowed_roles: list[str], resource_owner_id: int | None = None):
    """
    Validates that the authenticated current_user:
    1. Has a valid session and role (401 if missing).
    2. Has a role contained in allowed_roles (403 if disallowed).
    3. Has ownership or belonging to the resource represented by resource_owner_id (403 if forbidden).
    """
    if not current_user or "role" not in current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided or are invalid."
        )

    role = current_user.get("role")
    if role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: Role '{role}' is not allowed to perform this operation."
        )

    if resource_owner_id is not None:
        user_id = current_user.get("id")

        try:
            user_id_int = int(user_id) if user_id is not None else None
        except (ValueError, TypeError):
            user_id_int = user_id

        try:
            resource_owner_id_int = int(resource_owner_id) if resource_owner_id is not None else None
        except (ValueError, TypeError):
            resource_owner_id_int = resource_owner_id

        if role == "admin" or role == "club_admin":
            # For backward compatibility, both "admin" and "club_admin" are allowed
            if user_id_int != resource_owner_id_int:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: You do not own this resource."
                )
        elif role == "team_member":
            # Check if member belongs to a group owned by resource_owner_id
            member = db.fetch_one("SELECT group_id FROM members WHERE id = %s", (user_id_int,))
            if not member:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: Member profile not found."
                )
            group = db.fetch_one("SELECT owner_id FROM groups WHERE id = %s", (member.get("group_id"),))
            if not group:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: Member is not assigned to any group."
                )

            try:
                group_owner_id = int(group.get("owner_id"))
            except (ValueError, TypeError):
                group_owner_id = group.get("owner_id")

            if group_owner_id != resource_owner_id_int:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: You do not belong to this club."
                )
        elif role == "venue_owner":
            if user_id_int != resource_owner_id_int:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: You do not own this venue resource."
                )
        elif role == "user":
            if user_id_int != resource_owner_id_int:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: You do not own this user resource."
                )

