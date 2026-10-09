import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.database import Base

class PhoneOTP(Base):
    __tablename__ = "phone_otps"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String(20), index=True, nullable=False)
    otp_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    attempts = Column(Integer, default=0)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
