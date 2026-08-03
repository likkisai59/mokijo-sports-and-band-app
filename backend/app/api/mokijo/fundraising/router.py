from fastapi import APIRouter, Depends, Request
from typing import List

from app.models import schemas
from app.api.mokijo.fundraising import service
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.mokijo.fundraising.service import CompleteDonationRequest
from app.auth.authorization import check_user_authorization

router = APIRouter()

@router.get("/fundraising", response_model=List[schemas.FundraisingCampaignResponse], summary="Retrieve all fundraising campaigns created by the club administrator.", tags=["Fundraising"])
async def get_campaigns(
    request: Request,
    owner_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_campaigns(request, db, owner_id, current_user)

@router.post("/fundraising", response_model=schemas.FundraisingCampaignResponse, summary="Create a new fundraising campaign with a target goal and deadline.", tags=["Fundraising"])
async def create_campaign(
    request: Request,
    campaign: schemas.FundraisingCampaignCreate,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.create_campaign(request, db, campaign, current_user)

@router.delete("/fundraising/{campaign_id}", summary="Delete a specific fundraising campaign.", tags=["Fundraising"])
async def delete_campaign(
    request: Request,
    campaign_id: int,
    owner_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.delete_campaign(request, db, campaign_id, owner_id, current_user)

@router.post("/fundraising/{campaign_id}/initiate-donation", summary="Initiate an online donation payment request for a fundraising campaign.", tags=["Fundraising"])
async def initiate_donation(
    request: Request,
    campaign_id: int,
    donation: schemas.DonationCreate,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.initiate_donation(request, db, campaign_id, donation, current_user)

@router.post("/fundraising/{campaign_id}/complete-donation", summary="Complete and record a campaign donation after validating the payment status.", tags=["Fundraising"])
async def complete_donation(
    request: Request,
    campaign_id: int,
    req: CompleteDonationRequest,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.complete_donation(request, db, campaign_id, req, current_user)
