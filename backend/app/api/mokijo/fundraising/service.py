from fastapi import APIRouter, Depends, Request, HTTPException, status
from typing import List
from pydantic import BaseModel

from app.models import schemas
from sqlalchemy.orm import Session
from app.auth.authorization import check_user_authorization, validate_role_and_permission
from app.logger import logger


class CompleteDonationRequest(BaseModel):
    payment_id: int
    owner_id: int



from app.api.mokijo.fundraising import crud

async def get_campaigns(request: Request, db: Session, owner_id: int, current_user: dict):
    try:
        with logger.time_operation("GET_CAMPAIGNS", request=request):
            validate_role_and_permission(db, current_user, ["admin", "club_admin", "team_member", "user", "member", "club_member"], owner_id)
            campaigns = crud.get_campaigns_by_owner(db, owner_id)
            return campaigns
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to get campaigns: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def create_campaign(request: Request, db: Session, campaign: schemas.FundraisingCampaignCreate, current_user: dict):
    try:
        with logger.time_operation("CREATE_CAMPAIGN", request=request):
            validate_role_and_permission(db, current_user, ["admin", "club_admin", "team_member"], campaign.owner_id)
            insert_data = {
                "owner_id": campaign.owner_id,
                "title": campaign.title,
                "description": campaign.description,
                "goal": campaign.goal,
                "raised": 0,
                "deadline": campaign.deadline,
                "group_name": campaign.group_name,
                "status": "active",
                "donors_count": 0
            }
            campaign_id = crud.create_campaign(db, insert_data)
            new_campaign = crud.get_campaign_by_id(db, campaign_id)
            return new_campaign
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to create campaign: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def delete_campaign(request: Request, db: Session, campaign_id: int, owner_id: int, current_user: dict):
    try:
        with logger.time_operation("DELETE_CAMPAIGN", request=request):
            validate_role_and_permission(db, current_user, ["admin", "club_admin"], owner_id)
            campaign = crud.get_campaign_by_id_and_owner(db, campaign_id, owner_id)
            if not campaign:
                raise HTTPException(status_code=404, detail="Campaign not found")
            
            crud.delete_campaign(db, campaign_id, owner_id)
            return {"message": "Campaign deleted successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to delete campaign: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def record_donation(request: Request, db: Session, campaign_id: int, donation: schemas.DonationCreate, current_user: dict):
    try:
        with logger.time_operation("RECORD_DONATION", request=request):
            validate_role_and_permission(db, current_user, ["admin", "team_member", "user"])
            campaign = crud.get_campaign_by_id(db, campaign_id)
            if not campaign:
                raise HTTPException(status_code=404, detail="Campaign not found")
            
            new_raised = (campaign.get("raised") or 0) + donation.amount
            new_donors = (campaign.get("donors_count") or 0) + 1
            
            crud.update_campaign_stats(db, campaign_id, new_raised, new_donors)
            
            updated = crud.get_campaign_by_id(db, campaign_id)
            return updated
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to record donation: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def initiate_donation(request: Request, db: Session, campaign_id: int, donation: schemas.DonationCreate, current_user: dict):
    try:
        with logger.time_operation("INITIATE_DONATION", request=request):
            validate_role_and_permission(db, current_user, ["admin", "team_member", "user"])
            campaign = crud.get_campaign_by_id(db, campaign_id)
            if not campaign:
                raise HTTPException(status_code=404, detail="Campaign not found")
            
            member_id = None
            group_id = donation.group_id
            if donation.donor_email:
                try:
                    email_clean = donation.donor_email.replace(" ", "").lower()
                    member = crud.get_member_by_email(db, email_clean)
                    if member:
                        member_id = member.get("id")
                        if not group_id:
                            group_id = member.get("group_id")
                except Exception:
                    pass

            insert_data = {
                "owner_id": campaign.get("owner_id"),
                "group_id": group_id,
                "member_id": member_id,
                "title": f"Donation to: {campaign.get('title')}",
                "description": f"campaign_id:{campaign_id}|donor_name:{donation.donor_name}|donor_email:{donation.donor_email or ''}",
                "category": "Donation",
                "amount": donation.amount,
                "status": "pending"
            }
            
            payment_id = crud.create_payment(db, insert_data)
            return {"payment_id": payment_id, "owner_id": campaign.get("owner_id")}
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to initiate donation: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def complete_donation(request: Request, db: Session, campaign_id: int, req: CompleteDonationRequest, current_user: dict):
    try:
        with logger.time_operation("COMPLETE_DONATION", request=request):
            validate_role_and_permission(db, current_user, ["admin", "team_member", "user"])
            campaign = crud.get_campaign_by_id(db, campaign_id)
            if not campaign:
                raise HTTPException(status_code=404, detail="Campaign not found")
            
            payment = crud.get_payment_by_id_and_owner(db, req.payment_id, req.owner_id)
            if not payment:
                raise HTTPException(status_code=404, detail="Donation payment record not found")
            
            if payment.get("status") != "paid":
                raise HTTPException(status_code=400, detail="Donation payment has not been successfully completed yet")
            
            desc = payment.get("description") or ""
            if "completed_donation:true" in desc:
                return {"message": "Donation already completed and recorded", "campaign": campaign}
            
            new_raised = (campaign.get("raised") or 0) + (payment.get("amount") or 0)
            new_donors = (campaign.get("donors_count") or 0) + 1
            new_desc = f"{desc}|completed_donation:true"
            
            crud.update_campaign_stats(db, campaign_id, new_raised, new_donors)
            crud.update_payment_description(db, req.payment_id, new_desc)
            
            updated_campaign = crud.get_campaign_by_id(db, campaign_id)
            return {"message": "Donation recorded successfully!", "campaign": updated_campaign}
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to complete donation: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
