import datetime
from pydantic import BaseModel
from typing import Optional

class PointTransactionResponse(BaseModel):
    id: int
    user_id: int
    amount: int
    transaction_type: str
    description: str
    related_item_id: Optional[int] = None
    related_claim_id: Optional[int] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class RewardsSummaryResponse(BaseModel):
    points_balance: int
    trust_score: int
    penalty_points: int
    tier_name: str # 'Bronze Helper', 'Silver Finder', 'Gold Guardian', 'Platinum Legend'
    total_items_returned: int
    total_items_reported: int
