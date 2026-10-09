import datetime
from pydantic import BaseModel
from typing import Optional, List

class ClaimCreate(BaseModel):
    item_id: int
    challenge_answers: str
    evidence_photos: Optional[List[str]] = []
    purchase_receipt_url: Optional[str] = None
    serial_number_provided: Optional[str] = None
    supporting_notes: Optional[str] = None

class ClaimStatusUpdate(BaseModel):
    status: str # 'APPROVED', 'REJECTED', 'MORE_EVIDENCE_REQUIRED', 'MANUAL_REVIEW', 'ESCALATED', 'CLOSED'
    admin_notes: Optional[str] = None
    rejection_reason: Optional[str] = None

class HandoverConfirm(BaseModel):
    handover_notes: Optional[str] = None

class ClaimResponse(BaseModel):
    id: int
    item_id: int
    claimant_id: int
    status: str
    challenge_answers: Optional[str] = None
    evidence_photos: Optional[str] = None
    purchase_receipt_url: Optional[str] = None
    serial_number_provided: Optional[str] = None
    supporting_notes: Optional[str] = None
    risk_score: float
    is_disputed: bool
    admin_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    finder_confirmed: bool
    owner_confirmed: bool
    handover_meeting_notes: Optional[str] = None
    handover_date: Optional[datetime.datetime] = None
    points_awarded: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime
    closed_at: Optional[datetime.datetime] = None

    # Enriched item summary
    item_title: Optional[str] = None
    item_category: Optional[str] = None
    item_image_url: Optional[str] = None
    item_location: Optional[str] = None
    claimant_name: Optional[str] = None
    claimant_trust_score: Optional[int] = None
    finder_id: Optional[int] = None
    finder_name: Optional[str] = None

    class Config:
        from_attributes = True
