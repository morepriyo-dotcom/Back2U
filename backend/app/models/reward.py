import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class PointTransaction(Base):
    __tablename__ = "point_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Integer, nullable=False) # e.g. +50, +150, -10
    
    # Types: FOUND_REPORT_REWARD, RETURN_COMPLETED_REWARD, VERIFIED_INFO_REWARD,
    # PENALTY_DEDUCTION, AUCTION_PURCHASE, REWARD_REDEMPTION
    transaction_type = Column(String(50), nullable=False)
    description = Column(String(255), nullable=False)
    related_item_id = Column(Integer, nullable=True)
    related_claim_id = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="point_transactions")
