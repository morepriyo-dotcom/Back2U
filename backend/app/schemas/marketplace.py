import datetime
from pydantic import BaseModel
from typing import Optional

class RequestToBuyCreate(BaseModel):
    item_id: int
    offer_amount: float
    currency_type: str = "POINTS" # 'POINTS' or 'USD'
    message: str

class RequestToBuyResponse(BaseModel):
    id: int
    item_id: int
    requester_id: int
    requester_name: Optional[str] = None
    offer_amount: float
    currency_type: str
    message: str
    status: str # 'PENDING', 'ACCEPTED', 'REJECTED'
    finder_response: Optional[str] = None
    created_at: datetime.datetime
    
    # Item summary
    item_title: Optional[str] = None
    item_image_url: Optional[str] = None

    class Config:
        from_attributes = True

class AuctionListingResponse(BaseModel):
    id: int
    item_id: int
    item_title: str
    item_category: str
    item_image_url: Optional[str] = None
    starting_points: int
    current_bid_points: int
    current_highest_bidder_id: Optional[int] = None
    resolution_type: str
    admin_approved: bool
    status: str
    end_date: datetime.datetime
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class BidCreate(BaseModel):
    bid_points: int
