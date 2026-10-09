import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database import Base

class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    claimant_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # State Machine:
    # SUBMITTED -> EVIDENCE_REVIEW -> MORE_EVIDENCE_REQUIRED -> MANUAL_REVIEW -> APPROVED -> HANDOVER_PENDING -> RETURN_CONFIRMED -> CLOSED
    # Or REJECTED / ESCALATED
    status = Column(String(50), default="SUBMITTED", nullable=False)
    
    # Ownership Challenge & Evidence
    challenge_answers = Column(Text, nullable=True) # Claimant's answers to distinguishing details
    evidence_photos = Column(Text, nullable=True) # JSON array of uploaded evidence image URLs
    purchase_receipt_url = Column(String(500), nullable=True)
    serial_number_provided = Column(String(100), nullable=True)
    supporting_notes = Column(Text, nullable=True)
    
    # Anti-Fraud & Risk Assessment
    risk_score = Column(Float, default=0.0) # Calculated risk (0.0 to 1.0)
    is_disputed = Column(Boolean, default=False) # When multiple claimants claim same item
    admin_notes = Column(Text, nullable=True)
    rejection_reason = Column(String(255), nullable=True)
    
    # Dual-side return confirmation
    finder_confirmed = Column(Boolean, default=False)
    owner_confirmed = Column(Boolean, default=False)
    handover_meeting_notes = Column(Text, nullable=True)
    handover_date = Column(DateTime, nullable=True)
    
    # Points awarded flag
    points_awarded = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)

    # Relationships
    item = relationship("Item", back_populates="claims")
    claimant = relationship("User", back_populates="claims", foreign_keys=[claimant_id])
