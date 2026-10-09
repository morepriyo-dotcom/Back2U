import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Back2U API"
    APP_ENV: str = "development"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./back2u.db")
    
    # JWT & Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "back2u_super_secret_jwt_key_2026_hackathon_secure")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Firebase (Optional credentials path for production token verification)
    FIREBASE_CREDENTIALS_PATH: str = os.getenv("FIREBASE_CREDENTIALS_PATH", "")
    
    # Storage
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    
    # AI Matching Engine Default Engineering Weights
    WEIGHT_IMAGE: float = 0.40
    WEIGHT_TEXT: float = 0.35
    WEIGHT_LOCATION: float = 0.15
    WEIGHT_DATE: float = 0.10
    
    # Trust Score Settings
    INITIAL_TRUST_SCORE: int = 100
    POINTS_FOUND_REPORT: int = 50
    POINTS_RECOVERY_CONFIRMED: int = 150
    PENALTY_SUSPICIOUS_CLAIM: int = 5
    PENALTY_FALSE_CLAIM: int = 10
    PENALTY_FRAUDULENT_CLAIM: int = 25

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
