from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.common.schemas.base import BaseSchema

class TransactionResponse(BaseSchema):
    id: UUID
    booking_id: Optional[UUID] = None
    amount: float
    type: str
    status: str
    description: Optional[str] = None
    created_at: datetime


class MonthlyChartPoint(BaseSchema):
    month: str
    revenue: float


class EarningsSummaryResponse(BaseSchema):
    wallet_balance: float
    total_earnings: float
    monthly_earnings: float
    pending_payments: float
    completed_payments: float
    revenue_chart: List[MonthlyChartPoint] = []
    transactions: List[TransactionResponse] = []
