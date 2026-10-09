import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String(128), unique=True, index=True, nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    phone_number = Column(String(20), unique=True, index=True, nullable=True)
    is_phone_verified = Column(Boolean, default=False)
    is_email_verified = Column(Boolean, default=False)
    hashed_password = Column(String(255), nullable=True)
    full_name = Column(String(150), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    role = Column(String(50), default="user") # 'visitor', 'user', 'admin'
    
    # Trust & Reputation metrics
    trust_score = Column(Integer, default=100) # Starts at 100
    penalty_points = Column(Integer, default=0) # Starts at 0
    points_balance = Column(Integer, default=100) # Back2U Points
    
    is_active = Column(Boolean, default=True)
    is_restricted = Column(Boolean, default=False)
    restriction_reason = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    items = relationship("Item", back_populates="reporter", cascade="all, delete-orphan")
    claims = relationship("Claim", back_populates="claimant", foreign_keys="Claim.claimant_id")
    point_transactions = relationship("PointTransaction", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
