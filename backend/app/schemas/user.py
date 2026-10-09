import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    full_name: str
    avatar_url: Optional[str] = None

class UserCreate(BaseModel):
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    full_name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class SendOTPRequest(BaseModel):
    phone_number: str # e.g. "+919876543210" or "9876543210"

class VerifyOTPRequest(BaseModel):
    phone_number: str
    otp_code: str # 6-digit code
    full_name: Optional[str] = None

class OTPResponse(BaseModel):
    message: str
    phone_number: str
    expires_in_seconds: int
    dev_sms_simulation: Optional[str] = None

class DemoLoginRequest(BaseModel):
    role: str # 'admin', 'user', 'finder', 'owner'

class FirebaseLoginRequest(BaseModel):
    id_token: str

class UserResponse(BaseModel):
    id: int
    email: Optional[str] = None
    phone_number: Optional[str] = None
    is_phone_verified: bool = False
    is_email_verified: bool = False
    full_name: str
    avatar_url: Optional[str] = None
    role: str
    trust_score: int
    penalty_points: int
    points_balance: int
    is_active: bool
    is_restricted: bool
    restriction_reason: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
