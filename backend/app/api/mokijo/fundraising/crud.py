from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import FundraisingCampaign, Payment

def to_dict(obj):
    if not obj:
        return None
    d = dict(obj.__dict__)
    d.pop('_sa_instance_state', None)
    return d

def to_dict_list(objs):
    return [to_dict(obj) for obj in objs if obj]

def create_campaign(db: Session, insert_data: dict) -> int:
    campaign = FundraisingCampaign(**insert_data)
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign.id

def get_campaign_by_id(db: Session, campaign_id: int):
    return to_dict(db.query(FundraisingCampaign).filter(FundraisingCampaign.id == campaign_id).first())

def get_campaigns_by_owner(db: Session, owner_id: int):
    return to_dict_list(db.query(FundraisingCampaign).filter(FundraisingCampaign.owner_id == owner_id).all())

def delete_campaign(db: Session, campaign_id: int, owner_id: int):
    campaign = db.query(FundraisingCampaign).filter(FundraisingCampaign.id == campaign_id, FundraisingCampaign.owner_id == owner_id).first()
    if campaign:
        db.delete(campaign)
        db.commit()

from app.models.models import Payment

def get_campaign_by_id_and_owner(db: Session, campaign_id: int, owner_id: int):
    return to_dict(db.query(FundraisingCampaign).filter(FundraisingCampaign.id == campaign_id, FundraisingCampaign.owner_id == owner_id).first())

def update_campaign_stats(db: Session, campaign_id: int, raised: float, donors_count: int):
    db.query(FundraisingCampaign).filter(FundraisingCampaign.id == campaign_id).update({"raised": raised, "donors_count": donors_count}, synchronize_session=False)
    db.commit()

def update_campaign(db: Session, campaign_id: int, update_data: dict):
    db.query(FundraisingCampaign).filter(FundraisingCampaign.id == campaign_id).update(update_data, synchronize_session=False)
    db.commit()

def get_payment_by_id_and_source(db: Session, payment_id: str, source_type: str, source_id: int):
    return to_dict(db.query(Payment).filter(Payment.id == payment_id, Payment.source_type == source_type, Payment.source_id == source_id).first())

def update_payment_status(db: Session, payment_id: str, status: str):
    db.query(Payment).filter(Payment.id == payment_id).update({"status": status}, synchronize_session=False)
    db.commit()


def create_payment(db: Session, insert_data: dict) -> int:
    payment = Payment(**insert_data)
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment.id

def get_payment_by_id_and_owner(db: Session, payment_id: int, owner_id: int):
    return to_dict(db.query(Payment).filter(Payment.id == payment_id, Payment.owner_id == owner_id).first())

def update_payment_description(db: Session, payment_id: int, description: str):
    db.query(Payment).filter(Payment.id == payment_id).update({"description": description}, synchronize_session=False)
    db.commit()

