"""
API endpoints for system categories.
Provides public read interfaces and admin-only management routes.
"""

from typing import Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_admin
from app.features.categories.schemas import (
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,
    PaginatedCategoryList
)
from app.features.categories.service import CategoryService
from app.features.categories.crud import CategoryCRUD
from app.common.schemas.base import SuccessResponse

router = APIRouter()
service = CategoryService()
crud = CategoryCRUD()


@router.get(
    "",
    response_model=SuccessResponse[PaginatedCategoryList],
    status_code=status.HTTP_200_OK,
    summary="List all categories with filters"
)
async def list_categories(
    search: Optional[str] = Query(None, description="Search name or description"),
    type: Optional[str] = Query(None, description="Filter category type: music_genre, language, etc."),
    is_active: Optional[bool] = Query(None, description="Filter active status"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Publicly accessible endpoint to retrieve categories list.
    Useful for landing search drop-downs or registration tags.
    """
    categories, total = crud.get_filtered_categories(
        db, search=search, type_filter=type, is_active=is_active, limit=limit, offset=offset
    )
    
    # Format datetime response object fields
    response_items = []
    for cat in categories:
        response_items.append(
            CategoryResponse(
                id=cat.id,
                name=cat.name,
                type=cat.type,
                description=cat.description,
                is_active=cat.is_active,
                created_at=cat.created_at.isoformat()
            )
        )

    return SuccessResponse(
        success=True,
        data=PaginatedCategoryList(items=response_items, total=total),
        message="Categories list retrieved successfully."
    )


@router.post(
    "",
    response_model=SuccessResponse[CategoryResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create a new category"
)
async def create_category(
    data: CategoryCreate,
    current_admin_claims: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only endpoint to add a new category taxonomy."""
    cat = service.create_category(db, data)
    return SuccessResponse(
        success=True,
        data=CategoryResponse(
            id=cat.id,
            name=cat.name,
            type=cat.type,
            description=cat.description,
            is_active=cat.is_active,
            created_at=cat.created_at.isoformat()
        ),
        message="Category successfully created."
    )


@router.put(
    "/{category_id}",
    response_model=SuccessResponse[CategoryResponse],
    status_code=status.HTTP_200_OK,
    summary="Update a category taxonomy"
)
async def update_category(
    category_id: str,
    data: CategoryUpdate,
    current_admin_claims: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only endpoint to update an existing category details."""
    cat = service.update_category(db, category_id, data)
    return SuccessResponse(
        success=True,
        data=CategoryResponse(
            id=cat.id,
            name=cat.name,
            type=cat.type,
            description=cat.description,
            is_active=cat.is_active,
            created_at=cat.created_at.isoformat()
        ),
        message="Category successfully updated."
    )


@router.delete(
    "/{category_id}",
    response_model=SuccessResponse[None],
    status_code=status.HTTP_200_OK,
    summary="Soft-delete a category"
)
async def delete_category(
    category_id: str,
    current_admin_claims: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only endpoint to soft-delete a category taxonomy."""
    service.soft_delete_category(db, category_id)
    return SuccessResponse(
        success=True,
        data=None,
        message="Category successfully soft-deleted."
    )
