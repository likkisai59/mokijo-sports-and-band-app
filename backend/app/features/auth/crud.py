"""
Database CRUD repository operations for Users, Roles, Permissions, Permission Groups, and Refresh Tokens.
Inherits standard helpers from BaseRepository.
"""

from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.common.repositories.base import BaseRepository
from app.features.auth.models import User, Role, Permission, RefreshToken, PermissionGroup


class UserCRUD(BaseRepository[User]):
    """Repository operations for User entities."""
    
    def __init__(self):
        super().__init__(User)

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        """Fetch active user by email."""
        return db.query(User).filter(
            User.email == email,
            User.deleted_at.is_(None)
        ).first()

    def get_filtered_users(
        self,
        db: Session,
        search: Optional[str] = None,
        role_name: Optional[str] = None,
        is_active: Optional[bool] = None,
        limit: int = 10,
        offset: int = 0
    ) -> tuple[list[User], int]:
        """Fetch paginated, filtered user listings and total count records."""
        query = db.query(User).filter(User.deleted_at.is_(None))
        
        if search:
            query = query.filter(
                (User.name.ilike(f"%{search}%")) | 
                (User.email.ilike(f"%{search}%"))
            )
            
        if is_active is not None:
            query = query.filter(User.is_active == is_active)
            
        if role_name:
            query = query.join(User.roles).filter(Role.name == role_name)
            
        total_count = query.count()
        results = query.offset(offset).limit(limit).all()
        return results, total_count


class RoleCRUD(BaseRepository[Role]):
    """Repository operations for Role entities."""
    
    def __init__(self):
        super().__init__(Role)

    def get_by_name(self, db: Session, name: str) -> Optional[Role]:
        """Fetch role by unique name."""
        return db.query(Role).filter(Role.name == name).first()


class PermissionGroupCRUD(BaseRepository[PermissionGroup]):
    """Repository operations for Permission Groups."""

    def __init__(self):
        super().__init__(PermissionGroup)

    def get_by_name(self, db: Session, name: str) -> Optional[PermissionGroup]:
        """Fetch group by unique name."""
        return db.query(PermissionGroup).filter(PermissionGroup.name == name).first()


class PermissionCRUD(BaseRepository[Permission]):
    """Repository operations for Permission entities."""
    
    def __init__(self):
        super().__init__(Permission)

    def get_by_name(self, db: Session, name: str) -> Optional[Permission]:
        """Fetch permission by unique name."""
        return db.query(Permission).filter(Permission.name == name).first()


class RefreshTokenCRUD(BaseRepository[RefreshToken]):
    """Repository operations for session RefreshToken entities."""
    
    def __init__(self):
        super().__init__(RefreshToken)

    def get_by_hash(self, db: Session, token_hash: str) -> Optional[RefreshToken]:
        """Fetch active refresh token by hash value."""
        return db.query(RefreshToken).filter(
            RefreshToken.token_hash == token_hash,
            RefreshToken.is_revoked.is_(False)
        ).first()

    def revoke_user_tokens(self, db: Session, user_id: UUID) -> None:
        """Revoke all tokens associated with a user ID."""
        db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id,
            RefreshToken.is_revoked.is_(False)
        ).update({"is_revoked": True}, synchronize_session=False)
        db.commit()
