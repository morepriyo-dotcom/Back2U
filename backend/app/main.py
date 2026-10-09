import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.seed_data import seed_database

# Import routers
from app.routers import (
    auth,
    items,
    matching,
    claims,
    recovery,
    rewards,
    marketplace,
    notifications,
    admin,
    upload
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema
    Base.metadata.create_all(bind=engine)
    
    # Run seed data
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
        
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    yield

app = FastAPI(
    title=settings.APP_NAME,
    description="Back2U AI-Powered Lost & Found Platform REST API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploads
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include Routers
app.include_router(auth.router)
app.include_router(items.router)
app.include_router(matching.router)
app.include_router(claims.router)
app.include_router(recovery.router)
app.include_router(rewards.router)
app.include_router(marketplace.router)
app.include_router(notifications.router)
app.include_router(admin.router)
app.include_router(upload.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Back2U Backend API",
        "environment": settings.APP_ENV,
        "ai_engine": {
            "status": "online",
            "model": "Multi-Modal Weighted Ranking (OpenCLIP + Sentence Transformer)",
            "weights": {
                "image_similarity": settings.WEIGHT_IMAGE,
                "text_similarity": settings.WEIGHT_TEXT,
                "location_proximity": settings.WEIGHT_LOCATION,
                "date_proximity": settings.WEIGHT_DATE
            }
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
