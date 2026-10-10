import os
from typing import List
from pydantic import model_validator
from pydantic_settings import BaseSettings

DEFAULT_INSECURE_SECRET = "back2u_super_secret_jwt_key_2026_hackathon_secure"

class Settings(BaseSettings):
    APP_NAME: str = "Back2U API"
    APP_ENV: str = "development" # "development", "staging", "production"
    DEBUG: bool = True
    
    # Database (PostgreSQL with pgvector recommended for production)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./back2u.db")
    
    # JWT & Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "back2u_dev_secret_key_change_in_production_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # CORS: Comma-separated list of allowed origins
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    
    # Environment feature flags
    ENABLE_DEMO_LOGIN: bool = True
    ENABLE_AUTO_SEED: bool = True
    
    # Firebase (Optional credentials path for production token verification)
    FIREBASE_CREDENTIALS_PATH: str = os.getenv("FIREBASE_CREDENTIALS_PATH", "")
    
    # Storage
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    MAX_UPLOAD_SIZE_MB: int = 10
    
    # AI Matching Engine Models & Weights
    USE_NEURAL_MODELS: bool = os.getenv("USE_NEURAL_MODELS", "false").lower() in ("true", "1", "yes")
    SENTENCE_TRANSFORMER_MODEL: str = os.getenv("SENTENCE_TRANSFORMER_MODEL", "all-MiniLM-L6-v2")
    OPENCLIP_MODEL: str = os.getenv("OPENCLIP_MODEL", "ViT-B-32")
    OPENCLIP_PRETRAINED: str = os.getenv("OPENCLIP_PRETRAINED", "laion2b_s34b_b79k")
    
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

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS:
            return []
        return [orig.strip() for orig in self.CORS_ORIGINS.split(",") if orig.strip()]

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        env = self.APP_ENV.lower()
        if env == "production":
            # 1. Enforce strict SECRET_KEY
            if not self.SECRET_KEY or self.SECRET_KEY == DEFAULT_INSECURE_SECRET or len(self.SECRET_KEY) < 32:
                raise ValueError("In production, SECRET_KEY must be a cryptographically secure random secret of at least 32 characters.")
            
            # 2. Enforce PostgreSQL
            if self.DATABASE_URL.startswith("sqlite"):
                raise ValueError("SQLite is prohibited in production. Configure a production PostgreSQL database with pgvector.")
            
            # 3. Disable debug, demo accounts and auto-seeding
            self.DEBUG = False
            self.ENABLE_DEMO_LOGIN = False
            self.ENABLE_AUTO_SEED = False
        return self

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

