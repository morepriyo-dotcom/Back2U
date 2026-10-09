import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    actor_email = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False) # E.g. 'CLAIM_APPROVED', 'PENALTY_APPLIED', 'ITEM_FLAGGED'
    resource_type = Column(String(50), nullable=False) # 'claim', 'item', 'user', 'reward'
    resource_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True) # JSON or descriptive string
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
