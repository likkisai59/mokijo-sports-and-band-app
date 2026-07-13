from fastapi import APIRouter, Depends, Request, HTTPException, status
from typing import List
from pydantic import BaseModel

from app.models import schemas
from app.connectors.connection_service import ConnectionService
from app.auth.authorization import check_user_authorization
from app.logger import logger


class CompleteDonationRequest(BaseModel):
    payment_id: int
    owner_id: int


class FundraisingRouting(ConnectionService):
    def __init__(self) -> None:
        super().__init__()
        
        self.router.add_api_route(
            path="/fundraising",
            endpoint=self.get_campaigns,
            methods=["GET"],
            response_model=List[schemas.FundraisingCampaignResponse],
            summary="Retrieve all fundraising campaigns created by the club administrator.",
            tags=["Fundraising"]
        )
        self.router.add_api_route(
            path="/fundraising",
            endpoint=self.create_campaign,
            methods=["POST"],
            response_model=schemas.FundraisingCampaignResponse,
            summary="Create a new fundraising campaign with a target goal and deadline.",
            tags=["Fundraising"]
        )
        self.router.add_api_route(
            path="/fundraising/{campaign_id}",
            endpoint=self.delete_campaign,
            methods=["DELETE"],
            summary="Delete a specific fundraising campaign.",
            tags=["Fundraising"]
        )
        self.router.add_api_route(
            path="/fundraising/{campaign_id}/donate",
            endpoint=self.record_donation,
            methods=["POST"],
            response_model=schemas.FundraisingCampaignResponse,
            summary="Record a standard off-line or test donation directly increasing the campaign's raised amount.",
            tags=["Fundraising"]
        )
        self.router.add_api_route(
            path="/fundraising/{campaign_id}/initiate-donation",
            endpoint=self.initiate_donation,
            methods=["POST"],
            summary="Initiate an online donation payment request for a fundraising campaign.",
            tags=["Fundraising"]
        )
        self.router.add_api_route(
            path="/fundraising/{campaign_id}/complete-donation",
            endpoint=self.complete_donation,
            methods=["POST"],
            summary="Complete and record a campaign donation after validating the payment status.",
            tags=["Fundraising"]
        )

    async def get_campaigns(
        self,
        request: Request,
        owner_id: int,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Get campaigns router start", step="ROUTER_START", user_info=current_user)
        logic = FundraisingLogic()
        return await logic.get_campaigns(request, owner_id, current_user)

    async def create_campaign(
        self,
        request: Request,
        campaign: schemas.FundraisingCampaignCreate,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Create campaign router start", step="ROUTER_START", user_info=current_user)
        logic = FundraisingLogic()
        return await logic.create_campaign(request, campaign, current_user)

    async def delete_campaign(
        self,
        request: Request,
        campaign_id: int,
        owner_id: int,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Delete campaign router start", step="ROUTER_START", user_info=current_user)
        logic = FundraisingLogic()
        return await logic.delete_campaign(request, campaign_id, owner_id, current_user)

    async def record_donation(
        self,
        request: Request,
        campaign_id: int,
        donation: schemas.DonationCreate,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Record donation router start", step="ROUTER_START", user_info=current_user)
        logic = FundraisingLogic()
        return await logic.record_donation(request, campaign_id, donation, current_user)

    async def initiate_donation(
        self,
        request: Request,
        campaign_id: int,
        donation: schemas.DonationCreate,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Initiate donation router start", step="ROUTER_START", user_info=current_user)
        logic = FundraisingLogic()
        return await logic.initiate_donation(request, campaign_id, donation, current_user)

    async def complete_donation(
        self,
        request: Request,
        campaign_id: int,
        req: CompleteDonationRequest,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Complete donation router start", step="ROUTER_START", user_info=current_user)
        logic = FundraisingLogic()
        return await logic.complete_donation(request, campaign_id, req, current_user)


class FundraisingLogic(ConnectionService):
    def __init__(self) -> None:
        super().__init__()
        logger.log_message_sync(message="FundraisingLogic instance created")

    async def get_campaigns(self, request: Request, owner_id: int, current_user: dict):
        try:
            with logger.time_operation("GET_CAMPAIGNS", request=request):
                db = self.db_driver
                campaigns = db.fetch_all(
                    "SELECT * FROM fundraising_campaigns WHERE owner_id = %s",
                    (owner_id,)
                )
                return campaigns
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to get campaigns: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def create_campaign(self, request: Request, campaign: schemas.FundraisingCampaignCreate, current_user: dict):
        try:
            with logger.time_operation("CREATE_CAMPAIGN", request=request):
                db = self.db_driver
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
                campaign_id = db.insert("fundraising_campaigns", insert_data)
                new_campaign = db.fetch_one("SELECT * FROM fundraising_campaigns WHERE id = %s", (campaign_id,))
                return new_campaign
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to create campaign: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def delete_campaign(self, request: Request, campaign_id: int, owner_id: int, current_user: dict):
        try:
            with logger.time_operation("DELETE_CAMPAIGN", request=request):
                db = self.db_driver
                campaign = db.fetch_one(
                    "SELECT * FROM fundraising_campaigns WHERE id = %s AND owner_id = %s",
                    (campaign_id, owner_id)
                )
                if not campaign:
                    raise HTTPException(status_code=404, detail="Campaign not found")
                
                db.execute_query(
                    "DELETE FROM fundraising_campaigns WHERE id = %s AND owner_id = %s",
                    (campaign_id, owner_id)
                )
                return {"message": "Campaign deleted successfully"}
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to delete campaign: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def record_donation(self, request: Request, campaign_id: int, donation: schemas.DonationCreate, current_user: dict):
        try:
            with logger.time_operation("RECORD_DONATION", request=request):
                db = self.db_driver
                campaign = db.fetch_one(
                    "SELECT * FROM fundraising_campaigns WHERE id = %s",
                    (campaign_id,)
                )
                if not campaign:
                    raise HTTPException(status_code=404, detail="Campaign not found")
                
                new_raised = (campaign.get("raised") or 0) + donation.amount
                new_donors = (campaign.get("donors_count") or 0) + 1
                
                db.execute_query(
                    "UPDATE fundraising_campaigns SET raised = %s, donors_count = %s WHERE id = %s",
                    (new_raised, new_donors, campaign_id)
                )
                
                updated = db.fetch_one("SELECT * FROM fundraising_campaigns WHERE id = %s", (campaign_id,))
                return updated
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to record donation: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def initiate_donation(self, request: Request, campaign_id: int, donation: schemas.DonationCreate, current_user: dict):
        try:
            with logger.time_operation("INITIATE_DONATION", request=request):
                db = self.db_driver
                campaign = db.fetch_one(
                    "SELECT * FROM fundraising_campaigns WHERE id = %s",
                    (campaign_id,)
                )
                if not campaign:
                    raise HTTPException(status_code=404, detail="Campaign not found")
                
                insert_data = {
                    "owner_id": campaign.get("owner_id"),
                    "title": f"Donation to: {campaign.get('title')}",
                    "description": f"campaign_id:{campaign_id}|donor_name:{donation.donor_name}|donor_email:{donation.donor_email or ''}",
                    "category": "Donation",
                    "amount": donation.amount,
                    "status": "pending"
                }
                
                payment_id = db.insert("payments", insert_data)
                return {"payment_id": payment_id, "owner_id": campaign.get("owner_id")}
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to initiate donation: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def complete_donation(self, request: Request, campaign_id: int, req: CompleteDonationRequest, current_user: dict):
        try:
            with logger.time_operation("COMPLETE_DONATION", request=request):
                db = self.db_driver
                campaign = db.fetch_one(
                    "SELECT * FROM fundraising_campaigns WHERE id = %s",
                    (campaign_id,)
                )
                if not campaign:
                    raise HTTPException(status_code=404, detail="Campaign not found")
                
                payment = db.fetch_one(
                    "SELECT * FROM payments WHERE id = %s AND owner_id = %s",
                    (req.payment_id, req.owner_id)
                )
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
                
                db.execute_query(
                    "UPDATE fundraising_campaigns SET raised = %s, donors_count = %s WHERE id = %s",
                    (new_raised, new_donors, campaign_id)
                )
                db.execute_query(
                    "UPDATE payments SET description = %s WHERE id = %s",
                    (new_desc, req.payment_id)
                )
                
                updated_campaign = db.fetch_one("SELECT * FROM fundraising_campaigns WHERE id = %s", (campaign_id,))
                return {"message": "Donation recorded successfully!", "campaign": updated_campaign}
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to complete donation: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
