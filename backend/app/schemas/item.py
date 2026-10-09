import datetime
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class ItemBase(BaseModel):
    report_type: str # 'LOST' or 'FOUND'
    title: str
    category: str
    description: str
    location_name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    incident_date: Optional[datetime.datetime] = None
    image_url: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    custody_status: Optional[str] = "IN_POSSESSION"
    is_govt_id: Optional[bool] = False
    govt_id_type: Optional[str] = None
    masked_identifier: Optional[str] = None

class ItemCreate(ItemBase):
    private_clues: Optional[str] = None # Secret identifying marks submitted privately

class ItemUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    location_name: Optional[str] = None
    custody_status: Optional[str] = None
    status: Optional[str] = None
    private_clues: Optional[str] = None

class ItemPublicResponse(BaseModel):
    id: int
    report_type: str
    title: str
    category: str
    description: str
    location_name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    incident_date: datetime.datetime
    image_url: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    custody_status: str
    status: str
    lr_number: Optional[str] = None
    is_govt_id: bool = False
    govt_id_type: Optional[str] = None
    masked_identifier: Optional[str] = None
    is_demo_seed: bool
    created_at: datetime.datetime
    reporter_id: int

    class Config:
        from_attributes = True

class ItemDetailResponse(ItemPublicResponse):
    reporter_name: Optional[str] = None
    reporter_trust_score: Optional[int] = None
    private_clues: Optional[str] = None
    has_private_clues: bool = False

class ItemPaginatedResponse(BaseModel):
    items: List[ItemPublicResponse]
    total_count: int
    page: int
    limit: int
    total_pages: int

class OfficialCertificateResponse(BaseModel):
    lr_number: str
    item_id: int
    report_type: str
    title: str
    category: str
    description: str
    location_name: str
    incident_date: datetime.datetime
    reported_date: datetime.datetime
    reporter_name: str
    masked_identifier: Optional[str] = None
    custody_status: str
    status: str
    verification_hash: str
    legal_statutory_notice: str
    guidelines_and_next_steps: List[str]

class ItemSearchFilter(BaseModel):
    query: Optional[str] = None
    category: Optional[str] = None
    report_type: Optional[str] = None
    location: Optional[str] = None
    date_from: Optional[datetime.date] = None
    date_to: Optional[datetime.date] = None
    sort_by: Optional[str] = "recent"
    page: int = 1
    limit: int = 20
