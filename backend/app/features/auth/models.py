"""
Database models for Authentication and RBAC features.
Maps users, roles, permissions, permission groups, junctions, and refresh tokens.
"""

from datetime import datetime
from sqlalchemy import Column, String, Boolean, ForeignKey, Table, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.common.models.base import BaseModel
from app.core.database import Base

# Junction table for User many-to-many Roles
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", UUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
)

# Junction table for Role many-to-many Permissions
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", UUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", UUID(as_uuid=True), ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)


class PermissionGroup(BaseModel):
    """Groups of related permissions for granular administrative categorization."""
    __tablename__ = "permission_groups"

    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)

    permissions = relationship("Permission", back_populates="group", cascade="all, delete-orphan")


class Permission(BaseModel):
    """Permissions system tokens (e.g. 'booking:create', 'artist:write')."""
    __tablename__ = "permissions"
    
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)
    group_id = Column(UUID(as_uuid=True), ForeignKey("permission_groups.id", ondelete="SET NULL"), nullable=True, index=True)

    group = relationship("PermissionGroup", back_populates="permissions")


class Role(BaseModel):
    """System roles (e.g. 'admin', 'client', 'artist', 'venue_owner')."""
    __tablename__ = "roles"

    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)
    
    permissions = relationship("Permission", secondary=role_permissions, backref="roles")


class User(BaseModel):
    """Main User credentials entity."""
    __tablename__ = "users"

    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(150), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    last_verification_sent_at = Column(DateTime(timezone=True), nullable=True)
    last_seen = Column(DateTime(timezone=True), nullable=True, default=None)
    
    roles = relationship("Role", secondary=user_roles, backref="users")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")


class RefreshToken(BaseModel):
    """Entity storing persistent JWT refresh tokens for secure session revocation."""
    __tablename__ = "refresh_tokens"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(255), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="refresh_tokens")

    @property
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at.replace(tzinfo=None)
