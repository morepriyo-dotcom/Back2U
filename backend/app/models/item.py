import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    report_type = Column(String(20), nullable=False) # 'LOST' or 'FOUND'
    title = Column(String(200), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=False)
    
    # Official Government Lost Report Reference (LR Number)
    lr_number = Column(String(50), unique=True, index=True, nullable=True) # e.g. 'B2U-LR-2026-98124'
    is_govt_id = Column(Boolean, default=False)
    govt_id_type = Column(String(50), nullable=True) # 'Aadhaar', 'PAN', 'Passport', 'Driving License', 'Student ID', etc.
    masked_identifier = Column(String(100), nullable=True) # Masked e.g. 'XXXX-XXXX-4912'
    
    # Location & Date
    location_name = Column(String(200), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    incident_date = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    
    # Media & Details
    image_url = Column(String(500), nullable=True)
    brand = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)
    
    # Private / Anti-Fraud Evidence (Hidden from public & other users!)
    # E.g. "Engraving on back says 'RK 2023'", "Secret pocket contains library card #482", "Scratch on bottom right corner"
    private_clues = Column(Text, nullable=True)
    
    # Custody & Workflow status
    custody_status = Column(String(50), default="IN_POSSESSION") # 'IN_POSSESSION', 'SECURITY_DESK', 'POLICE', 'CAMPUS_OFFICE'
    status = Column(String(50), default="REPORTED") 
    # 'REPORTED', 'UNDER_CLAIM', 'RECOVERY_IN_PROGRESS', 'RETURNED', 'UNCLAIMED_EXPIRING', 'UNCLAIMED_AUCTION', 'UNCLAIMED_DONATED', 'CLOSED'
    
    # AI Embeddings stored as serialized vector representations
    text_embedding = Column(Text, nullable=True) # JSON serialized float array
    image_embedding = Column(Text, nullable=True) # JSON serialized float array
    
    # Flags & Metadata
    is_flagged = Column(Boolean, default=False)
    flag_reason = Column(String(255), nullable=True)
    is_demo_seed = Column(Boolean, default=False) # Clearly distinguish demo items
    
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    reporter = relationship("User", back_populates="items")
    claims = relationship("Claim", back_populates="item", cascade="all, delete-orphan")
    requests_to_buy = relationship("RequestToBuy", back_populates="item", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_items_report_status_date", "report_type", "status", "incident_date"),
        Index("idx_items_category_type", "category", "report_type"),
        Index("idx_items_reporter", "reporter_id"),
        Index("idx_items_flagged_status", "is_flagged", "status"),
    )
