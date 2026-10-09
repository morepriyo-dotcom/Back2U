import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class DemoLoginRequest(BaseModel):
    role: str # 'admin', 'user', 'finder', 'owner'

class UserResponse(UserBase):
    id: int
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
