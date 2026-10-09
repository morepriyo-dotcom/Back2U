import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class RequestToBuy(Base):
    __tablename__ = "requests_to_buy"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    offer_amount = Column(Float, nullable=False) # e.g. offered points or currency
    currency_type = Column(String(20), default="POINTS") # 'POINTS' or 'USD'
    message = Column(Text, nullable=False)
    
    # Status: PENDING, ACCEPTED, REJECTED, COMPLETED, CANCELLED
    status = Column(String(50), default="PENDING", nullable=False)
    finder_response = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    item = relationship("Item", back_populates="requests_to_buy")
    requester = relationship("User")

class AuctionListing(Base):
    __tablename__ = "auction_listings"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    starting_points = Column(Integer, default=50)
    current_bid_points = Column(Integer, default=50)
    current_highest_bidder_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Unclaimed item resolution workflow
    resolution_type = Column(String(50), default="AUCTION") # 'AUCTION', 'DONATION', 'RETURN_TO_FINDER', 'POLICE_TRANSFER'
    admin_approved = Column(Boolean, default=False)
    status = Column(String(50), default="ACTIVE") # 'ACTIVE', 'COMPLETED', 'EXPIRED'
    
    end_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    item = relationship("Item")
    highest_bidder = relationship("User", foreign_keys=[current_highest_bidder_id])
