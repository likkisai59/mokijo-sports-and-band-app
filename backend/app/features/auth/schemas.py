from typing import List, Optional
from uuid import UUID
from pydantic import EmailStr, Field, field_validator
from app.common.schemas.base import BaseSchema
from app.utils.validators import validate_password_strength

class PermissionResponse(BaseSchema):
    id: UUID
    name: str
    description: Optional[str] = None

class RoleResponse(BaseSchema):
    id: UUID
    name: str
    description: Optional[str] = None
    permissions: List[PermissionResponse] = []

class UserRegister(BaseSchema):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must meet complexity requirements")
    name: str = Field(..., min_length=2, max_length=150)
    role_name: str = Field(..., description="Role to assign: client, artist, or venue_owner")

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        """Enforce MASTER.md §9.5 password complexity policy on all auth registrations."""
        return validate_password_strength(v)

    @field_validator("role_name")
    @classmethod
    def role_must_be_public(cls, v: str) -> str:
        """Admin accounts are not publicly registerable (AGENTS.md Registration Rules)."""
        if v == "admin":
            raise ValueError("Admin registration via public endpoint is not permitted.")
        return v

class UserLogin(BaseSchema):
    email: EmailStr
    password: str

class TokenResponse(BaseSchema):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"

class RefreshTokenRequest(BaseSchema):
    refresh_token: str

class ForgotPasswordRequest(BaseSchema):
    email: EmailStr

class ResetPasswordRequest(BaseSchema):
    token: str
    new_password: str = Field(..., min_length=8)

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        """Enforce password complexity on password resets."""
        return validate_password_strength(v)


class ChangePasswordRequest(BaseSchema):
    old_password: str
    new_password: str = Field(..., min_length=8)

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        """Enforce password complexity on password changes."""
        return validate_password_strength(v)


class UserResponse(BaseSchema):
    id: UUID
    email: EmailStr
    name: str
    is_active: bool
    is_verified: bool
    roles: List[RoleResponse] = []

class UserStatusUpdate(BaseSchema):
    is_active: bool

class BulkStatusUpdate(BaseSchema):
    user_ids: List[UUID]
    is_active: bool

class PaginatedUserList(BaseSchema):
    items: List[UserResponse]
    total: int


class VerifyEmailRequest(BaseSchema):
    token: str


class ResendVerificationRequest(BaseSchema):
    email: EmailStr
