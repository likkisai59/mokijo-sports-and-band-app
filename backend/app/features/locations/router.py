"""
API routes for geographical Location Management.
Supports dropdown listings options and administrator management controls.
"""

from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_admin
from app.features.locations.schemas import (
    CountryCreate,
    CountryResponse,
    StateCreate,
    StateResponse,
    CityCreate,
    CityResponse,
    AreaCreate,
    AreaUpdate,
    AreaResponse,
    PaginatedAreaList
)
from app.features.locations.service import LocationService
from app.features.locations.crud import CountryCRUD, StateCRUD, CityCRUD, AreaCRUD
from app.common.schemas.base import SuccessResponse

router = APIRouter()
service = LocationService()

country_crud = CountryCRUD()
state_crud = StateCRUD()
city_crud = CityCRUD()
area_crud = AreaCRUD()


# ─── Public Read Endpoints ───────────────────────────────────────────────────

@router.get(
    "/countries",
    response_model=SuccessResponse[List[CountryResponse]],
    status_code=status.HTTP_200_OK,
    summary="Get all countries"
)
async def list_countries(db: Session = Depends(get_db)):
    countries, _ = country_crud.get_multi(db, limit=100)
    return SuccessResponse(success=True, data=countries, message="Countries retrieved.")


@router.get(
    "/states",
    response_model=SuccessResponse[List[StateResponse]],
    status_code=status.HTTP_200_OK,
    summary="Get states by country"
)
async def list_states(
    country_id: UUID = Query(..., description="Country UUID filter parameter"),
    db: Session = Depends(get_db)
):
    states = state_crud.get_states_by_country(db, country_id)
    return SuccessResponse(success=True, data=states, message="States retrieved.")


@router.get(
    "/cities",
    response_model=SuccessResponse[List[CityResponse]],
    status_code=status.HTTP_200_OK,
    summary="Get cities by state"
)
async def list_cities(
    state_id: UUID = Query(..., description="State UUID filter parameter"),
    db: Session = Depends(get_db)
):
    cities = city_crud.get_cities_by_state(db, state_id)
    return SuccessResponse(success=True, data=cities, message="Cities retrieved.")


@router.get(
    "/areas",
    response_model=SuccessResponse[PaginatedAreaList],
    status_code=status.HTTP_200_OK,
    summary="Get paginated areas"
)
async def list_areas(
    search: Optional[str] = Query(None, description="Search area or pincode"),
    city_id: Optional[str] = Query(None, description="City UUID filter parameter"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    areas, total = area_crud.get_filtered_areas(db, search=search, city_id=city_id, limit=limit, offset=offset)
    
    response_items = []
    for area in areas:
        response_items.append(
            AreaResponse(
                id=area.id,
                name=area.name,
                pincode=area.pincode,
                city_id=area.city_id,
                city_name=area.city.name,
                state_name=area.city.state.name,
                country_name=area.city.state.country.name,
                latitude=float(area.latitude) if area.latitude else None,
                longitude=float(area.longitude) if area.longitude else None,
                service_radius=float(area.service_radius),
                created_at=area.created_at.isoformat()
            )
        )

    return SuccessResponse(
        success=True,
        data=PaginatedAreaList(items=response_items, total=total),
        message="Areas retrieved successfully."
    )


# ─── Admin-only Write Endpoints ──────────────────────────────────────────────

@router.post(
    "/countries",
    response_model=SuccessResponse[CountryResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create a new country"
)
async def create_country(
    data: CountryCreate,
    current_admin_claims: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    country = service.create_country(db, data)
    return SuccessResponse(success=True, data=country, message="Country registered.")


@router.post(
    "/states",
    response_model=SuccessResponse[StateResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create a new state"
)
async def create_state(
    data: StateCreate,
    current_admin_claims: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    state = service.create_state(db, data)
    return SuccessResponse(success=True, data=state, message="State registered.")


@router.post(
    "/cities",
    response_model=SuccessResponse[CityResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create a new city"
)
async def create_city(
    data: CityCreate,
    current_admin_claims: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    city = service.create_city(db, data)
    return SuccessResponse(success=True, data=city, message="City registered.")


@router.post(
    "/areas",
    response_model=SuccessResponse[AreaResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create a new area"
)
async def create_area(
    data: AreaCreate,
    current_admin_claims: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    area = service.create_area(db, data)
    return SuccessResponse(
        success=True,
        data=AreaResponse(
            id=area.id,
            name=area.name,
            pincode=area.pincode,
            city_id=area.city_id,
            city_name=area.city.name,
            state_name=area.city.state.name,
            country_name=area.city.state.country.name,
            latitude=float(area.latitude) if area.latitude else None,
            longitude=float(area.longitude) if area.longitude else None,
            service_radius=float(area.service_radius),
            created_at=area.created_at.isoformat()
        ),
        message="Area successfully registered."
    )


@router.put(
    "/areas/{area_id}",
    response_model=SuccessResponse[AreaResponse],
    status_code=status.HTTP_200_OK,
    summary="Update an existing area"
)
async def update_area(
    area_id: str,
    data: AreaUpdate,
    current_admin_claims: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    area = service.update_area(db, area_id, data)
    return SuccessResponse(
        success=True,
        data=AreaResponse(
            id=area.id,
            name=area.name,
            pincode=area.pincode,
            city_id=area.city_id,
            city_name=area.city.name,
            state_name=area.city.state.name,
            country_name=area.city.state.country.name,
            latitude=float(area.latitude) if area.latitude else None,
            longitude=float(area.longitude) if area.longitude else None,
            service_radius=float(area.service_radius),
            created_at=area.created_at.isoformat()
        ),
        message="Area details updated."
    )


@router.delete(
    "/areas/{area_id}",
    response_model=SuccessResponse[None],
    status_code=status.HTTP_200_OK,
    summary="Soft-delete an area"
)
async def delete_area(
    area_id: str,
    current_admin_claims: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    service.soft_delete_area(db, area_id)
    return SuccessResponse(success=True, data=None, message="Area soft-deleted.")
